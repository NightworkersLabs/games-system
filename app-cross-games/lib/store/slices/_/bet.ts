import { BigNumber } from 'ethers'

/**
 * all the meaningful outcomes of a coin flip
 * @dev order matter
 */
export enum CoinBet {
    Tails,
    Heads
}

/**
 * all the meaningful outcomes of a roulette spin
 * @dev order matter
 */
export enum ColorBet {
    Green,
    Red,
    Black
}

/** any kind of bet type */
export type AnyBet = CoinBet | ColorBet

export type AnyBettedCurrencyType = BigNumber | number

/** either a date (for API) or a block number (for onchain) */
export type AnyStampType = Date | number

/** Represents the "ordering part" of an bet, eg. the user input */
export interface BetOrder<T = AnyBet, A = AnyBettedCurrencyType> {
    /** expected outcome requested by the user */
    expectedOutcome: T
    /** currency amount betted by the user */
    bettedAmount: A
}

/** Represents the "response part" of a bet, eg. the server / trusted validator computed outcome of the bet */
export interface BetResponse<T = AnyBet, A = AnyBettedCurrencyType> {
    /** resolved outcome */
    outcome: T
    /** resolved outcome, but in the numeric equivalent (eg., un-translated) */
    outcomeDetailed?: number
    /** how much the user has won on this bet (can be 0) */
    amountWon: A
}

/** foundation of a bet entry */
export interface BaseBetEntry<StampType = AnyStampType> {
    /** unique ID of a single bet in a specific context (roulette, coinflip...) */
    id: number
    /** date-like stamp relative to this entry */
    stamp: StampType
}

/** standard bet entry */
export interface BetEntry<T= AnyBet, Currency = AnyBettedCurrencyType, StampType = AnyStampType> extends
    BaseBetEntry<StampType>,
    BetOrder<T, Currency>,
    Partial<BetResponse<T, Currency>> {
    /** */
    hasFailed?: null | true
}
