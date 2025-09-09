import type { Contract } from "ethers";

import {
  decimalParser,
  type EventsDatabaseFiller,
  type EventsFormatter,
  EventsScraperConfiguration,
} from "#data-scraper/engine/eventsScraperConfiguration";
import type { PrismaClient } from "#prisma/client/index.js";
import { type CasinoBank_ChipsBought } from "#prisma/client/index.js";

export class EDC_ChipsBought extends EventsScraperConfiguration<CasinoBank_ChipsBought> {
  //
  constructor(contract: Contract, client: PrismaClient, chainId: number) {
    super(contract, client, "ChipsBought", chainId);
  }

  //
  override inserter: EventsDatabaseFiller<CasinoBank_ChipsBought> = (
    toInsert,
  ) =>
    this._client.casinoBank_ChipsBought.createMany({
      data: toInsert,
      skipDuplicates: true, // whenever sync block is not correctly updated, we might try to insert events that already are in DB
    });

  //
  override formatter: EventsFormatter<CasinoBank_ChipsBought> = async ({
    blockNumber,
    args,
    getBlock,
  }) => ({
    chainId: this._chainId,
    block: blockNumber,
    taxes: decimalParser(args?.taxes),
    buyer: args?.buyer as string,
    amount: args?.amount as number,
    trackerId: args?.trackerId as number,
    bts: await getBlock().then((b) => new Date(b.timestamp * 1000)),
  });
}
