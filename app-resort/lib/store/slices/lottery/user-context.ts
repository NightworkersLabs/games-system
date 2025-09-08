import { BigNumber, ContractTransaction } from 'ethers'
import { SingleExecPromise } from 'lib/SingleExecPromise'
import { StoreSlice } from 'lib/store/_'
import { IPopupTxSlice, TrustfulHandler } from '../popup-tx/handler'
import { IWeb3Slice } from '../web3'
import { ILotteryRulesSlice } from './rules'

//
export enum LotteryState {
    Ongoing,
    WaitingOnPricesDistribution,
    PricesDistributed
}

interface LotteryRules {
    ticketCost: BigNumber
    lotteryDurationInSecs: number
    maximumWinners: number
    newWinnerEveryXPartakers: number
}

interface LotteryDuration {
    startsAt: Date
    finishesAt: Date
}

interface LotteryInformations {
    state: LotteryState
    poolPrize: BigNumber
    totalBoughtTickets: number
}

interface CurrentRewardsEstimate {
    howManyWinners: number
    rewardPerWinner: BigNumber
}

export interface ILotterySlice {
    //
    currentLotteryId?: number
    currentLotteryRules?: LotteryRules
    currentLotteryInformations?: LotteryInformations
    currentLotteryDuration?: LotteryDuration

    //
    isLotteryPaused?: boolean

    //
    currentRewards?: CurrentRewardsEstimate
    howManyTicketsBoughtByMe?: number

    //
    updateLotteryContext$: SingleExecPromise

    //
    howManyTicketsToBuy: number
    setHowManyTicketsToBuy: (howMany: number) => void
    buyTickets: () => void
}

interface IPrivateSlice {
    _updateLotteryContext: () => Promise<void>
    _buyTickets: TrustfulHandler<ContractTransaction>
}

const slice: StoreSlice<ILotterySlice & IPrivateSlice, IWeb3Slice & IPopupTxSlice & ILotteryRulesSlice> = (set, get) => ({
  howManyTicketsToBuy: 1,
  setHowManyTicketsToBuy: (howMany) => set({ howManyTicketsToBuy: howMany }),
  buyTickets: () => get().setupAgnosticPopupTx({
    description: 'Buy lottery ticket(s)',
    submit: get()._buyTickets,
    onSuccess: () => {
      get().updateLotteryContext$.raise()
      get().setHowManyTicketsToBuy(1)
    }
  }),
  _buyTickets: async ({ seed, secretHash }) => {
    //
    const howManyTicketsToBuy = get().howManyTicketsToBuy
    const ticketCost = get().currentLotteryRules.ticketCost

    //
    return get().lotteryContract.buyTickets(
      [seed ?? 0, secretHash ?? 0], {
        value: ticketCost.mul(howManyTicketsToBuy)
      }
    ) as Promise<ContractTransaction>
  },
  _updateLotteryContext: async () => {
    //
    const lc = get().lotteryContract

    //
    const [
      currentLotteryId,
      currentLotteryInformations,
      isLotteryPaused,
      howManyTicketsBoughtByMe,
      [howManyWinners, rewardPerWinner]
    ] = await Promise.all([
      lc.currentLotteryId() as Promise<number>,
      lc.currentLotteryInformations() as Promise<LotteryInformations>,
      lc.paused() as Promise<boolean>,
      lc.howManyTicketsBoughtByMe() as Promise<number>,
      lc.currentRewards() as Promise<[number, BigNumber]>
    ])

    //
    let toUpdate = { currentLotteryId } as any

    // if lottery round changed, update rules + duration
    if (get().currentLotteryId !== currentLotteryId) {
      //
      const [
        currentLotteryRules,
        { startsAt, finishesAt }
      ] = await Promise.all([
        lc.currentLotteryRules() as Promise<LotteryRules>,
        lc.currentLotteryDuration() as Promise<{startsAt: number, finishesAt: number}>
      ])

      // add to update
      toUpdate = {
        ...toUpdate,
        currentLotteryRules,
        currentLotteryDuration: {
          finishesAt: new Date(finishesAt * 1000),
          startsAt: new Date(startsAt * 1000)
        } as LotteryDuration
      }
    }

    //
    set({
      ...toUpdate,
      currentLotteryInformations,
      currentRewards: {
        howManyWinners,
        rewardPerWinner
      } as CurrentRewardsEstimate,
      isLotteryPaused,
      howManyTicketsBoughtByMe
    })
  },
  //
  updateLotteryContext$: SingleExecPromise.from(() => get()._updateLotteryContext())
})

export default slice
