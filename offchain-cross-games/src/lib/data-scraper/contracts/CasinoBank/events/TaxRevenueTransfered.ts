import type { Contract } from "ethers";

import {
  decimalParser,
  type EventsDatabaseFiller,
  type EventsFormatter,
  EventsScraperConfiguration,
} from "#data-scraper/engine/eventsScraperConfiguration";
import type { PrismaClient } from "#prisma/client/index.js";
import { type CasinoBank_TaxRevenueTransfered } from "#prisma/client/index.js";

export class EDC_TaxRevenueTransfered extends EventsScraperConfiguration<CasinoBank_TaxRevenueTransfered> {
  //
  constructor(contract: Contract, client: PrismaClient, chainId: number) {
    super(contract, client, "TaxRevenueTransfered", chainId);
  }

  //
  override inserter: EventsDatabaseFiller<CasinoBank_TaxRevenueTransfered> = (
    toInsert,
  ) =>
    this._client.casinoBank_TaxRevenueTransfered.createMany({
      data: toInsert,
      skipDuplicates: true, // whenever sync block is not correctly updated, we might try to insert events that already are in DB
    });

  //
  override formatter: EventsFormatter<CasinoBank_TaxRevenueTransfered> =
    async ({ blockNumber, args, getBlock }) => ({
      chainId: this._chainId,
      block: blockNumber,
      receiver: args?.receiver as string,
      amount: decimalParser(args?.amount),
      sponsorId: args?.sponsorId as number,
      bts: await getBlock().then((b) => new Date(b.timestamp * 1000)),
    });
}
