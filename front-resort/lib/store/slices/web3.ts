import { StoreSlice } from 'lib/store/_'
import { getMeaningfulMessageFromError } from 'lib/EthersErrorDigger'
import { SingleExecPromise } from 'lib/SingleExecPromise'
import { BigNumber, Contract } from 'ethers'
import { Web3Provider, JsonRpcSigner } from '@ethersproject/providers'
import MetaMaskOnboarding from '@metamask/onboarding'

import {
  getEnvChain,
  getEnvChainIdAsHex,
  getEnvNWERC20Signature,
  getNWERC721Contract,
  getStakingContract,
  getNWERC20Contract,
  NetworkToAdd,
  isTestnet,
  getLotteryContract,
  getTableGamesContract,
  getBackroomContract
} from 'env/defaults'
import { IInitialDataFetchingSlice } from './game'

declare global {
    interface Window {
        ethereum?: any;
    }
}

export type DAppState = 'Idle'
    | 'WaitingOnMetaMaskInstallation'
    | 'MetaMaskHanging'
    | 'MetaMaskFailure'
    | 'WaitingOnMetamask'
    | 'ProviderReady'
    | 'FetchingInitialData'
    | 'SetupFromDataFailed'
    | 'Reloading'
    | 'Ready'

export interface IWeb3Slice {
  //
  dAppState: DAppState

  //
  mintingContract?: Contract
  stakingContract?: Contract
  NWERC20Contract?: Contract
  lotteryContract?: Contract
  tableGamesContract?: Contract
  backroomContract?: Contract

  /** chain ID of blockchain currently connected to, in hex representation (0x...) */
  chainIdHex?: string
  /** chain ID of blockchain currently connected to */
  chainId?: number

  //
  provider?: Web3Provider
  signer?: JsonRpcSigner
  currentEOAAddress?: string

  //
  getExplorerUrl: (path?: string) => string
  getContractExplorerUrl: (contractAddress: string) => string

  //
  L2NetworkToManuallyInsert?: NetworkToAdd

  //
  initiateWeb3: () => (() => void)
  connectWallet: () => Promise<void>
  isCurrentDAppState: (state: DAppState) => boolean

  //
  addNWERC20AsWatchedAsset: () => Promise<void>
}

interface IPrivateSlice {
    //
    _connectWallet: () => Promise<void>
    _maySwitchChain: () => Promise<boolean>
    _addAndSwitchChain: () => Promise<boolean>
    _initiateFromAccount: (signerAddress: string) => Promise<void>
    _initiateContracts: (signerAddress: string) => Promise<void>
    _initiateContracts$: SingleExecPromise<string>

    //
    _reloadWindow: () => void
    _reloadProvider: () => Web3Provider

    //
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
  isCurrentDAppState: state => get().dAppState === state,

  //
  _initiateContracts$: SingleExecPromise.from(
    signerAddress => get()._initiateContracts(signerAddress),
    state => {
      if (typeof state === 'string') {
        set({ dAppState: 'SetupFromDataFailed' })
      }
    }),

  //
  getContractExplorerUrl: contractAddress => {
    return get().getExplorerUrl(`/address/${contractAddress}`)
  },

  //
  getExplorerUrl: path => `https://${isTestnet(get().chainIdHex) ? 'testnet.' : ''}snowtrace.io${path}`,

  initiateWeb3: () => {
    //
    if (!MetaMaskOnboarding.isMetaMaskInstalled()) {
      set({ dAppState: 'WaitingOnMetaMaskInstallation' })
      return () => {}
    }

    //
    window.ethereum.on('chainChanged', get()._metamaskOnChainChanged)
    window.ethereum.on('accountsChanged', get()._metamaskOnAccountsChanged)
    window.ethereum.on('disconnect', get()._metamaskOnDisconnect)

    //
    get()._reloadProvider()
    get().connectWallet()

    //
    return () => {
      window.ethereum.removeListener('chainChanged', get()._metamaskOnChainChanged)
      window.ethereum.removeListener('accountsChanged', get()._metamaskOnAccountsChanged)
      window.ethereum.removeListener('disconnect', get()._metamaskOnDisconnect)
    }
  },
  _reloadProvider: () => {
    // not setting 'any' makes network changes briefly throw errors on provider
    const provider = new Web3Provider(window.ethereum, 'any')
    set({ provider })
    return provider
  },
  //
  _reloadWindow: () => {
    set({ dAppState: 'Reloading' })
  },
  _metamaskOnDisconnect: () => get()._reloadWindow(),
  _metamaskOnChainChanged: newChainId => {
    // already the same chain ID OR app not completely loaded ? nothing to do
    if (get().chainIdHex === newChainId) return

    //
    get()._reloadWindow()
  },
  _metamaskOnAccountsChanged: ([account]) => {
    // if switching account to an already logged in account do nothing
    if (account === get().currentEOAAddress) {
      return
    }

    // if no account provided (most probably caused by a soft disconnect) OR handling an account switch after sucessful app readying, consider a reload
    if (account == null || get().dAppState === 'Ready') {
      return get()._reloadWindow()
    }

    // if preregistered to dApp with current account BUT with current network is not picked yet, ignore
    if (get().chainIdHex == null) {
      return
    }

    // else... reinitiate
    get()._initiateFromAccount(account)
      .catch(get()._handleMMError)
  },
  _initiateFromAccount: async account =>
    get()._initiateContracts$.raiseAndWait(account),
  _maySwitchChain: async () => {
    //
    const envChainId = getEnvChainIdAsHex()
    if (get().chainIdHex === envChainId) return

    // try to switch to the default configuration-provided chain ID
    return get().provider.send('wallet_switchEthereumChain', [{ chainId: envChainId }])
      .catch(error => {
        //
        if (error.code === 4902 || error.code === -32603) {
          // These error codes indicate that the chain has not been added to MetaMask, if it is not, then install it into the user MetaMask
          return get()._addAndSwitchChain()
        } else if (error.code === -32002) {
          // This error code indicates that a chain switch is already ongoing, just skip
          return false
        }

        //
        throw error
      })
      .then(async chainShouldBeChecked => {
        //
        if (chainShouldBeChecked === false) {
          return false
        }

        //
        const provider = get()._reloadProvider()

        //
        const chainIdHex = await provider.send('eth_chainId', [])

        //
        if (chainIdHex !== envChainId) {
          throw new Error('MetaMask could not switch to expected chain. Please change it manually.')
        }

        // MetaMask chain has changed to prefered chain
        set({
          chainIdHex,
          // realistically castable into number
          chainId: BigNumber.from(chainIdHex).toNumber()
        })
        return true
      })
  },
  //
  _addAndSwitchChain: async () =>
    get().provider.send('wallet_addEthereumChain', [getEnvChain()])
      .then(() => {
        set({ L2NetworkToManuallyInsert: undefined })
        return true
      })
      .catch(err => {
        // might reject with -32602, means that we cannot push the chain (most probably because provided URL is HTTP)
        // tell the user to add the chain manually
        const HTTPRejection = err.code === -32602
        set({
          L2NetworkToManuallyInsert: HTTPRejection
            ? NetworkToAdd.getDefault()
            : undefined
        })

        // forward error
        if (!HTTPRejection) throw err
        return false
      }),
  connectWallet: async () => {
    return get()._connectWallet()
      .catch(get()._handleMMError)
  },
  _connectWallet: async () => {
    // define temporary as failing, since MetaMask could silently fail
    set({ dAppState: 'MetaMaskHanging' })
    await window.ethereum._metamask.isUnlocked()
    set({ dAppState: 'WaitingOnMetamask' }) // MetaMask responded, keep going

    // try to switch to expected network first (important to respect MM Mobile auth flow and prevent errors with later account request)
    await get()._maySwitchChain()

    // then, request usage of an EOA account from Metamask, response will be intercepted as an event
    const [account] = await get().provider.send('eth_requestAccounts', []) as string[]

    //
    await get()._initiateFromAccount(account)
  },
  _handleMMError: err => {
    set({ dAppState: 'MetaMaskFailure' })
    const meaningfulErrMsg = getMeaningfulMessageFromError(err)
    throw new Error(meaningfulErrMsg)
  },
  addNWERC20AsWatchedAsset: async () =>
  // using Web3Provider does not work :(
    window.ethereum.request({
      method: 'wallet_watchAsset',
      params: getEnvNWERC20Signature()
    }),

  _initiateContracts: async signerAddress => {
    // Init contracts
    const signer = get().provider.getSigner(signerAddress)

    set({
      mintingContract: getNWERC721Contract(signer),
      stakingContract: getStakingContract(signer),
      NWERC20Contract: getNWERC20Contract(signer),
      lotteryContract: getLotteryContract(signer),
      tableGamesContract: getTableGamesContract(signer),
      backroomContract: getBackroomContract(signer),
      //
      signer,
      currentEOAAddress: signerAddress,
      dAppState: 'ProviderReady'
    })

    //
    await get().fetchAllInitialData()
  }
})

export default slice
