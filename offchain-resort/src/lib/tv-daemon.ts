import type { BigNumber, Signer } from "ethers";
import { type ContractReceipt, type Event } from "ethers";
import { EventEmitter } from "node:events";
import type { Observable } from "rxjs";
import {
  fromEvent as rxFromEvent,
  lastValueFrom,
  merge,
  share,
  takeWhile,
  tap,
} from "rxjs";
import type TypedEmitter from "typed-emitter/rxjs/index.js";
import { type FromEvent } from "typed-emitter/rxjs/index.js";

import LotteryABI from "#/abi/Lottery.json";
import NightworkersGameABI from "#/abi/NightworkersGame.json";
import RedLightDistrictABI from "#/abi/RedLightDistrict.json";
import TableGamesABI from "#/abi/TableGames.json";
import { TVLogger } from "#/src/lib/params";
import { RandomGenerator } from "#/src/lib/provably-fair/random-generator";
import type { SecretsStorage } from "#/src/lib/provably-fair/secrets-provider";
import { CFWatcher } from "#/src/lib/validator/instances/Coinflip";
import { LotteryWatcher } from "#/src/lib/validator/instances/Lottery";
import { NWGWatcher } from "#/src/lib/validator/instances/NightworkersGame";
import { RLDWatcher } from "#/src/lib/validator/instances/RedLightDistrict";
import { RouletteWatcher } from "#/src/lib/validator/instances/Roulette";
import type { TrustedValidatorWatcher } from "#/src/lib/validator/watcher";
import { TrustfulOrderPayload } from "#/src/lib/validator/watcher";

const fromEvent = rxFromEvent as FromEvent;

export type RunContext = {
  keepAlive: boolean;
  stopper$: Observable<void>;
};

export type TVDaemonArgs = {
  trustedValidator: Signer;
  nwContractAddress: string;
  rldContractAddress: string;
  tgContractAddress: string;
  lotteryContractAddress: string;
};

export class TrustedValidatorBound {
  //
  trustedValidator: Signer;

  //
  constructor(trustedValidator: Signer) {
    this.trustedValidator = trustedValidator;
  }
}

type TVDEvents = {
  stop: () => void;
  orderHandled: (events: Event[]) => void;
};

export class TrustedValidatorDaemon extends TrustedValidatorBound {
  //
  // CONSTRUCTOR
  //

  //
  private _instances: TrustedValidatorWatcher[];
  private _secretsStorage: SecretsStorage;

  //
  private _evE = new EventEmitter() as TypedEmitter<TVDEvents>;
  private _runContext: RunContext = {
    keepAlive: true,
    stopper$: fromEvent(this._evE, "stop").pipe(share()),
  };

  //
  constructor(
    args: TVDaemonArgs,
    secretsStorage: SecretsStorage,
    recoverFromBlockNumber: number,
  ) {
    super(args.trustedValidator);

    //
    this._secretsStorage = secretsStorage;

    //
    this._instances = [
      new NWGWatcher(
        this,
        this._secretsStorage,
        args.nwContractAddress,
        NightworkersGameABI,
        recoverFromBlockNumber,
      ),
      new RLDWatcher(
        this,
        this._secretsStorage,
        args.rldContractAddress,
        RedLightDistrictABI,
        recoverFromBlockNumber,
      ),
      new CFWatcher(
        this,
        this._secretsStorage,
        args.tgContractAddress,
        TableGamesABI,
        recoverFromBlockNumber,
      ),
      new RouletteWatcher(
        this,
        this._secretsStorage,
        args.tgContractAddress,
        TableGamesABI,
        recoverFromBlockNumber,
      ),
      new LotteryWatcher(
        this,
        this._secretsStorage,
        args.lotteryContractAddress,
        LotteryABI,
        recoverFromBlockNumber,
      ),
    ];
  }

  //
  // PUBLIC
  //

  /**
   * try to inject events from receipt into pipelines, and wait for the next order to be proceeded
   * * @returns a promise completing when an order has been received
   */
  injectAndWait(receipt: ContractReceipt) {
    //
    for (const instance of this._instances) {
      // if injection failed, try on another instance
      if (!instance.tryInject(receipt)) continue;

      // injection succeeded, let's wait for it to be handled
      return new Promise<Event[]>((resolve) => {
        this._evE.once("orderHandled", resolve);
      });
    }

    //
    throw new Error("Injection failed");
  }

  /**
   * let a last order be processed before stopping gracefully
   */
  stop() {
    //
    if (TVLogger.mustLog) {
      console.log("[TrustedValidator] Stopping ...");
    }

    //
    this._runContext.keepAlive = false;

    //
    this._evE.emit("stop");
  }

  /**
   * exectute, return a job promise on which we can wait
   */
  async exec() {
    // run !
    const jobs = merge(...this._instances.map((i) => i.run(this._runContext)));

    //
    if (TVLogger.mustLog) {
      console.log("[TrustedValidator] Ignited.");
    }

    // the first triggering...
    await lastValueFrom(
      jobs.pipe(
        // emit event
        tap((e) => this._evE.emit("orderHandled", e)),
        // after each order handled, check if we must keep going
        takeWhile(() => this._runContext.keepAlive),
      ),
      {
        defaultValue: null,
      },
    );

    //
    if (TVLogger.mustLog) {
      console.log("[TrustedValidator] Stopped.");
    }
  }

  /**
   * get a server secret hash from the provider
   */
  async requestSecret(): Promise<BigNumber> {
    return await this._secretsStorage.requestSecret();
  }

  /**
   * generate a random provably-fair compliant trustful order payload
   * should only be used in a test environment
   * @returns the payload to be used in an order
   */
  async generateTrustfullOrderPayload(): Promise<TrustfulOrderPayload> {
    return new TrustfulOrderPayload(
      await RandomGenerator.asBigNumber(),
      await this._secretsStorage.requestSecret(),
    );
  }

  /**
   * gets the bound to the bot account balance
   */
  async getBalance(): Promise<BigNumber> {
    return this.trustedValidator.getBalance();
  }
}
