import { NWERC20_NAME } from 'env/defaults'
import { BigNumber } from 'ethers'
import { StoreSlice } from 'lib/store/_'
import { SingleExecPromise } from 'lib/SingleExecPromise'
import { IPopupTxSlice } from '../popup-tx/handler'
import { IWeb3Slice } from '../web3'

/** 1-for-1 smart-contract struct */
interface BRRoundBase {
    toDistribute: BigNumber
    id: number
    startsAt: Date
    endsAt: Date
    diesAt: Date
}

/** 1-for-1 smart-contract struct */
interface BRRunBase {
    totalStakedAtEnd: BigNumber
    newlyDeposited: BigNumber
    newlyDepositedShares: BigNumber
    round: BRRoundBase
}

/** 1-for-1 smart-contract struct */
export interface BRStake {
    staked: BigNumber
    volatileShares: BigNumber
    depositRoundId: number
    claimRoundId: number
}

/** BRRoundBase + calculated fields */
export interface BRRound extends BRRoundBase {
    duration: number
    rewardsPerSecond: BigNumber
}

/** augmented BRRunBase with calculated fields */
export interface BRRun extends BRRunBase {
    //
    round: BRRound
    /** computed shares that will be used to determine gains estimates */
    accountedRoundShares: BigNumber
}

export interface ContextualizedBRStake extends BRStake {
    /** shares of this stake in a context of a specific round */
    sharesForRound: BigNumber
    /** projected reward for this stake */
    projectedRewards: BigNumber
    //
    run: BRRun
}

export function contextualizeStake (stake: BRStake, run: BRRun) : ContextualizedBRStake {
  //
  const hasStakedTokens = stake?.staked.isZero() === false
  const hasClaimedThisRound = stake.claimRoundId >= run?.round.id
  const hasDepositedThisRound = stake.depositRoundId >= run?.round.id

  //
  const sharesForRound = hasClaimedThisRound || !hasStakedTokens || run == null
    ? BigNumber.from(0)
    : (hasDepositedThisRound
      ? stake.volatileShares
      : stake.staked
        .mul(run.round.duration)
    )

  //
  const projectedRewards = run == null
    ? BigNumber.from(0)
    : sharesForRound
      .div(run.accountedRoundShares)
      .mul(run.round.toDistribute)

  //
  return {
    sharesForRound,
    projectedRewards,
    ...stake,
    run
  }
}

//
export interface IVaultSlice {
    allowAndDeposit: (howMuchNWERC20: BigNumber) => void
    mayClaimDoWithdraw: (howMuchNWERC20: BigNumber) => void

    //
    updateBackroomContext$: SingleExecPromise<void>
        scheduledBRRuns?: BRRun[]
        backroomStake?: BRStake
        totalStakedOnVault?: BigNumber

    //
    latestClaimRewards?: BigNumber
    clearLatestClaimRewards: () => void
}

interface IPrivateSlice {
    _updateBackroomContext: () => Promise<void>
}

const slice: StoreSlice<IVaultSlice & IPrivateSlice, IWeb3Slice & IPopupTxSlice> = (set, get) => ({
  updateBackroomContext$: SingleExecPromise.from(() => get()._updateBackroomContext()),
  _updateBackroomContext: async () => {
    //
    const bc = get().backroomContract

    //
    const [
      totalStakedOnVault,
      rawRuns,
      rawStake
    ] = await Promise.all([
      bc.stakedTokensBalance() as Promise<BigNumber>,
      bc.getRuns() as Promise<any[]>,
      bc.stakes(get().currentEOAAddress) as Promise<any>
    ])

    //
    set({
      scheduledBRRuns: rawRuns
        .filter(x => x.round.id !== 0) // remove un-configured rounds
        .map(x => {
          //
          const duration = x.round.endsAt - x.round.startsAt
          const toDistribute = x.round.toDistribute as BigNumber

          //
          const round: BRRound = {
            id: x.round.id,
            startsAt: new Date(x.round.startsAt * 1_000),
            endsAt: new Date(x.round.endsAt * 1_000),
            diesAt: new Date(x.round.diesAt * 1_000),
            toDistribute,
            duration,
            rewardsPerSecond: toDistribute.div(duration)
          }

          //
          const totalStakedAtEnd: BigNumber = x.totalStakedAtEnd
          const newlyDeposited: BigNumber = x.newlyDeposited
          const newlyDepositedShares: BigNumber = x.newlyDepositedShares

          //
          const accountedRoundShares =
                        (totalStakedAtEnd.isZero() ? totalStakedOnVault : totalStakedAtEnd)
                          .sub(newlyDeposited)
                          .mul(duration)
                          .add(newlyDepositedShares)

          //
          return ({
            totalStakedAtEnd,
            newlyDeposited,
            newlyDepositedShares,
            accountedRoundShares,
            round
          })
        }),
      backroomStake: {
        claimRoundId: rawStake.claimRoundId,
        depositRoundId: rawStake.depositRoundId,
        staked: rawStake.staked,
        volatileShares: rawStake.volatileShares
      },
      totalStakedOnVault
    })
  },
  allowAndDeposit: howMuchNWERC20 => get().setupTwoStepsPopupTx({
    description: `Deposit ${NWERC20_NAME} into vault`,
    toAllow: howMuchNWERC20,
    increaseAllowanceFunc: remainingToApprove => get().NWERC20Contract.increaseAllowance(
      get().backroomContract.address,
      remainingToApprove
    ),
    allowanceCheck: () => get().NWERC20Contract.allowance(
      get().currentEOAAddress,
      get().backroomContract.address
    ),
    txFunc: () => get().backroomContract.deposit(howMuchNWERC20),
    onSuccess: get().updateBackroomContext$
  }),
  mayClaimDoWithdraw: howMuchNWERC20 => get().setupStandardPopupTx({
    description: `Withdraw ${NWERC20_NAME} (maybe with rewards)`,
    txFunc: () => get().backroomContract.mayClaimDoWithdraw(howMuchNWERC20),
    eventsFilterName: 'RewardsClaimed',
    onSuccess: maybeEv => {
      get().updateBackroomContext$.raise()
      if (maybeEv) {
        set({ latestClaimRewards: maybeEv.args.claimed })
      }
    }
  }),
  clearLatestClaimRewards: () => set({ latestClaimRewards: null })
})

export default slice
