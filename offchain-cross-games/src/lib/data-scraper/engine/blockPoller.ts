import { Contract } from 'ethers'
import {
  delayWhen,
  expand,
  timer,
  of,
  catchError,
  tap,
  takeWhile,
  race,
  interval,
  filter,
  finalize,
  concatMap
} from 'rxjs'
import { BasicScraperEngine, type LogType } from './basicScraperEngine'

//
export abstract class BlockPoller extends BasicScraperEngine {
  //
  private static _BLOCK_NUM_POLL_WAIT_MS = 20_000

  //
  private __logBCB (msg: string, color?: LogType, skippedInProd?: boolean) {
    super.__logB(`{BlockPoller} ${msg}`, color, skippedInProd)
  }

  //
  override __logB (msg: string, color?: LogType, skippedInProd?: boolean) {
    super.__logB(msg, color, skippedInProd)
  }

  //
  //
  //

  protected _produceBlockNumberPoller (contract: Contract) {
    // init with contract creation block
    return of<number | undefined>(undefined).pipe(
      // recursively loops after first value was emitted
      expand(previousBlockNumber =>
        of(null).pipe(
          // might wait before fetching block number...
          delayWhen(() => {
            // if previous block number is undefined, means poller never ran ;
            if (previousBlockNumber === undefined) {
              // skips sleep
              return timer(0)
            }

            // log that we will sleep...
            this.__logBCB(`Sleep for ${BlockPoller._BLOCK_NUM_POLL_WAIT_MS} ms`, 'discrete', true)

            // race between...
            return race([
              // ...waiting for x seconds
              interval(BlockPoller._BLOCK_NUM_POLL_WAIT_MS).pipe(
                tap(() => this.__logBCB(`Waited ${BlockPoller._BLOCK_NUM_POLL_WAIT_MS} ms, syncing...`, 'discrete', true))
              ),
              // ...the stop event
              this._waitForStopEvent$.pipe(
                tap(() => this.__logBCB('Exiting...', 'discrete'))
              )
            ])
          }),
          // escape trigger if stopped
          takeWhile(() => this._mustContinue()),
          // get latest block number
          concatMap(() => contract.provider.getBlockNumber()),
          // log depending on change from previous block...
          tap(fetchedBn => {
            //
            if (fetchedBn > (previousBlockNumber as number) /** COULD NOT BE UNDEFINED HERE */) {
              this.__logBCB(`Newer block ! => ${fetchedBn}`, 'discrete', true)
            } else if (previousBlockNumber === undefined) {
              this.__logBCB(`Initial block : [${fetchedBn}]`, 'discrete')
            } else {
              this.__logBCB('Already up-to-date.', 'discrete', true)
            }
          }),
          // if any of failed...
          catchError(e => {
            // log...
            this.__logBCB(`Fetching failed: ${e}`, 'warning')

            // returns "null" to be skipped by subsequent filter
            return of<number | null>(null)
          })
        )
      ),
      // ignore initial recursed loop / errored
      filter(pbn => pbn != null),
      // each time recursive returns checks whenever stop signal has been triggered
      takeWhile(() => this._mustContinue()),
      // tells that poller ended on "empty" triggered
      finalize(() => this.__logBCB('Exited.', 'discrete'))
    )
  }
}
