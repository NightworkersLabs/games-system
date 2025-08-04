import { StoreSlice } from 'lib/store/_'
import { getMeaningfulMessageFromError } from 'lib/EthersErrorDigger'
import { SingleExecPromise } from 'lib/SingleExecPromise'
import { Contract } from 'ethers'
import { Web3Provider, JsonRpcSigner } from '@ethersproject/providers'
import MetaMaskOnboarding from '@metamask/onboarding'

import { IInitialDataFetchingSlice } from './game'
import { AvailableNetwork, toHex } from 'env/networksCompiler'
import { handledNetworks, handledChainIds, deployed, getCompiledNetworkHex, ExtraCompiledNetwork, networksByChainId } from 'lib/TypedNetworks'

import CasinoBankABI from 'public/abi/CasinoBank.json'
import EventEmitter from 'events'
import { BacklinkReference, BacklinkTracker } from 'lib/Backlinking'

//
declare global {
    interface Window {
        ethereum?: any
    }
}

//
export type DAppState = 'Idle'
    | 'WaitingOnMetaMaskInstallation'
    | 'MetaMaskHanging'
    | 'MetaMaskFailure'
    | 'SelectingNetwork'
    | 'WaitingOnMetamask'
    | 'ContractsInitialized'
    | 'FetchingInitialData'
    | 'SetupFromDataFailed'
    | 'Reloading'
    | 'Ready'

//
export interface CurrentNetwork {
  /** chain ID of blockchain currently connected to, in hex representation (0x...) */
  chainIdHex?: string
  /** chain ID of blockchain currently connected to */
  chainId?: number
}

//
export interface PreferredNetworkSession {
  network: AvailableNetwork,
  latestTrackerName: BacklinkTracker
}

//
export interface IWeb3Slice {
  //
  dAppState: DAppState
  /** whenever the dApp has been ready once during current dApp session lifecycle */
  readiedOnce?: true

  //
  casinoBankContract?: Contract

  //
  currentNetwork?: CurrentNetwork & Partial<ExtraCompiledNetwork>
  /** currenty prefered network name, that will be used to determine to which network instantiate contracts interface from */
  preferredNetworkName?: AvailableNetwork
  connectToPreferredNetwork: (network: AvailableNetwork) => void
  /** */
  implicitPreferredNetworkChange?: PreferredNetworkSession

  //
  prepareWeb3Provider: () => Promise<void>
  provider?: Web3Provider

  //
  signer?: JsonRpcSigner
  currentEOAAddress?: string

  //
  getExplorerUrl: (path?: string) => string
  getContractExplorerUrl: (contractAddress: string) => string

  //
  currentBacklink?: BacklinkReference
  initiateWeb3: (provider: Web3Provider, backlinkedFrom: BacklinkReference, preferredNetwork: AvailableNetwork) => (() => void)
  connectWallet: () => Promise<void>
  isCurrentDAppState: (state: DAppState) => boolean

  //
  selectingNetwork: () => void
}

interface IPrivateSlice {
    //
    _requirePersistingNetworkPreferences: (toPersist: PreferredNetworkSession) => void
    _setPreferredNetwork: (network: AvailableNetwork) => void
    _connectWallet: () => Promise<void>
    /** @return whenever current chain has effectively changed */
    _maySwitchChain: () => Promise<boolean | { stop : true }>
    /** @return whenever current chain has effectively changed */
    _addAndSwitchChain: (network: AvailableNetwork) => Promise<boolean>
    _initiateFromAccount: (signerAddress: string) => Promise<void>
    _initiateContracts: (signerAddress: string) => Promise<void>
    _initiateContracts$: SingleExecPromise<string>

    //
    switchingChain: boolean

    //
    _reloadWindow: () => void

    //
    _bindProviderEvents: (provider: Web3Provider) => (() => void)
    _metamaskOnDisconnect: (error?: any) => void
    _metamaskOnChainChanged: (chainId: string) => void
    _metamaskOnAccountsChanged: (accounts: Array<string>) => void

    //
    _handleMMError: (err: any) => void
}

const slice: StoreSlice<IWeb3Slice & IPrivateSlice, IInitialDataFetchingSlice> = (set, get) => ({
  //
  dAppState: 'Idle',

  //
  switchingChain: false,

  //
  isCurrentDAppState: state => get().dAppState === state,

  //
  _handleMMError: err => {
    // logs error
    console.log(err)

    // resets currently prefered network
    get()._requirePersistingNetworkPreferences({
      latestTrackerName: get().currentBacklink?.uniqueDashboardName,
      network: null
    })

    //
    set({ dAppState: 'MetaMaskFailure' })

    //
    const meaningfulErrMsg = getMeaningfulMessageFromError(err)
    throw new Error(meaningfulErrMsg)
  },

  //
  //
  //

  //
  _requirePersistingNetworkPreferences: toPersist => set({ implicitPreferredNetworkChange: toPersist }),

  //
  connectToPreferredNetwork: network => {
    //
    get()._requirePersistingNetworkPreferences({
      latestTrackerName: get().currentBacklink?.uniqueDashboardName,
      network
    })

    //
    get()._setPreferredNetwork(network)

    //
    get().connectWallet()
  },

  //
  _setPreferredNetwork: network =>
    set({ preferredNetworkName: network }),
  //
  getContractExplorerUrl: contractAddress => {
    return get().getExplorerUrl(`/address/${contractAddress}`)
  },

  //
  getExplorerUrl: path => {
    //
    const currN = get().currentNetwork

    //
    return currN != null && ('explorer' in currN)
      ? `${currN.explorer}${path}`
      : null
  },

  //
  selectingNetwork: () => {
    // whenever asking to select an handled network...
    if (get().readiedOnce) {
      // if already readied, ask removing of preferred network
      get()._requirePersistingNetworkPreferences({
        latestTrackerName: get().currentBacklink?.uniqueDashboardName,
        network: null
      })

      // launches a reload
      get()._reloadWindow()
    //
    } else {
      set({ dAppState: 'SelectingNetwork' })
    }
  },

  //
  //
  //

  //
  prepareWeb3Provider: async () => {
    //
    if (!MetaMaskOnboarding.isMetaMaskInstalled()) {
      return set({ dAppState: 'WaitingOnMetaMaskInstallation' })
    }

    // @dev define temporary as failing, since MetaMask could silently fail
    set({ dAppState: 'MetaMaskHanging' })

    // @dev tries to wake up metamask as it might hang at startup. If responding to this call, should be alright to continue
    window.ethereum.isConnected()

    // @dev not setting 'any' makes network changes briefly throw errors on provider, we do not want that for UX
    const provider = new Web3Provider(window.ethereum, 'any')

    // get current network infos
    const pCurrentNetwork = await provider.getNetwork()

    // try to find associated infos
    const pCompiledNetwork = networksByChainId[pCurrentNetwork.chainId]

    // MetaMask responded, keep going
    set({
      dAppState: 'WaitingOnMetamask',
      provider,
      currentNetwork: pCompiledNetwork == null
        ? {
          chainId: pCurrentNetwork.chainId,
          chainIdHex: toHex(pCurrentNetwork.chainId)
        }
        : pCompiledNetwork
    })
  },

  //
  _bindProviderEvents: web3Provider => {
    //
    const provider = web3Provider.provider as EventEmitter

    //
    provider.on('chainChanged', get()._metamaskOnChainChanged)
    provider.on('accountsChanged', get()._metamaskOnAccountsChanged)
    provider.on('disconnect', get()._metamaskOnDisconnect)

    //
    return () => {
      provider.removeListener('chainChanged', get()._metamaskOnChainChanged)
      provider.removeListener('accountsChanged', get()._metamaskOnAccountsChanged)
      provider.removeListener('disconnect', get()._metamaskOnDisconnect)
    }
  },

  //
  initiateWeb3: (provider, backlinkedFrom, preferredNetworkName) => {
    // simply bind basic provider events
    const unbind = get()._bindProviderEvents(provider)

    //
    set({ currentBacklink: backlinkedFrom })

    //
    get()._setPreferredNetwork(preferredNetworkName)

    // auto-connect
    get().connectWallet()

    //
    return unbind
  },

  //
  _reloadWindow: () => {
    set({ dAppState: 'Reloading' })
  },

  //
  //
  //

  //
  _metamaskOnDisconnect: () => {
    // if has not readied once, could be part of a chain switch, skip
    if (!get().readiedOnce) {
      return
    }

    //
    get()._reloadWindow()
  },

  //
  _metamaskOnChainChanged: newChainId => {
    // already the same chain ID OR app not completely loaded ? nothing to do
    if (get().currentNetwork?.chainIdHex === newChainId) return

    // if happening after the app has been ready...
    if (get().readiedOnce) {
      // check if new chain is an handled one...
      const handledNetwork = getCompiledNetworkHex(newChainId)

      // if so :
      if (handledNetwork) {
        // ask it to be marked for session storage
        get()._requirePersistingNetworkPreferences({
          latestTrackerName: get().currentBacklink?.uniqueDashboardName,
          network: handledNetwork.name
        })
      }

      // simply reload app...
      get()._reloadWindow()
    //
    } else {
      // else, refresh wallet connection attempt
      get().connectWallet()
    }
  },

  //
  _metamaskOnAccountsChanged: ([account]) => {
    // if switching account to an already logged in account do nothing
    if (account === get().currentEOAAddress) {
      return
    }

    // if no account provided (most probably caused by a soft disconnect) OR handling an account switch after sucessful app readying, consider a reload
    if (account == null || get().readiedOnce) {
      return get()._reloadWindow()
    }

    // if preregistered to dApp with current account BUT with current network is not picked yet, ignore
    if (get().currentNetwork?.chainIdHex == null || get().switchingChain) {
      return
    }

    // else... reinitiate
    get()._initiateFromAccount(account)
      .catch(get()._handleMMError)
  },

  //
  //
  //

  //
  _maySwitchChain: async () => {
    //
    // CHECK: whenever a preferred chain has already been selected
    //

    let preferredNetworkInfos : ExtraCompiledNetwork = null

    // if only a single handled chain...
    if (handledChainIds.length === 1) {
      // use this one !
      preferredNetworkInfos = networksByChainId[handledChainIds[0]]
    } else {
      // get the associated chain with preferred name
      preferredNetworkInfos = handledNetworks[get().preferredNetworkName]

      // if no preferred network, or preferred network does not exist or is not handled
      if (preferredNetworkInfos == null) {
        // requires user to select a proper network
        get().selectingNetwork()

        // skip
        return { stop: true }
      }
    }

    //
    // CHECK: whenever current connected chain is the preferred one
    //

    //
    set({ dAppState: 'WaitingOnMetamask' })

    // if already connected to preferred network...
    if (get().currentNetwork?.chainId === preferredNetworkInfos.chainId) {
      // set preferred network infos as current
      set({
        currentNetwork: preferredNetworkInfos
      })

      // skip connection attempt
      return false
    }

    //
    // EXEC: try to connect to preferred network ...
    //

    // try to switch to the default configuration-provided chain ID
    return get().provider.send('wallet_switchEthereumChain', [{ chainId: preferredNetworkInfos.chainIdHex }])
      .catch(error => {
        //
        if (error.code === 4902 || error.code === -32603) {
          // These error codes indicate that the chain has not been added to MetaMask. If it is not, then install it into the user MetaMask
          return get()._addAndSwitchChain(preferredNetworkInfos.name)
        //
        } else if (error.code === -32002) {
          // This error code indicates that a chain switch is already ongoing, just skip
          return false
        }

        //
        throw error
      //
      })
      .then(async chainShouldBeChecked => {
        // if chain should not be checked
        if (chainShouldBeChecked === false) {
          // no need to go further, something wrong happened
          return { stop: true }
        }

        // check again that chain has changed (MetaMask can false-positive wallet_switchEthereumChain)
        const chainIdHex = await get().provider.send('eth_chainId', [])

        // if is different (should not since we expected it to change)
        if (chainIdHex !== preferredNetworkInfos.chainIdHex) {
          // throws...
          throw new Error('MetaMask could not switch to expected chain. Please change it manually.')
        }

        // else, means MetaMask has effectively changed to preferred chain
        set({
          currentNetwork: preferredNetworkInfos
        })

        // indicate the successful change
        return true
      })
  },

  //
  _addAndSwitchChain: async (network) =>
    get().provider.send('wallet_addEthereumChain', [
      formatChain(network)
    ])
      .then(() => true)
      .catch(err => {
        // might reject with -32602, means that we cannot push the chain (most probably because provided URL is HTTP)
        // tell the user to add the chain manually
        const HTTPRejection = err.code === -32602

        // forward error
        if (!HTTPRejection) throw err

        //
        return false
      }),

  //
  //
  //

  //
  connectWallet: () =>
    get()._connectWallet()
      .catch(get()._handleMMError),

  //
  _connectWallet: async () => {
    set({ switchingChain: true })
    // try to switch to expected network first (important to respect MM Mobile auth flow and prevent errors with later account request)
    const result = await get()._maySwitchChain()
    set({ switchingChain: false })

    //
    if (typeof result !== 'boolean') {
      return
    }

    // then, request usage of an EOA account from Metamask, response will be intercepted as an event
    return (get().provider.send('eth_requestAccounts', []) as Promise<string[]>)
      .then(([account]) => get()._initiateFromAccount(account))
      // if fails...
      .catch(e => {
        // this code means a connection attempt is already pending. Since events will retrigger account initiation, skip this connection attempt
        if (e?.code === -32002) {
          return
        }

        // else, unexpected error !
        get()._handleMMError(e)
      })
  },

  //
  //
  //

  //
  _initiateContracts$: SingleExecPromise.from(
    signerAddress => get()._initiateContracts(signerAddress),
    state => {
      if (typeof state === 'string') {
        set({ dAppState: 'SetupFromDataFailed' })
      }
    }),

  //
  _initiateFromAccount: async account => get()._initiateContracts$.raiseAndWait(account),

  //
  _initiateContracts: async signerAddress => {
    // Init contracts
    const signer = get().provider.getSigner(signerAddress)

    //
    const { name } = get().currentNetwork

    //
    set({
      casinoBankContract: new Contract(
        deployed.CasinoBank[name][0],
        CasinoBankABI,
        signer
      ),
      //
      signer,
      currentEOAAddress: signerAddress,
      dAppState: 'ContractsInitialized'
    })

    //
    await get().fetchAllInitialData()
  }
})

// from https://docs.metamask.io/guide/rpc-api.html#wallet-addethereumchain
interface AddEthereumChainParameter {
  chainId: string; // A 0x-prefixed hexadecimal string
  chainName: string;
  nativeCurrency: {
      name: string;
      symbol: string; // 2-6 characters long
      decimals: 18;
  };
  rpcUrls: string[];
  blockExplorerUrls?: string[];
  iconUrls?: string[]; // Currently ignored.
}

// https://docs.metamask.io/guide/rpc-api.html#wallet-addethereumchain
function formatChain (chainName: AvailableNetwork) : AddEthereumChainParameter {
  //
  const network = handledNetworks[chainName]

  //
  if (network == null) return null

  //
  return {
    blockExplorerUrls: 'explorer' in network ? [network.explorer] : undefined,
    chainName: network.networkName,
    chainId: toHex(network.chainId),
    rpcUrls: [network.url],
    nativeCurrency: {
      decimals: 18,
      name: network.currencyName,
      symbol: network.currencyName
    }
  }
}

export default slice
