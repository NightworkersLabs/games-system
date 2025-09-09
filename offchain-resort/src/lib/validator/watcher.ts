import chalk from "chalk";
import {
  BigNumber,
  Contract,
  type ContractInterface,
  type ContractReceipt,
  type ContractTransaction,
  type Event,
  type EventFilter,
} from "ethers";
import type { Result } from "ethers/lib/utils.js";
import { EventEmitter } from "node:events";
import type { Observable } from "rxjs";
import {
  concat,
  concatAll,
  concatMap,
  filter,
  finalize,
  from,
  fromEvent as rxFromEvent,
  map,
  merge,
  takeWhile,
  tap,
} from "rxjs";
import type TypedEmitter from "typed-emitter/rxjs/index.js";
import { type FromEvent } from "typed-emitter/rxjs/index.js";

import type { TransactionReceipt } from "@ethersproject/providers";

import { getGasCostOfTx, packUnoverlapped } from "#/src/lib/helpers";
import { TVLogger } from "#/src/lib/params";
import { ProvablyFairResolver } from "#/src/lib/provably-fair/compliance";
import { RandomGenerator } from "#/src/lib/provably-fair/random-generator";
import type { SecretsStorage } from "#/src/lib/provably-fair/secrets-provider";
import type TrustfulOrderPayloadWithNonce from "#/src/lib/provably-fair/TrustfulOrderPayloadWithNonce";
import type { TrustedValidatorBound } from "#/src/lib/tv-daemon";
import { type RunContext } from "#/src/lib/tv-daemon";

const fromEvent = rxFromEvent as FromEvent;

type QueriedTrustfulOrder = {
  blockNumber: number;
  order: Result;
  nonce: number;
};

export class TrustfulOrderPayload {
  //
  clientSeed: BigNumber;
  hashedSecret: BigNumber;

  //
  constructor(clientSeed: BigNumber, hashedSecret: BigNumber) {
    this.clientSeed = clientSeed;
    this.hashedSecret = hashedSecret;
  }

  //
  static empty(): TrustfulOrderPayload {
    return new TrustfulOrderPayload(BigNumber.from(0), BigNumber.from(0));
  }
}

export type TrustfulResponsePayload = {
  wasHashedSecretLegitimate: boolean;
  usedSecret: BigNumber;
  randomNumber: BigNumber;
};

enum OrderProcessAllowance {
  AllowedNew,

  AllowedRecovered,
}

type InjectionEvents = {
  injected: (event: Event) => void;
};

export abstract class TrustedValidatorWatcher {
  //
  protected _contract: Contract;
  protected _secretsStorage: SecretsStorage;

  //
  protected abstract readonly _REQUEST_EV: string;
  protected abstract readonly _TRUSTED_PURPOSE_INDEX: number;
  protected abstract _getNonceFromOrder(clientOrder: Result): number;
  protected abstract _orderExecutor(
    clientOrder: Result,
    responsePayload: TrustfulResponsePayload,
  ): Promise<ContractTransaction>;
  protected abstract _getOrderedEventFilter(): EventFilter | undefined;
  protected abstract _getProcessedEventFilter(): EventFilter | undefined;

  //
  protected async _executeOrder(
    clientOrder: Result,
    responsePayload: TrustfulResponsePayload,
  ): Promise<ContractReceipt> {
    const tx = await this._orderExecutor(clientOrder, responsePayload);
    return await tx.wait();
  }

  //
  private _unprocessedOrderIds: number[];
  private _latestProcessedId: number;
  private _bootBlockNumber: number;

  //
  private _injectedEe = new EventEmitter() as TypedEmitter<InjectionEvents>;

  //
  constructor(
    controller: TrustedValidatorBound,
    secretsStorage: SecretsStorage,
    contractAddress: string,
    abi: ContractInterface,
    bootBlockNumber: number,
  ) {
    //
    this._contract = new Contract(
      contractAddress,
      abi,
      controller.trustedValidator,
    );

    //
    this._secretsStorage = secretsStorage;
    this._unprocessedOrderIds = [];
    this._bootBlockNumber = bootBlockNumber;
    this._latestProcessedId = -1;
  }

  //
  // PRIVATE LOG
  //

  protected _logOrderInjection(clientOrder: Result) {
    //
    if (!TVLogger.mustLog) return;

    //
    console.log(chalk.grey(`${this.__logOrder(clientOrder)} event injected`));
  }

  protected _logOrderInterception(clientOrder: Result) {
    //
    if (!TVLogger.mustLog) return;

    //
    console.log(
      chalk.grey(`${this.__logOrder(clientOrder)} event intercepted`),
    );
  }

  protected _mayLogOrderPFFailure(
    clientOrder: Result,
    mbSecret: string | undefined,
  ) {
    //
    if (!TVLogger.mustLog) return;

    //
    if (typeof mbSecret === "undefined") {
      console.log(
        chalk.yellow(
          `${this.__logOrder(clientOrder)} requested secret not available anymore, using a new fresh secret`,
        ),
      );
    }
  }

  protected _logOrderRecovering() {
    //
    if (!TVLogger.mustLog) return;

    console.log(chalk.grey(`${this.__logOrderE()} recovering events...`));
  }

  protected _logOrderRecovered(howMany: number) {
    //
    if (!TVLogger.mustLog) return;

    //
    const logMsg = `${this.__logOrderE()} events to recover : ${howMany}`;

    //
    console.log(howMany ? chalk.green(logMsg) : chalk.grey(logMsg));
  }

  protected _logOrderSkipping(clientOrder: Result) {
    //
    if (!TVLogger.mustLog) return;

    //
    console.log(
      chalk.grey(`${this.__logOrder(clientOrder)} replayed, skipped.`),
    );
  }

  protected _logOrderHandled(clientOrder: Result, receipt: TransactionReceipt) {
    //
    if (!TVLogger.mustLog) return;
    console.log(
      `${this.__logOrder(clientOrder)} handled, ${getGasCostOfTx(receipt)}`,
    );
  }

  /**
   * may log warnings if client seed or hashed server seed have not been provided
   */
  protected _mayLogEventAsNotPFSafe(payload: TrustfulOrderPayloadWithNonce) {
    //
    if (!TVLogger.mustLog) return;

    //
    const isCompliant =
      !payload.clientSeed.isZero() && !payload.hashedSecret.isZero();

    //
    const payloadDescr = `(C-Seed : ${payload.clientSeed.toHexString()} | S-Hash : ${payload.hashedSecret.toHexString()})`;
    const logMsg = `${this.__logOrderN(payload.nonce)} ${!isCompliant ? "non " : ""}provably-fair compliant ${payloadDescr}`;

    //
    console.log(isCompliant ? chalk.green(logMsg) : chalk.yellow(logMsg));
  }

  protected _logMissingNonceInDB(handledOrderNonce: number) {
    //
    if (!TVLogger.mustLog) return;

    //
    console.log(
      chalk.yellow(
        `${this.__logOrderN(handledOrderNonce)} could not find recovered event in its database`,
      ),
    );
  }

  // log error
  protected _logError(err: string, clientOrder: Result) {
    //
    if (!TVLogger.mustLog) return;

    //
    console.log(chalk.red(`${this.__logOrder(clientOrder)} ${err}, skipped.`));
  }

  private __logOrderE() {
    return `[TrustedValidator][${this._REQUEST_EV}]`;
  }

  private __logOrderN(nonce: number) {
    return `[TrustedValidator][${this._REQUEST_EV} : ${nonce}]`;
  }

  private __logOrder(clientOrder: Result) {
    return this.__logOrderN(this._getNonceFromOrder(clientOrder));
  }

  //
  // PRIVATE
  //

  //
  private async _generateTrustfulResponse(
    qto: QueriedTrustfulOrder,
  ): Promise<TrustfulResponsePayload> {
    // get the payload associated with the trustful event of this client order
    const event = await this._getTrustfulOrderEventOf(qto);

    // prepare...
    let wasHashedSecretLegitimate: boolean;
    let usedSecret: string;

    // check payload, and log warnings if any
    this._mayLogEventAsNotPFSafe(event);

    // check if a hashed secret has been configured
    if (event.hashedSecret.isZero()) {
      // if no hashedSecret has been configured, means the client did not care about fairness
      // ... anyway, generate fresh secret
      usedSecret = await RandomGenerator.asHexNumber();

      // no legitimate by default
      wasHashedSecretLegitimate = false;
    } else {
      // try to reveal the stored secret from the provided hash
      const mbRevealed = this._secretsStorage.tryExtractSecretFromHash(
        event.hashedSecret,
      );

      //
      this._mayLogOrderPFFailure(qto.order, mbRevealed);

      // check if revelation succeeded
      usedSecret =
        typeof mbRevealed !== "undefined"
          ? mbRevealed // use revealed secret
          : await RandomGenerator.asHexNumber(); // generate fresh secret if the secret cannot be revealed

      // legitimacy depends on revelation success
      wasHashedSecretLegitimate = typeof mbRevealed !== "undefined";
    }

    //
    return {
      randomNumber: ProvablyFairResolver.fromPayload(event, usedSecret),
      usedSecret: BigNumber.from(usedSecret),
      wasHashedSecretLegitimate,
    };
  }

  /**
   * allows to get the trustful event order associated with the client order request
   */
  private async _getTrustfulOrderEventOf(
    qto: QueriedTrustfulOrder,
  ): Promise<TrustfulOrderPayloadWithNonce> {
    //
    const filter = this._contract.filters.RandomNumberOrdered?.(
      this._TRUSTED_PURPOSE_INDEX,
      qto.nonce,
    );

    if (filter == undefined) {
      throw new Error("Event filter is not defined");
    }

    //
    const events = await this._contract.queryFilter(
      filter,
      qto.blockNumber,
      qto.blockNumber,
    );
    const [first] = events;

    //
    if (events.length !== 1 || first == undefined) {
      throw new Error(
        `[${this._REQUEST_EV} : ${qto.nonce}] not finding associated Trustful Order (${events.length} found)`,
      );
    }

    //
    return first.args as unknown as TrustfulOrderPayloadWithNonce;
  }

  //
  private _mapEventToQTO(ev: Event): QueriedTrustfulOrder {
    if (ev.args == undefined) {
      throw new Error("Event args are not defined");
    }

    return {
      blockNumber: ev.blockNumber,
      order: ev.args,
      nonce: this._getNonceFromOrder(ev.args),
    };
  }

  // as we might be limited by the endpoint on how many past events we can query...
  private async _getEventsFromFilter(
    eventFilter: EventFilter | undefined,
    contractCreationBlockNumber: number,
  ): Promise<QueriedTrustfulOrder[]> {
    if (eventFilter == undefined) {
      throw new Error("Event filter is not defined");
    }

    // pack them by 2048 (fuji events limit per request)
    const evRanges = packUnoverlapped(
      contractCreationBlockNumber,
      this._bootBlockNumber,
      2048,
    );

    //
    const orders: QueriedTrustfulOrder[] = [];
    for (const [from, to] of evRanges) {
      orders.push(
        ...(await this._contract
          .queryFilter(eventFilter, from, to)
          .then((evts) => evts.map((e) => this._mapEventToQTO(e)))),
      );
    }

    //
    return orders;
  }

  /**
   * must returns all the events that has not been handled yet
   */
  private async _recoverEventsToProcess(): Promise<QueriedTrustfulOrder[]> {
    //
    this._logOrderRecovering();

    //
    const contractCreationBlock = (
      (await this._contract.CREATION_BLOCK()) as BigNumber
    ).toNumber();

    // get all orders events
    const ordered = await this._getEventsFromFilter(
      this._getOrderedEventFilter(),
      contractCreationBlock,
    );

    // get all processed orders events
    const processedIds = await this._getEventsFromFilter(
      this._getProcessedEventFilter(),
      contractCreationBlock,
    ).then((o) => o.map((e) => e.nonce));

    // get the latest order that have been processed
    this._latestProcessedId =
      processedIds.length === 0 ? -1 : Math.max(...processedIds);

    // get all the orders IDs which have not been processed
    this._unprocessedOrderIds = ordered
      .filter((x) => !processedIds.includes(x.nonce))
      .map((o) => o.nonce);

    // only forward orders that have NOT been processed already
    const recovered = ordered.filter((ev) =>
      this._unprocessedOrderIds.includes(ev.nonce),
    );

    //
    this._logOrderRecovered(recovered.length);

    //
    return recovered;
  }

  /** @return either should process as recovering order, new order, or not process at all */
  private _isOrderProcessingAllowed(
    orderNonce: number,
  ): OrderProcessAllowance | boolean {
    if (this._unprocessedOrderIds.includes(orderNonce))
      return OrderProcessAllowance.AllowedRecovered;
    if (orderNonce > this._latestProcessedId)
      return OrderProcessAllowance.AllowedNew;
    return false;
  }

  //
  private _updateReplayDatabase(
    allowanceType: OrderProcessAllowance,
    handledOrderNonce: number,
  ) {
    // if recovering...
    if (allowanceType === OrderProcessAllowance.AllowedRecovered) {
      // find the index of the associated nonce to remove from "to-be-recovered" array
      const indexToDelete =
        this._unprocessedOrderIds.indexOf(handledOrderNonce);

      // if not found...
      if (indexToDelete === -1) {
        // log...
        this._logMissingNonceInDB(handledOrderNonce);

        // stop right there
        return;
      }

      // ... if found, remove from array
      this._unprocessedOrderIds.splice(indexToDelete, 1);
    }

    // anyway, may update the latest processed id
    if (
      // ... if new order (not recovered)
      allowanceType === OrderProcessAllowance.AllowedNew ||
      // ... or if the handled order nonce is above latest processed nonce
      handledOrderNonce > this._latestProcessedId
    ) {
      this._latestProcessedId = handledOrderNonce;
    }
  }

  /**
   * @returns events that were produced by the order execution
   */
  private async _handleOrder(qto: QueriedTrustfulOrder): Promise<Event[]> {
    // check if we are allowed to process
    const allowance = this._isOrderProcessingAllowed(qto.nonce);

    // if order is replayed, skip
    if (typeof allowance === "boolean") {
      // log ...
      this._logOrderSkipping(qto.order);

      // return empty array that will be filtered out
      return [];
    }

    // ... else, xecute the order
    const payload = await this._generateTrustfulResponse(qto);
    const receipt = await this._executeOrder(qto.order, payload);

    // update replay database with nonce
    this._updateReplayDatabase(allowance, qto.nonce);

    //
    this._logOrderHandled(qto.order, receipt);

    // prevents forwarding events that are not contract-native (eg, triggered by sub-contract calls)
    return receipt.events?.filter((x) => x.event) ?? [];
  }

  private _getRecoverEventsObservable(): Observable<QueriedTrustfulOrder> {
    return from(this._recoverEventsToProcess()).pipe(concatAll());
  }

  private _getInjectedEventsObservable(): Observable<QueriedTrustfulOrder> {
    return fromEvent(this._injectedEe, "injected").pipe(
      map((e) => this._mapEventToQTO(e)),
      tap((qto) => this._logOrderInjection(qto.order)),
    );
  }

  private _getBlockchainEventsObservable(): Observable<QueriedTrustfulOrder> {
    return fromEvent<Event[]>(this._contract, this._REQUEST_EV).pipe(
      // latest arg always contains event Result
      map((packed) => {
        const last = packed[packed.length - 1];
        if (last == undefined) {
          throw new Error("Last event in queue is undefined");
        }
        return this._mapEventToQTO(last);
      }),
      tap((qto) => this._logOrderInterception(qto.order)),
    );
  }

  //
  // PUBLIC
  //

  /**
   * try to inject directly events from a receipt into the order pipeline
   * @returns if an event has been injected
   */
  public tryInject(receipt: ContractReceipt): boolean {
    const matching =
      receipt.events?.filter((e) => e.event === this._REQUEST_EV) ?? [];
    const [first] = matching;
    if (first == undefined) return false;
    this._injectedEe.emit("injected", first);
    return true;
  }

  /**
   * bind all events sources into an observable and start handling orders
   */
  public run(rc: RunContext) {
    //
    const c = concat(
      // first, recover all that can
      this._getRecoverEventsObservable(),
      // then handle whatever comes between injected and legitimate events from blockchain
      merge(
        this._getInjectedEventsObservable(),
        this._getBlockchainEventsObservable(),
        // might receive stop event
        rc.stopper$.pipe(map(() => null as unknown as QueriedTrustfulOrder)),
      ),
    ).pipe(
      // if intercepting stop event or just stopping, completes
      takeWhile((qto) => rc.keepAlive && qto != null),
      // handle orders one after the other
      concatMap((e) =>
        this._handleOrder(e)
          // whenever fails...
          .catch<Event[]>((err) => {
            // log error
            this._logError(err, e.order);

            // silently skip, keeps trying to handle the next orders
            return [];
          }),
      ),
      // do not forwards empty arrays (errored handling / skipped replayed events)
      filter((r) => r.length > 0),
      // when completing, tells that this running session ends
      finalize(() => console.log(chalk.grey(`${this.__logOrderE()} Stopped.`))),
    );

    return c;
  }
}
