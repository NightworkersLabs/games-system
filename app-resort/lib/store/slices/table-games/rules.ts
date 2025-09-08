import { BigNumber } from 'ethers'
import { StoreSlice } from 'lib/store/_'
import { IWeb3Slice } from '../web3'
import { ITableGamesSlice } from './user-context'

export interface ITableGamesRulesSlice {
    //
    currencyMaxBet?: BigNumber
    currencyMinBet?: BigNumber

    //
    tgBasePtsTaxOnWin?: number
    minimumRollingFundsExpected?: BigNumber
    minimumBalanceEnsured?: BigNumber
    flatExcedentaryFundsExpected?: BigNumber

    //
    tableGamesRulesFetched?: boolean
    mayUpdateTableGamesRules: () => Promise<void>
}

const slice: StoreSlice<ITableGamesRulesSlice, IWeb3Slice & ITableGamesSlice> = (set, get) => ({
  //
  mayUpdateTableGamesRules: async () => {
    //
    if (get().tableGamesRulesFetched) return

    //
    const tgc = get().tableGamesContract

    //
    const [
      currencyMaxBet,
      currencyMinBet,
      minimumRollingFundsMultiplier,
      tgBasePtsTaxOnWin,
      minimumBalanceEnsured,
      flatExcedentaryFundsExpected
    ] = await Promise.all([
      tgc.CURRENCY_MAX_BET() as Promise<BigNumber>,
      tgc.CURRENCY_MIN_BET() as Promise<BigNumber>,
      tgc.minimumRollingFundsMultiplier() as Promise<number>,
      tgc.taxOnGainsInBasePoints() as Promise<number>,
      tgc.minimumBalanceEnsured() as Promise<BigNumber>,
      tgc.flatExcedentaryFundsExpected() as Promise<BigNumber>
    ])

    //
    const rouletteBetAmount = get().rouletteBetAmount
    const coinBetAmount = get().coinBetAmount

    //
    set({
      tableGamesRulesFetched: true,
      //
      currencyMaxBet,
      currencyMinBet,
      tgBasePtsTaxOnWin,
      minimumRollingFundsExpected: currencyMaxBet.mul(minimumRollingFundsMultiplier),
      coinBetAmount: coinBetAmount.isZero() ? currencyMinBet : coinBetAmount,
      rouletteBetAmount: rouletteBetAmount.isZero() ? currencyMinBet : rouletteBetAmount,
      minimumBalanceEnsured,
      flatExcedentaryFundsExpected
    })
  }
})

export default slice
