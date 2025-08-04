import { StoreSlice } from 'lib/store/_'
import { ChipsBalance, IProtectedCasinoSlice } from '../casino-bank/user-context'
import { IPopupTxSlice } from '../popup-tx/handler'
import { AnyBet, BetEntry, CoinBet, ColorBet } from '../_/bet'

//
export interface APIBetEntry<T = AnyBet> extends
    BetEntry<T, number, Date> {
    //
    updatedBalance?: ChipsBalance
}

//
export interface ICasinoAPISlice {
    chipsCoinFlipAttemptId: number
    chipsCoinFlipHistory: APIBetEntry<CoinBet>[]
    doChipsCoinBet: (howManyToBet: number, wantedOutcome: CoinBet) => void

    chipsRouletteAttemptId: number
    chipsRouletteHistory: APIBetEntry<ColorBet>[]
    doChipsRouletteBet: (howManyToBet: number, wantedOutcome: ColorBet) => void
}

interface IPrivateSlice {
    _mayFindAndUpdateCoinFlipBetEntry: (entry: Partial<APIBetEntry<CoinBet>>, attemptId: number) => void,
    _mayFindAndUpdateRouletteBetBetEntry: (entry: Partial<APIBetEntry<ColorBet>>, attemptId: number) => void
}

const slice: StoreSlice<ICasinoAPISlice & IPrivateSlice, IPopupTxSlice & IProtectedCasinoSlice> = (set, get) => ({
  chipsCoinFlipHistory: [],
  chipsRouletteHistory: [],
  chipsCoinFlipAttemptId: 0,
  chipsRouletteAttemptId: 0,
  doChipsRouletteBet: (howManyToBet, wantedOutcome) => {
    //
    let attemptId = get().chipsRouletteAttemptId
    attemptId++

    //
    get().setupAPIPopupTx({
      description: 'Bet on a roulette spin color',
      minimalMsThrottleRange: [1000, 2000],
      resolveContext: 'roulette',
      submit: ({ seed, secretHash }) => {
        //
        set({
          chipsRouletteAttemptId: attemptId,
          chipsRouletteHistory: [...get().chipsRouletteHistory, {
            id: attemptId,
            bettedAmount: howManyToBet,
            expectedOutcome: wantedOutcome,
            stamp: new Date()
          }]
        })

        //
        return get()._casinoPOST('/spin', {
          clientSeed: seed?.toHexString(),
          hashedSecret: secretHash?.toHexString(),
          howManyToBet,
          wantedOutcome
        })
      },
      onSuccess: result => get()._mayFindAndUpdateRouletteBetBetEntry({
        updatedBalance: result.updatedBalance as ChipsBalance,
        amountWon: result.howMuchChipsWon as number,
        outcome: result.outcome,
        outcomeDetailed: result.rawOutcome as number
      }, attemptId),
      onFailed: () => get()._mayFindAndUpdateRouletteBetBetEntry({
        hasFailed: true
      }, attemptId)
    })
  },
  doChipsCoinBet: (howManyToBet, wantedOutcome) => {
    //
    let attemptId = get().chipsCoinFlipAttemptId
    attemptId++

    //
    get().setupAPIPopupTx({
      description: 'Bet on a coin flip',
      minimalMsThrottleRange: [1000, 2000],
      resolveContext: 'coinflip',
      submit: ({ seed, secretHash }) => {
        //
        set({
          chipsCoinFlipAttemptId: attemptId,
          chipsCoinFlipHistory: [...get().chipsCoinFlipHistory, {
            id: attemptId,
            bettedAmount: howManyToBet,
            expectedOutcome: wantedOutcome,
            stamp: new Date()
          }]
        })

        //
        return get()._casinoPOST('/flip', {
          clientSeed: seed?.toHexString(),
          hashedSecret: secretHash?.toHexString(),
          howManyToBet,
          wantedOutcome
        })
      },
      onSuccess: result => get()._mayFindAndUpdateCoinFlipBetEntry({
        updatedBalance: result.updatedBalance as ChipsBalance,
        amountWon: result.howMuchChipsWon as number,
        outcome: result.outcome,
        outcomeDetailed: result.rawOutcome as number
      }, attemptId),
      onFailed: () => get()._mayFindAndUpdateCoinFlipBetEntry({
        hasFailed: true
      }, attemptId)
    })
  },

  //
  //
  //

  _mayFindAndUpdateCoinFlipBetEntry: (entry, attemptId) => {
    //
    const chipsCoinFlipHistory = get().chipsCoinFlipHistory
    const index = chipsCoinFlipHistory.findIndex(item => item.id === attemptId)
    if (index < 0) return

    //
    chipsCoinFlipHistory[index] = {
      ...chipsCoinFlipHistory[index],
      ...entry
    }

    //
    set({ chipsCoinFlipHistory: [...chipsCoinFlipHistory] })
  },
  _mayFindAndUpdateRouletteBetBetEntry: (entry, attemptId) => {
    //
    const chipsRouletteHistory = get().chipsRouletteHistory
    const index = chipsRouletteHistory.findIndex(item => item.id === attemptId)
    if (index < 0) return

    //
    chipsRouletteHistory[index] = {
      ...chipsRouletteHistory[index],
      ...entry
    }

    //
    set({ chipsRouletteHistory: [...chipsRouletteHistory] })
  }
})

export default slice
