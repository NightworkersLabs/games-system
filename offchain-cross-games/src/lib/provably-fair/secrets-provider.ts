import chalk from "chalk";
import type { BigNumber } from "ethers";
import { keccak256 } from "ethers/lib/utils.js";
import { EventEmitter } from "node:events";
import type { Observable, Subscription } from "rxjs";
import {
  firstValueFrom,
  from,
  fromEvent as rxFromEvent,
  map,
  mergeMap,
  race,
  timer,
} from "rxjs";
import type TypedEmitter from "typed-emitter/rxjs/index.js";
import { type FromEvent } from "typed-emitter/rxjs/index.js";

import { RandomGenerator } from "#/src/lib/provably-fair/compliance";

const fromEvent = rxFromEvent as FromEvent;

type SecretDisposerEvents = {
  dispose: () => void;
};

interface SecretInstance {
  secret: string;
  disposer: TypedEmitter<SecretDisposerEvents>;
}

interface SecretHashWithDisposer {
  secretHash: string;
  disposer: TypedEmitter<SecretDisposerEvents>;
}

interface SecretDismissal {
  hasTimedOut: boolean;
  secretHash: string;
}

type SecretsGenerationEvents = {
  secretGenerated: (hash: SecretHashWithDisposer) => void;
};

//
//
//

/** */
const mustLog = true;

//
//
//

//
export class SecretsStorage {
  //
  private _secretsStore = new Map<string, SecretInstance>();

  //
  private _secretsLifecycle =
    new EventEmitter() as TypedEmitter<SecretsGenerationEvents>;
  private _lifecycleObs: Observable<SecretDismissal>;
  private _lifecycleSub: Subscription;

  public static DEFAULT_SECONDS_BEFORE_AUTODISPOSE = 3 * 60;
  public readonly secsBeforeAutoDispose: number;

  /**
   * @param secsBeforeAutoDispose how many seconds before a generated secret is automatically discarded
   */
  constructor(
    secsBeforeAutoDispose: number = SecretsStorage.DEFAULT_SECONDS_BEFORE_AUTODISPOSE,
  ) {
    //
    if (secsBeforeAutoDispose < 5) {
      throw new Error(
        "auto-dispose of secrets should not be done under 5 seconds !",
      );
    }

    this.secsBeforeAutoDispose = secsBeforeAutoDispose;
    const msBAD = secsBeforeAutoDispose * 1_000;

    //
    this._lifecycleObs = fromEvent(
      this._secretsLifecycle,
      "secretGenerated",
    ).pipe(
      // for each secret generated...
      mergeMap((instance) => {
        //
        const hasTimedOutP = firstValueFrom(
          // race between...
          race(
            // a time-out timer
            timer(msBAD).pipe(map(() => true)),
            // the dispose event triggered
            fromEvent(instance.disposer, "dispose").pipe(map(() => false)),
          ),
        );

        //
        return from(hasTimedOutP).pipe(
          map((timedOut) => {
            // dismiss
            this.dismissSecret(instance.secretHash);

            //
            return {
              hasTimedOut: timedOut,
              secretHash: instance.secretHash,
            };
          }),
        );
      }),
    );

    //
    this._lifecycleSub = this._lifecycleObs.subscribe((dismissal) => {
      // log secret discard
      if (dismissal.hasTimedOut && mustLog) {
        console.log(
          chalk.grey(
            `[SecretsStorage] ${dismissal.secretHash} timed out, dismissed.`,
          ),
        );
      }
    });

    //
    if (mustLog) {
      console.log("[SecretsStorage] Ready.");
    }
  }

  /**
   * find a non-stored secret to store in DB
   * @returns stored secret hash
   */
  private _storeUnusedSecret(): string {
    while (true) {
      // get a fresh secret as hex string....
      const secret = RandomGenerator.asHexNumber();

      // hash it...
      const secretHash = keccak256(secret);

      // check if no collision
      if (this._secretsStore.has(secretHash)) {
        continue;
      }

      // store the secret with his hash as his key
      const disposer = new EventEmitter() as TypedEmitter<SecretDisposerEvents>;
      this._secretsStore.set(secretHash, { secret, disposer });

      //
      this._secretsLifecycle.emit("secretGenerated", {
        disposer,
        secretHash,
      });

      //
      return secretHash;
    }
  }

  /**
   * stopping auto-dispose subscription makes the process stop waiting for timer() instances to complete
   */
  shutdown() {
    //
    if (mustLog) {
      console.log("[SecretsStorage] shutting down...");
    }

    //
    this._lifecycleSub.unsubscribe();
  }

  //
  // PUBLIC
  //

  /**
   * produce and secret and stores it on the server, waiting for it to be used later in an order
   * @returns the keccak256 hash of the secret generated, as an hex string representation
   */
  public requestSecretH(): string {
    // hash it...
    const secret = this._storeUnusedSecret();

    //
    if (mustLog) {
      console.log(`[SecretsStorage] secret requested (hash : ${secret})`);
    }

    // cast hash to big number and return
    return secret;
  }

  /**
   * try to reveal the secret associated with the requested hash, as hex string.
   * A positive reveal leads to a dismiss.
   */
  tryExtractSecretFromHash(hashedSecret: BigNumber): string | undefined {
    // if hashed secret is set to 0, just return
    if (hashedSecret == null || hashedSecret.isZero()) {
      return undefined;
    }

    // cast to hex string representation
    const hashedAsHexStr = hashedSecret.toHexString();

    // try to get the associated secret reprensented as hex string
    const mbResult = this._secretsStore.get(hashedAsHexStr);

    // dismiss from database if secret has been successfully fetched
    if (typeof mbResult !== "undefined") {
      // ask for dismiss
      mbResult.disposer.emit("dispose");

      // may log on success
      if (mustLog) {
        console.log(
          `[SecretsStorage] secret extracted (hash : ${hashedAsHexStr})`,
        );
      }

      // return the hex representation
      return mbResult.secret;
    }

    //
    return undefined;
  }

  //
  dismissSecret(hexHashedSecretToDismiss: string): boolean {
    return this._secretsStore.delete(hexHashedSecretToDismiss);
  }
}
