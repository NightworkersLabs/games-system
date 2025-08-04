import { StoreSlice } from 'lib/store/_'
import { IWeb3Slice } from '../web3'
import { ILotterySlice } from './user-context'

export interface ILotteryRulesSlice {
    //
    lotteryBasePtsTaxOnWin?: number

    //
    lotteryRulesFetched: boolean
    mayUpdateLotteryRules: () => Promise<void>
}

const slice: StoreSlice<ILotteryRulesSlice, IWeb3Slice & ILotterySlice> = (set, get) => ({
  //
  lotteryRulesFetched: false,
  mayUpdateLotteryRules: async () => {
    //
    if (get().lotteryRulesFetched === true) return

    //
    set({
      lotteryBasePtsTaxOnWin: await get().lotteryContract.taxOnGainsInBasePoints() as number,
      lotteryRulesFetched: true
    })
  }
})

export default slice
