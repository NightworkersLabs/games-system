import { BigNumber } from 'ethers'

import type { StoreSlice } from '#/lib/store/_'
import type { IWeb3Slice } from '#/lib/store/slices/web3'

export interface ICasinoBankRulesSlice {
    //
    singleChipPrice?: BigNumber
    maxChipsBuyableAtOnce?: number
    chipsBuyBasePointsTax?: number
    maxChipsPerBet?: number

    //
    casinoBankRulesFetched: boolean
    mayUpdateCasinoBankRules: () => Promise<void>

    //
    getGrossCurrencyFromChips: (howManyChips: number) => BigNumber
    getNetCurrencyFromChips: (howManyChips: number) => BigNumber
    getMaxChipsBuyableFromBalance: (balance: BigNumber | null) => number
}

const slice: StoreSlice<ICasinoBankRulesSlice, IWeb3Slice> = (set, get) => ({
  //
  casinoBankRulesFetched: false,
  getGrossCurrencyFromChips: howManyChips => {
    const scp = get().singleChipPrice
    if (scp == null) return BigNumber.from(0)
    return scp.mul(howManyChips)
  },
  getMaxChipsBuyableFromBalance: balance => {
    //
    if (balance == null) return 0
    const singleChipPrice = get().getNetCurrencyFromChips(1)
    if (singleChipPrice == null || singleChipPrice.isZero()) return 0

    //
    return balance.div(singleChipPrice).toNumber()
  },
  getNetCurrencyFromChips: howManyChips => {
    //
    const taxBP = get().chipsBuyBasePointsTax
    if (taxBP == null) {
      return BigNumber.from(0)
    }

    //
    const gross = get().getGrossCurrencyFromChips(howManyChips)
    const tax = gross.mul(taxBP).div(10_000)

    //
    return gross.add(tax)
  },
  mayUpdateCasinoBankRules: async () => {
    //
    if (get().casinoBankRulesFetched) return

    //
    const [singleChipPrice, maxChipsBuyableAtOnce, chipsBuyBasePointsTax, maxChipsPerBet] = await Promise.all([
      get().casinoBankContract.singleChipPrice() as Promise<BigNumber>,
      get().casinoBankContract.maxChipsBuyableAtOnce() as Promise<number>,
      get().casinoBankContract.taxInBasePoints() as Promise<number>,
      get().casinoBankContract.maxChipsPerBet() as Promise<number>
    ])

    //
    set({
      maxChipsPerBet,
      chipsBuyBasePointsTax,
      maxChipsBuyableAtOnce,
      singleChipPrice,
      casinoBankRulesFetched: true
    })
  }
})

export default slice
