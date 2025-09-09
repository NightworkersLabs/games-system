import {
  type CoinFlipOutcome,
  type RandomOutcome,
  type RouletteOutcome,
} from "#/src/lib/casino/rand";
import { type BetConfiguration } from "#/src/lib/casino/rooms";
import type { PrismaClient } from "#prisma/client/index.js";

export type BetRegisterer<T> = (
  registerCli: PrismaClient,
  bet: BetConfiguration<T>,
  result: RandomOutcome<T>,
) => Promise<void>;

type CoinflipRegister = BetRegisterer<CoinFlipOutcome>;
type RouletteRegister = BetRegisterer<RouletteOutcome>;

//
export const rouletteRegisterer: RouletteRegister = async (
  registerCli,
  bet,
  result,
) => {
  return await registerCli.roulettePlays
    .create({
      data: {
        chainId: bet.chainId,
        address: bet.playerWalletID.toHexString(),
        betted: bet.howMuchCoinsToBet,
        bettedOn: bet.wantedOutcome,
        got: result.outcome,
        gotNumber: result.rawOutcome,
        pf: result.isProvable,
        won: result.howMuchChipsWon,
      },
      select: null,
    })
    .then();
};

//
export const coinflipRegisterer: CoinflipRegister = async (
  registerCli,
  bet,
  result,
) => {
  return await registerCli.coinflipPlays
    .create({
      data: {
        chainId: bet.chainId,
        address: bet.playerWalletID.toHexString(),
        betted: bet.howMuchCoinsToBet,
        bettedOn: bet.wantedOutcome,
        pf: result.isProvable,
        won: result.howMuchChipsWon,
      },
      select: null,
    })
    .then();
};
