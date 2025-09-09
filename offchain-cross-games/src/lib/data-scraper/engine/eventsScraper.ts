import type { BigNumber, Contract } from "ethers";
import type { Observable } from "rxjs";
import {
  catchError,
  concatMap,
  delayWhen,
  exhaustMap,
  finalize,
  from,
  interval,
  mergeMap,
  of,
  race,
  share,
  takeWhile,
  tap,
  throwError,
} from "rxjs";

import { BlockPoller } from "#/src/lib/data-scraper/engine/blockPoller";
import type { EventsScraperConfiguration } from "#/src/lib/data-scraper/engine/eventsScraperConfiguration";
import { packUnoverlapped } from "#lib/helpers";
import { type CasinoBlockchainRuntime } from "#lib/multi-chain/configuration";
import type { PrismaClient } from "#prisma/client/index.js";

//
export interface EventRuntime<T> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  evConfig: EventsScraperConfiguration<any>;
  syncContext: T;
}

// type RunState = "Idle" | "Running" | "Stopping";

//
type LogType = "normal" | "warning" | "discrete";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type EventConfigurations = EventsScraperConfiguration<any>[];

//
export abstract class EventsScraper<
  T extends { blockSync: number; blockCreated: number },
> extends BlockPoller {
  //
  private _MAX_BLOCKS: number;
  private _EVTS_POLL_WAIT_MS: number;

  //
  protected _contract: Contract;
  protected _client: PrismaClient;

  //
  private _contractName: string;

  //
  protected _evtConfigurations: EventConfigurations;

  //
  constructor(
    bcRuntime: CasinoBlockchainRuntime,
    contractName: string,
    client: PrismaClient,
    getEvtConfigurations: (
      contract: Contract,
      chainId: number,
    ) => EventConfigurations,
  ) {
    //
    super(bcRuntime.chainId);

    //
    this._contract = bcRuntime.contract;

    //
    this._contractName = contractName;

    //
    this._client = client;

    //
    this._evtConfigurations = getEvtConfigurations(
      this._contract,
      bcRuntime.chainId,
    );

    //
    this._MAX_BLOCKS = bcRuntime.searchEvents?.maxBlockHeight ?? 2048; // defaults to 2048 blocks (Avalanche Fuji events limit per request)
    this._EVTS_POLL_WAIT_MS = bcRuntime.searchEvents?.pollDurationMs ?? 60_000;
  }

  //
  override async _run() {
    // get current contexts
    const runtimes = await this._setupInitialEventsRuntimes();

    // invoke a shared poller for block number fetching
    // ... since it is possibily used by multiples runtimes, shares it
    const currentBCBlockNumber$ = this._produceBlockNumberPoller(
      this._contract,
    ).pipe(share());

    // log start
    this.__logB(" Starting syncing...");

    // run each runtime next to each other, async
    return from(runtimes).pipe(
      mergeMap((r) => this._scanRuntime(currentBCBlockNumber$, r)),
    );
  }

  //
  private _scanRuntime(
    currentBCBlockNumber$: Observable<number>,
    runtime: EventRuntime<T>,
  ) {
    //
    return currentBCBlockNumber$.pipe(
      // wait for current sync to end before handling more
      exhaustMap((currentBlockNumber) =>
        // try to sync with database
        this._mayBatchSyncEvents(runtime, currentBlockNumber).pipe(
          // for each loop of "expand", check if stop event has been triggered to prevent useless polling
          takeWhile(() => this._mustContinue()),
          // ...log wait if not stopping
          tap((r) =>
            this.__logR(
              r,
              ` Sleep for ${this._EVTS_POLL_WAIT_MS} ms`,
              "discrete",
              true,
            ),
          ),
          // then, wait until a trigger from...
          delayWhen(() =>
            race(
              // ... waiting configured amount of seconds
              interval(this._EVTS_POLL_WAIT_MS).pipe(
                tap(() =>
                  this.__logR(
                    runtime,
                    " Waking, ready to sync on next block !",
                    "discrete",
                    true,
                  ),
                ),
              ),
              // ... the stop event
              this._waitForStopEvent$.pipe(
                tap(() => this.__logR(runtime, " Exiting...", "discrete")),
              ),
            ),
          ),
        ),
      ),
      // for each loop of "expand", check if stop event has been triggered
      takeWhile(() => this._mustContinue()),
      // on "empty" received, tells that service ended
      finalize(() => {
        this.__logR(runtime, " Exited.", "discrete");
      }),
    );
  }

  //
  private _mayBatchSyncEvents(
    runtime: EventRuntime<T>,
    currentBlockNumber: number,
  ): Observable<EventRuntime<T>> {
    // if current block number is lower or equal than latest sync...
    if (currentBlockNumber <= runtime.syncContext.blockSync) {
      // log ...
      this.__logR(
        runtime,
        ` No sync needed (current: ${currentBlockNumber} | sync: ${runtime.syncContext.blockSync})`,
        "discrete",
        true,
      );

      // nothing to do, skip
      return of(runtime);
    }

    // search 1 block after the current synced block (since search is inclusive)
    const searchFromBlock = runtime.syncContext.blockSync + 1;

    // pack future requests
    const packs = packUnoverlapped(
      searchFromBlock,
      currentBlockNumber,
      this._MAX_BLOCKS,
    );

    // log...
    this.__logR(
      runtime,
      ` sync needed ! (from: ${searchFromBlock}, digging ${currentBlockNumber - searchFromBlock + 1} blocks into ${packs.length} batch(es))`,
      "discrete",
      true,
    );

    // batches packs of block numbers...
    return from(packs).pipe(
      // run sequentially each update attempt
      concatMap((searchRange) => {
        //
        this.__logRSR(
          runtime,
          searchRange,
          "fetching events...",
          "discrete",
          true,
        );

        // fetch events and duplicate to db
        return from(
          runtime.evConfig.fetchDuplicate(searchRange[0], searchRange[1]),
        ).pipe(
          // log if new events inserted
          tap((howManyInserted) => {
            //
            if (howManyInserted === 0) return;

            //
            this.__logRSR(
              runtime,
              searchRange,
              `inserted ${howManyInserted} new events`,
            );
          }),
          // update block of sync context to latest
          concatMap(() => this._updateSyncBlock(searchRange[1], runtime)),
          // returns runtime
          tap(() =>
            this.__logR(
              runtime,
              `Synced to block ${searchRange[1]}`,
              "discrete",
              true,
            ),
          ),
          // (if ever fails, augment context with search range for logging)
          catchError((e) => {
            // log...
            this.__logRSR(runtime, searchRange, `failed with: ${e}`, "warning");

            // then rethrow...
            return throwError(() => e);
          }),
        );
      }),
      // finally, if stopping or failed, stop handling more batches from pack
      takeWhile(() => this._mustContinue()),
      // if latest batch fail, stop handling remaining batches right now...
      catchError(() =>
        // ... return the sync context as was when the last batch component updated it
        of(runtime),
      ),
    );
  }

  //
  //
  //

  //
  override __logB(msg: string, color?: LogType, skippedInProd?: boolean) {
    super.__logB(`[${this._contractName}]${msg}`, color, skippedInProd);
  }

  //
  private __logR(
    evRuntime: EventRuntime<T>,
    msg: string,
    color?: LogType,
    skippedInProd?: boolean,
  ) {
    const fMsg = `[${evRuntime.evConfig.eventName}]${msg}`;
    this.__logB(fMsg, color, skippedInProd);
  }

  //
  private __logRSR(
    evRuntime: EventRuntime<T>,
    searchRange: [number, number],
    msg: string,
    color?: LogType,
    skippedInProd?: boolean,
  ) {
    const fMsg = `[${searchRange[0]}+${searchRange[1] - searchRange[0]}] ${msg}`;
    this.__logR(evRuntime, fMsg, color, skippedInProd);
  }

  //
  //
  //

  //
  private async _setupInitialEventsRuntimes(): Promise<EventRuntime<T>[]> {
    // get current contract creation block
    const contractCreationBlock = await this._getContractCreationBlock();

    //
    return Promise.all(
      this._evtConfigurations.map(async (config) => {
        //
        const syncContext = await this._upsertSyncContext(
          contractCreationBlock,
          config.eventName,
        );

        //
        return {
          evConfig: config,
          syncContext,
        };
      }),
    );
  }

  /**
   * create or get the current sync context from database of a specific blockchain event from current contract
   * @param ccb contract creation block on which the context will apply
   * @param eventName name of the event to sync from
   * @returns updated sync context of the event from the database
   */
  private async _upsertSyncContext(
    ccb: BigNumber,
    eventName: string,
  ): Promise<T> {
    //
    const syncData = await this._getSyncData(eventName);

    // if data already exists...
    if (syncData) {
      //
      const dbBlock = syncData.blockCreated.toString();
      const bcBlock = ccb.toString();

      // check that creation block of current contract is the same
      if (dbBlock !== bcBlock) {
        throw new Error(
          `Contract creation block missmatch (DB: ${dbBlock}| BC: ${bcBlock}) for "${eventName}" event.`,
        );
      }

      //
      return syncData;

      //
    } else {
      // if not, push current data
      const initial = await this._createSyncData(ccb, eventName);

      // logging
      this.__logB(
        ` Created syncing context for "${eventName}" event, synced at [${initial.blockCreated}] block`,
      );

      //
      return initial;
    }
  }

  //
  //
  //

  //
  private async _getContractCreationBlock(): Promise<BigNumber> {
    return this._contract.CREATION_BLOCK() as BigNumber;
  }

  //
  protected abstract _getSyncData(eventName: string): Promise<T | null>;

  //
  protected abstract _createSyncData(
    creationBlock: BigNumber,
    eventName: string,
  ): Promise<T>;

  /**
   * update a sync context alongside its database state
   * @param blockSync new block to sync context with
   * @param runtime runtime event & sync context
   * @returns returns updated ref to runtime
   */
  protected abstract _updateSyncBlock(
    blockSync: number,
    runtime: EventRuntime<T>,
  ): Promise<EventRuntime<T>>;
}
