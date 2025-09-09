import { BigNumber } from "ethers";

export interface FairlyComputedRandom {
  /** @dev hex representation */
  revealedSecret: string;
  /** @dev hex representation */
  randomNumberProduced: string;
  isProvable: boolean;
}

export interface RandomOutcome<O> extends FairlyComputedRandom {
  outcome: O;
  rawOutcome: number;
  howMuchChipsWon: number;
}

export const CoinFlipOutcomeV = ["Heads", "Tails"] as const;
export const RouletteOutcomeV = ["Green", "Red", "Black"] as const;

export type CoinFlipOutcome = (typeof CoinFlipOutcomeV)[number];
export type RouletteOutcome = (typeof RouletteOutcomeV)[number];

export type BetExecutor<T> = (
  betTarget: T,
  howMuchChipsBet: number,
  fcr: FairlyComputedRandom,
) => Promise<RandomOutcome<T>>;
type FlipCoinBetExecutor = BetExecutor<CoinFlipOutcome>;
type RouletteBetExecutor = BetExecutor<RouletteOutcome>;

//
export const coinFlipper: FlipCoinBetExecutor = async (
  betTarget,
  howMuchChipsBet,
  fcr,
) => {
  //
  const rawOutcome = BigNumber.from(fcr.randomNumberProduced).mod(2).toNumber();

  //
  const outcome = rawOutcome === 1 ? "Heads" : "Tails";

  //
  return {
    outcome,
    rawOutcome,
    howMuchChipsWon: outcome === betTarget ? howMuchChipsBet * 2 : 0,
    ...fcr,
  };
};

//
export const rouletteSpinner: RouletteBetExecutor = async (
  betTarget,
  howMuchChipsBet,
  fcr,
) => {
  //
  const rawOutcome = BigNumber.from(fcr.randomNumberProduced)
    .mod(15)
    .toNumber();

  //
  const outcome: RouletteOutcome =
    rawOutcome === 0
      ? "Green"
      : rawOutcome === 10 ||
          rawOutcome === 9 ||
          rawOutcome === 11 ||
          rawOutcome === 5 ||
          rawOutcome === 1 ||
          rawOutcome === 6 ||
          rawOutcome === 2
        ? "Black"
        : "Red";

  //
  const howMuchChipsWon =
    outcome !== betTarget
      ? 0
      : howMuchChipsBet * (outcome === "Green" ? 10 : 2);

  //
  return {
    outcome,
    rawOutcome,
    howMuchChipsWon,
    ...fcr,
  };
};
