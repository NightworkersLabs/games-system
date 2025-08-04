import { StoreSlice } from 'lib/store/_'
import { SingleExecPromise } from 'lib/SingleExecPromise'

import { IWeb3Slice } from './web3'
import { BigNumber } from 'ethers'
import { IMintSlice } from './mint/user-context'
import { IStakeSlice } from './stake/user-context'
import { ILotterySlice } from './lottery/user-context'
import { INFTCollectionSlice } from './stake/nft-collection'

import { IMintRulesSlice } from './mint/rules'
import { IStakeRulesSlice } from './stake/rules'
import { ILotteryRulesSlice } from './lottery/rules'
import { ITableGamesRulesSlice } from './table-games/rules'
import { ITableGamesSlice } from './table-games/user-context'
import { IVaultSlice } from './vault/user-context'

import { delay, IMonitoredPromise, mergeMapDoAll } from 'lib/MonitoredPromise'

export interface IGameSlice {
  //
  useProvablyFairness: boolean
  setProvablyFairnessUsage: (useIt: boolean) => void

  //
  NWERC20Balance?: BigNumber

  //
  refreshBalances: () => Promise<void>

  getNWERC20Balance$: SingleExecPromise

  //
  userBalance?: BigNumber
  /** @dev please, prevent concurrent calls to "getBalance" as it automatically polls for 10secs until the next block is ensured to be minted ! */
  updateUserBalance$: SingleExecPromise<void>

  //
  checkOwnership: () => Promise<void>
  isAdmin?: boolean

  //
  initialDataFetchingProgress?: [number, number]
}

export interface IInitialDataFetchingSlice {
    fetchAllInitialData: () => Promise<void>
}

interface IPrivateSlice {
    _updateNWERC20Balance: () => Promise<void>
    _fetchAllInitialData: (rules: IMonitoredPromise[], data: IMonitoredPromise[]) => Promise<void>
    _incrementInitialDataFetchingProgress: () => void
    /** @dev please, prevent concurrent calls to "getBalance" as it automatically polls for 10secs until the next block is ensured to be minted ! */
    _updateUserBalance: () => Promise<void>
}

type IRulesSlice = IMintRulesSlice & IStakeRulesSlice & ILotteryRulesSlice & ITableGamesRulesSlice
type IUserContextSlice = INFTCollectionSlice & IStakeSlice & IMintSlice & ILotterySlice & ITableGamesSlice & IVaultSlice

//
const slice: StoreSlice<IGameSlice & IPrivateSlice & IInitialDataFetchingSlice, IWeb3Slice & IRulesSlice & IUserContextSlice> = (set, get) => ({
  //
  useProvablyFairness: true,
  setProvablyFairnessUsage: (useIt) => set({ useProvablyFairness: useIt }),
  //
  updateUserBalance$: SingleExecPromise.from(() => get()._updateUserBalance()),
  _updateUserBalance: async () => {
    /** @dev please, prevent concurrent calls to "getBalance" as it automatically polls for 10secs until the next block is ensured to be minted ! */
    const userBalance = await get().signer.getBalance()
    set({ userBalance })
  },
  //
  getNWERC20Balance$: SingleExecPromise.from(() => get()._updateNWERC20Balance()),
  _updateNWERC20Balance: async () => {
    const NWERC20Balance = await get().NWERC20Contract.balanceOf(get().currentEOAAddress)
    set({ NWERC20Balance })
  },
  //
  checkOwnership: async () => set({
    isAdmin: (await get().mintingContract.owner() as string).toLowerCase() === get().currentEOAAddress
  }),
  refreshBalances: async () => Promise.all([
    get().getNWERC20Balance$.raiseAndWait(),
    get().updateUserBalance$.raiseAndWait()
  ]).then(),
  fetchAllInitialData: () => get()._fetchAllInitialData([
    { name: 'Mint Rules', promiser: get().mayUpdateMintRules },
    { name: 'Staking Rules', promiser: get().mayUpdateStakeRules },
    { name: 'Lottery Rules', promiser: get().mayUpdateLotteryRules },
    { name: 'Table Games Rules', promiser: get().mayUpdateTableGamesRules }
  ], [
    //
    { name: 'Ownership', promiser: get().checkOwnership },
    // { name: 'Balances', promiser: get().refreshBalances },
    // Get base game state
    { name: 'Mint Context', promiser: get().updateUserMintingContext$ },
    { name: 'NFTs', promiser: get().syncOwnedNFTs$ },
    { name: 'Lottery Context', promiser: get().updateLotteryContext$ },
    { name: 'Tables Games Context', promiser: get().updateTableGamesContext$ },
    { name: 'Staking Context', promiser: get().updateRLDContext$ },
    { name: 'Backroom Context', promiser: get().updateBackroomContext$ }
  ]),
  _fetchAllInitialData: async (rules, data) => {
    // + 1 for UX spacer
    const tasksCount = rules.length + data.length + 1

    //
    set({
      dAppState: 'FetchingInitialData',
      initialDataFetchingProgress: [0, tasksCount]
    })

    //
    const addToProgress = get()._incrementInitialDataFetchingProgress

    //
    await Promise.allSettled([
      // first, fetch rules
      mergeMapDoAll(rules, addToProgress)
        // ... then, fetch data
        .then(() => mergeMapDoAll(data, addToProgress)),
      // 1s animation spacer for UX
      delay(1_000).then(addToProgress)
    ])

    //
    set({ dAppState: 'Ready' })
  },
  _incrementInitialDataFetchingProgress: () => {
    //
    const initialDataFetchingProgress = get().initialDataFetchingProgress

    //
    set({
      initialDataFetchingProgress: [
        initialDataFetchingProgress[0] + 1,
        initialDataFetchingProgress[1]
      ]
    })
  }
})

export default slice
