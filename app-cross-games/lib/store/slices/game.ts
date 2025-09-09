import type { BigNumber } from 'ethers'

import type {IMonitoredPromise} from '#/lib/MonitoredPromise';
import { delay, mergeMapDoAll } from '#/lib/MonitoredPromise'
import { SingleExecPromise } from '#/lib/SingleExecPromise'
import type { StoreSlice } from '#/lib/store/_'
import type { ICasinoBankRulesSlice } from '#/lib/store/slices/casino-bank/rules'
import type { IWeb3Slice } from '#/lib/store/slices/web3'

export interface IGameSlice {
  //
  useProvablyFairness: boolean
  setProvablyFairnessUsage: (useIt: boolean) => void

  //
  skipProvablyFairExplaination: boolean
  setSkipProvablyExplaination: (useIt: boolean) => void

  //
  initialDataFetchingProgress?: [number, number]

  //
  userBalance?: BigNumber
  /** @dev please, prevent concurrent calls to "getBalance" as it automatically polls for 10secs until the next block is ensured to be minted ! */
  updateUserBalance$: SingleExecPromise<void>
}

export interface IInitialDataFetchingSlice {
    fetchAllInitialData: () => Promise<void>
}

interface IPrivateSlice {
    _fetchAllInitialData: (rules: IMonitoredPromise[], data: IMonitoredPromise[]) => Promise<void>
    _incrementInitialDataFetchingProgress: () => void
    /** @dev please, prevent concurrent calls to "getBalance" as it automatically polls for 10secs until the next block is ensured to be minted ! */
    _updateUserBalance: () => Promise<void>
}

//
const slice: StoreSlice<IGameSlice & IPrivateSlice & IInitialDataFetchingSlice, IWeb3Slice & ICasinoBankRulesSlice> = (set, get) => ({
  //
  useProvablyFairness: true,
  setProvablyFairnessUsage: useIt => set({ useProvablyFairness: useIt }),
  //
  skipProvablyFairExplaination: false,
  setSkipProvablyExplaination: useIt => set({ skipProvablyFairExplaination: useIt }),
  //
  updateUserBalance$: SingleExecPromise.from(() => get()._updateUserBalance()),
  _updateUserBalance: async () => {
    /** @dev please, prevent concurrent calls to "getBalance" as it automatically polls for 10secs until the next block is ensured to be minted ! */
    const userBalance = await get().signer.getBalance()
    set({ userBalance })
  },
  //
  fetchAllInitialData: () => get()._fetchAllInitialData([
    { name: 'Casino Rules', promiser: get().mayUpdateCasinoBankRules }
  ], [
    // { name: 'User Balance', promiser: get().updateUserBalance$ }
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
    set({
      dAppState: 'Ready',
      readiedOnce: true
    })
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
