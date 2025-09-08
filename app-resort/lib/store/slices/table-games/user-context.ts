import { BigNumber, ContractTransaction, EventFilter, Event } from 'ethers'
import { SEPRunState, SingleExecPromise } from 'lib/SingleExecPromise'
import { StoreSlice } from 'lib/store/_'
import { BaseBetEntry, BetEntry, BetOrder, BetResponse, CoinBet, ColorBet } from '../_/bet'
import { IPopupTxSlice, TrustfulHandler } from '../popup-tx/handler'
import { IWeb3Slice } from '../web3'
import { ITableGamesRulesSlice } from './rules'

//
//
//

/** Represents the "ordering part" of an bet, eg. the user input */
interface OnChainBetOrder<T> extends BaseBetEntry<number>, BetOrder<T, BigNumber> {}

/** Represents the "response part" of a bet, eg. the server / trusted validator computed outcome of the bet */
interface OnChainBetResponse<T> extends BaseBetEntry<number>, BetResponse<T, BigNumber> {}

/** represent a global state of a single bet (order only / order + response) */
export interface OnChainBet<T> extends BetEntry<T, BigNumber, number>{}

/** configuration object carrying filters that allows us to fetch the associated (Order & Response) bet events on the blockchain */
interface OnChainBetQueryFilters {
    order: EventFilter
    result: EventFilter
}

/** configuration object carrying formatters of intercepted events (Order & Response) to formatted objects handled by the database */
interface OnChainBetEventFormater<T> {
    order: (e: Event) => OnChainBetOrder<T>
    result: (e: Event) => OnChainBetResponse<T>
}

//
//
//

interface BasicOnChainBetHistoryStore {
    /** latest sync with the remote source */
    updateStamp?: number
}

/** local database used to track specific context (coinflip, roulette) bets states */
export interface OnChainBetHistoryStore<T> extends BasicOnChainBetHistoryStore {
    /** storage itself */
    history: OnChainBet<T>[]
}

/** Range on which request the blockchain for past events */
type OnChainBetHistoryFilterRange = [number, number]

/** formatted response that the blockchain will give back to an history search */
type OnChainBetHistoryEvents<T> = [
    OnChainBetOrder<T>[],
    OnChainBetResponse<T>[],
    number // latest block number of the request
]

/** maximum deepness on which we can fetch events from past blocks at once (per request) */
const MAX_BLOCK_BACKWARD_HISTORY = 2048

//
//
//

//
export interface ITableGamesSlice {
    //
    updateTableGamesContext$: SingleExecPromise
        areTableGamesPaused?: boolean
        tableGamesBalance?: BigNumber
        tgBankSustained: boolean
        /**
         * Tells whenever contract allows betting
         * @dev string means explaination on why we cannot
         */
        tgAllowsBet: string | true

    //
    // Roulette
    //

    rouletteHistoryStore: OnChainBetHistoryStore<ColorBet>
    updateRouletteHistory$: SingleExecPromise<void>
    updateRouletteHistoryRS: SEPRunState

    defineRouletteBet: (bet: ColorBet) => void
    defineRouletteBetAmount: (amount: BigNumber) => void
    secureRouletteBet: () => void

    rouletteBet?: ColorBet
    rouletteBetAmount: BigNumber

    //
    // Coin flip
    //

    coinflipHistoryStore: OnChainBetHistoryStore<CoinBet>
    updateCoinflipHistory$: SingleExecPromise<void>
    updateCoinflipHistoryRS: SEPRunState

    defineCoinBet: (bet: CoinBet) => void
    defineCoinBetAmount: (amount: BigNumber) => void
    secureCoinBet: () => void

    coinBet?: CoinBet
    coinBetAmount: BigNumber
}

//
interface IPrivateSlice {
    _betCoin: TrustfulHandler<ContractTransaction>
    _betRoulette: TrustfulHandler<ContractTransaction>
    _updateTableGamesContext: () => Promise<void>
    //
    _updateCoinflipHistory: () => Promise<void>
    _updateRouletteHistory: () => Promise<void>
    //
    _mightNeedHistoryUpdate: (store: BasicOnChainBetHistoryStore) => Promise<OnChainBetHistoryFilterRange | null>
    _getUnsyncBetHistory: <T>(
        range: OnChainBetHistoryFilterRange,
        filters: OnChainBetQueryFilters,
        formatters: OnChainBetEventFormater<T>
    ) => Promise<OnChainBetHistoryEvents<T>>
    _updateHistoryStore: <T>(
        store: OnChainBetHistoryStore<T>,
        eventsToMerge: OnChainBetHistoryEvents<T>
    ) => OnChainBetHistoryStore<T>
}

//
const slice: StoreSlice<
    ITableGamesSlice & IPrivateSlice,
    IWeb3Slice & IPopupTxSlice & ITableGamesRulesSlice & IWeb3Slice
    > = (set, get) => ({
      tgBankSustained: false,
      tgAllowsBet: 'Please wait...',
      updateTableGamesContext$: SingleExecPromise.from(() => get()._updateTableGamesContext()),
      //
      coinflipHistoryStore: {
        history: []
      },
      rouletteHistoryStore: {
        history: []
      },
      updateRouletteHistoryRS: false,
      updateCoinflipHistoryRS: false,
      updateRouletteHistory$: SingleExecPromise.from(
        () => get()._updateRouletteHistory(),
        updateRouletteHistoryRS => set({ updateRouletteHistoryRS })
      ),
      updateCoinflipHistory$: SingleExecPromise.from(
        () => get()._updateCoinflipHistory(),
        updateCoinflipHistoryRS => set({ updateCoinflipHistoryRS })
      ),
      _updateCoinflipHistory: async () => {
        // no range means no need to update
        const historyStore = get().coinflipHistoryStore
        const range = await get()._mightNeedHistoryUpdate(historyStore)
        if (range == null) return

        //
        const filters = {
          order: get().tableGamesContract.filters.CoinFlipped(null, get().currentEOAAddress),
          result: get().tableGamesContract.filters.CoinDropped(null, get().currentEOAAddress)
        }

        //
        const formatters : OnChainBetEventFormater<CoinBet> = {
          order: e => ({
            id: e.args.cf_nonce,
            bettedAmount: e.args.amountBet,
            expectedOutcome: +(e.args.isHeads as boolean),
            stamp: e.blockNumber
          }),
          result: e => ({
            id: e.args.cf_nonce,
            amountWon: e.args.amountWon,
            outcome: +(e.args.droppedOnHeads as boolean),
            stamp: e.blockNumber
          })
        }

        //
        const events = await get()._getUnsyncBetHistory(range, filters, formatters)

        //
        set({
          coinflipHistoryStore: get()._updateHistoryStore(historyStore, events)
        })
      },
      _updateRouletteHistory: async () => {
        // no range means no need to update
        const historyStore = get().rouletteHistoryStore
        const range = await get()._mightNeedHistoryUpdate(historyStore)
        if (range == null) return

        //
        const filters = {
          order: get().tableGamesContract.filters.RouletteSpinned(null, get().currentEOAAddress),
          result: get().tableGamesContract.filters.RouletteStopped(null, get().currentEOAAddress)
        }

        //
        const formatters : OnChainBetEventFormater<ColorBet> = {
          order: e => ({
            id: e.args.r_nonce,
            bettedAmount: e.args.amountBet,
            expectedOutcome: e.args.chosenColor,
            stamp: e.blockNumber
          }),
          result: e => ({
            id: e.args.r_nonce,
            amountWon: e.args.amountWon,
            outcome: e.args.stoppedOnColor,
            stamp: e.blockNumber,
            outcomeDetailed: e.args.stoppedOnNumber
          })
        }

        //
        const events = await get()._getUnsyncBetHistory(range, filters, formatters)

        //
        set({
          rouletteHistoryStore: get()._updateHistoryStore(historyStore, events)
        })
      },
      _mightNeedHistoryUpdate: async history => {
        //
        const currentBN = await get().provider.getBlockNumber()
        const rewind = history?.updateStamp ?? -1

        // compare current block number with latest block number used in history, if current is not at least newer, skip update
        if (currentBN <= rewind) {
          return null
        }

        // determine the first block to search events upon.
        // Since we have a limit for event search per request, make sure we do not go too deep by respecting this limit
        const agnosticPastBN = currentBN <= MAX_BLOCK_BACKWARD_HISTORY
          ? 0
          : currentBN - MAX_BLOCK_BACKWARD_HISTORY

        // if the previously computed block number is older that the one stored in history
        const pastBN = agnosticPastBN <= rewind
          ? rewind + 1 // take 1 block after which was the latest history block instead
          : agnosticPastBN

        //
        return [pastBN, currentBN]
      },
      _getUnsyncBetHistory: async (
        [startBN, endBN],
        { order: orderFilter, result: resultFilter },
        { order: orderFormatter, result: resultFormatter }
      ) => await Promise.all([
        //
        get().tableGamesContract
          .queryFilter(orderFilter, startBN, endBN)
          .then(events => events.map(orderFormatter)),
        //
        get().tableGamesContract
          .queryFilter(resultFilter, startBN, endBN)
          .then(events => events.map(resultFormatter)),
        //
        endBN
      ]),
      _updateHistoryStore: <T>(oldState, [orders, results, syncBN]) => {
        //
        const ns : OnChainBetHistoryStore<T> = {
          updateStamp: syncBN,
          history: [...oldState.history]
        }

        //
        ns.history.push(...orders)

        //
        for (const r of results) {
          // finds associated order
          const existing = ns.history.find(e => e.id === r.id)

          // skip if not found (should not happen)
          if (existing == null) continue

          // update reference block number with response block number
          existing.stamp = r.stamp

          // update data with response args
          existing.amountWon = r.amountWon
          existing.outcome = r.outcome
          existing.outcomeDetailed = r.outcomeDetailed
        }

        //
        return ns
      },

      //
      _updateTableGamesContext: async () => {
        //
        const [
          areTableGamesPaused,
          tableGamesBalance
        ] = await Promise.all([
          get().tableGamesContract.paused() as Promise<boolean>,
          get().provider.getBalance(get().tableGamesContract.address) as Promise<BigNumber>
        ])

        //
        const minimumRollingFundsExpected = get().minimumRollingFundsExpected
        const tgBankSustained = minimumRollingFundsExpected != null && tableGamesBalance.gte(minimumRollingFundsExpected)

        //
        const doesTgAllowBet = () => {
          if (areTableGamesPaused) return 'Contract is paused for now. Come back later !'
          if (minimumRollingFundsExpected == null) return 'Cannot get contract informations. Come back later !'
          if (tableGamesBalance.lt(minimumRollingFundsExpected)) return 'Bank has not secured enough funds to open games... Come back later !'
          return true
        }

        //
        set({
          areTableGamesPaused,
          tableGamesBalance,
          tgBankSustained,
          tgAllowsBet: doesTgAllowBet()
        })
      },

      //
      //
      //
      coinBetAmount: BigNumber.from(0),
      defineCoinBetAmount: (amount) => set({ coinBetAmount: amount }),
      defineCoinBet: (bet) => set({ coinBet: bet }),
      secureCoinBet: () => get().setupEndToEndPopupTx({
        contractToListen: get().tableGamesContract,
        description: 'Bet on a coin flip',
        submit: get()._betCoin,
        purposeId: 3,
        mayMinimizeOnTxSent: true,
        eventsFilter: (c, nonce) => c.filters.CoinDropped(nonce),
        onSuccess: get().updateCoinflipHistory$,
        onOrdered: () => get().updateCoinflipHistory$.raise()
      }),
      _betCoin: ({ seed, secretHash }) => get().tableGamesContract.flipCoin(
        get().coinBet === CoinBet.Heads, [seed ?? 0, secretHash ?? 0], {
          value: get().coinBetAmount
        }
      ),

      //
      //
      //
      rouletteBetAmount: BigNumber.from(0),
      defineRouletteBetAmount: (amount) => set({ rouletteBetAmount: amount }),
      defineRouletteBet: (bet) => set({ rouletteBet: bet }),
      secureRouletteBet: () => get().setupEndToEndPopupTx({
        contractToListen: get().tableGamesContract,
        description: 'Bet on a roulette spin color',
        submit: get()._betRoulette,
        purposeId: 2,
        mayMinimizeOnTxSent: true,
        eventsFilter: (c, nonce) => c.filters.RouletteStopped(nonce),
        onSuccess: get().updateRouletteHistory$,
        onOrdered: () => get().updateRouletteHistory$.raise()
      }),
      _betRoulette: ({ seed, secretHash }) => get().tableGamesContract.betOnColor(
        get().rouletteBet, [seed ?? 0, secretHash ?? 0], {
          value: get().rouletteBetAmount
        }
      )
    })

export default slice
