import type { Observable} from 'rxjs';
import { catchError, concatMap,exhaustMap, of, share, Subject, tap, throttleTime } from 'rxjs'

import { getMeaningfulMessageFromError } from '#/src/lib/EthersErrorDigger'

/**
* @dev === null means never ran
* @dev === string means ran with failure
* @dev === false means not running
* @dev === true means running
*/
export type SEPRunState = boolean | string
type SEPRunStateUpdate = (state: SEPRunState) => void
type Raisable<A, R> = (cbArgs?: A) => Promise<R>

/**
 * Wrapper around a Promise to prevent multiple parallel firings
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class SingleExecPromise<A = any, R = void> {
  //
  private _subject = new Subject<A>()

  //
  private _mc : Observable<void | R>

  //
  private _raisable: Raisable<A, R>
  private _rsUpdater : SEPRunStateUpdate

  /** shorthand for synchronous raisable, wrapped */
  static of<A, R> (raisable: ((args: A) => R), runStateUpdater?: SEPRunStateUpdate) {
    return new SingleExecPromise((args: A) => new Promise<R>(resolve => resolve(raisable(args))), runStateUpdater)
  }

  /** shorthand for async raisable */
  static from<A, R> (raisable: Raisable<A, R>, runStateUpdater?: SEPRunStateUpdate) {
    return new SingleExecPromise(raisable, runStateUpdater)
  }

  /**
   * constructor
   * @param raisable callback that generates a Promise, which will be runnable in an un-parallelable manner by calling raise()
   * @param runStateUpdater callback that will hydrate the SEP state
   */
  private constructor (raisable: Raisable<A, R>, runStateUpdater?: SEPRunStateUpdate) {
    //
    this._rsUpdater = runStateUpdater
    this._raisable = raisable

    //
    this._init()
  }

  //
  private _init () {
    //
    this._mc = this._subject.pipe(
      // if no others request has been made for 2 seconds, accept 1
      throttleTime(2_000),
      // if a pending operation is still running, ignore further requests until this one is done...
      exhaustMap(args =>
        //
        of(undefined).pipe(
          tap(() => this._rsUpdater?.(true)),
          concatMap(() => this._raisable(args)),
          tap(() => this._rsUpdater?.(false)),
          catchError(e => {
            //
            const meaningfulMsg = getMeaningfulMessageFromError(e)

            // may update state
            this._rsUpdater?.(meaningfulMsg)

            // log
            console.warn(
              SingleExecPromise._failedRaisableErrMsg(
                meaningfulMsg,
                this._raisable
              )
            )

            //
            return of(null)
          })
        )
      ),
      // whenever failed of succeeded, result is still shared
      share()
    )

    //
    this._mc.subscribe()
  }

  //
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static _failedRaisableErrMsg (msg: string, cb: any) {
    return cb.toString()
      .replaceAll('\n', '')
      .replaceAll('  ', ' ')
      .replaceAll('  ', ' ')
      .replaceAll('  ', ' ') + ' : ' + msg
  }

  //
  //
  //

  /**
   * try to run the associated promise as soon as possible. Does noting if the callback is already running
   */
  raise (args?: A) {
    this._subject.next(args)
  }

  /**
   * wait for the latest response of the callback to be fired. Wait indefinitely if no execution was requested beforehand
   */
  async latest () {
    return await new Promise<void | R>(resolve => {
      const subscription = this._mc.subscribe(results => {
        subscription.unsubscribe()
        resolve(results)
      })
    })
  }

  /**
   * combines raise() and latest()
   * asks to run the associated promise if possible, and wait for a response to be fired
   */
  async raiseAndWait (args?: A) {
    // first, setup listener
    const listener = this.latest()

    // then, raise
    this.raise(args)

    // now, wait for listener to be triggered
    return await listener
  }
}
