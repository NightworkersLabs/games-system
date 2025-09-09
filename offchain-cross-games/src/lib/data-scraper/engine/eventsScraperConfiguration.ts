import type { Contract } from "ethers";
import { BigNumber, type Event, type EventFilter } from "ethers";
import { formatUnits } from "ethers/lib/utils.js";

import type { PrismaClient } from "#prisma/client/index.js";
import { Prisma, type PrismaPromise } from "#prisma/client/index.js";

//
export type EventsDatabaseFiller<T> = (
  eventsToInsert: T[],
) => PrismaPromise<Prisma.BatchPayload>;

//
export type EventsFormatter<T> = (toFormat: Event) => Promise<T>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const decimalParser = (toParse: BigNumber | number | any) => {
  if (typeof toParse === "number") {
    return new Prisma.Decimal(toParse);
  } else if (toParse instanceof BigNumber) {
    return new Prisma.Decimal(formatUnits(toParse, 0));
  } else {
    throw Error(
      "Unhandled number-like received from blockchain => " + String(toParse),
    );
  }
};

//
export abstract class EventsScraperConfiguration<T> {
  public readonly eventName: string;
  protected readonly eventFilter: EventFilter;

  protected abstract readonly inserter: EventsDatabaseFiller<T>;
  protected abstract readonly formatter: EventsFormatter<T>;

  protected readonly _client: PrismaClient;
  protected readonly _contract: Contract;
  protected readonly _chainId: number;

  constructor(
    contract: Contract,
    client: PrismaClient,
    eventName: string,
    chainId: number,
  ) {
    //
    const filterFunc = contract.filters[eventName];
    if (filterFunc === undefined) {
      throw Error("Event filter not found in contract");
    }

    //
    this.eventName = eventName;
    this.eventFilter = filterFunc();
    this._client = client;
    this._contract = contract;
    this._chainId = chainId;
  }

  /**
   * fetch events from blockchain and insert them into database
   * @param fromBlock start scan block (inclusive)
   * @param toBlock end scan block (inclusive)
   * @returns how many rows where inserted
   */
  async fetchDuplicate(fromBlock: number, toBlock: number) {
    //
    const raw = await this._contract.queryFilter(
      this.eventFilter,
      fromBlock,
      toBlock,
    );
    if (raw.length === 0) return 0;

    // genenerate promise formatters and wait for them all to succeed
    const formatted = await Promise.all(raw.map(this.formatter));

    //
    const { count } = await this.inserter(formatted);

    //
    return count;
  }
}
