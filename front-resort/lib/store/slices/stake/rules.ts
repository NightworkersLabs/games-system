import { StoreSlice } from 'lib/store/_'
import { IWeb3Slice } from '../web3'
import { BigNumber } from 'ethers'

export interface IStakeRulesSlice {
  //
  stakeRulesFetched: boolean
  mayUpdateStakeRules: () => Promise<void>

  // only applies to hookers
  secsToWaitAfterLastClaim?: number
  maximumClaimAtOnce?: number
  maximumEmployableAtOnce?: number
  maximumLOLLYMintableByStaking?: BigNumber
  prcTaxOnHookerClaim?: number
  LOLLYPerSecondMintableThroughStaking?: BigNumber
  singleTokenClaimTax?: BigNumber
}

const slice: StoreSlice<IStakeRulesSlice, IWeb3Slice> = (set, get) => ({
  //
  stakeRulesFetched: false,
  //
  mayUpdateStakeRules: async () => {
    // no need to refetch rules
    if (get().stakeRulesFetched) return

    //
    const sc = get().stakingContract

    const [
      maximumClaimAtOnce,
      secsToWaitAfterLastClaim,
      maximumLOLLYMintableByStaking,
      prcTaxOnHookerClaim,
      LOLLYPerSecondMintableThroughStaking,
      maximumEmployableAtOnce,
      singleTokenClaimTax
    ] = await Promise.all([
      sc.MAX_CLAIM_AT_ONCE() as Promise<number>,
      sc.MINIMUM_TO_EXIT() as Promise<number>,
      sc.MAXIMUM_GLOBAL_LOLLY() as Promise<BigNumber>,
      sc.LOLLY_CLAIM_TAX_PERCENTAGE() as Promise<number>,
      sc.SEC_LOLLY_RATE() as Promise<BigNumber>,
      sc.MAX_EMPLOYABLE_AT_ONCE() as Promise<number>,
      sc.SINGLE_TOKEN_CLAIM_TAX() as Promise<BigNumber>
    ])

    //
    set({
      maximumClaimAtOnce,
      secsToWaitAfterLastClaim,
      maximumLOLLYMintableByStaking,
      prcTaxOnHookerClaim,
      LOLLYPerSecondMintableThroughStaking,
      maximumEmployableAtOnce,
      singleTokenClaimTax
    })
  }
})

export default slice
