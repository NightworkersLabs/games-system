import chalk from "chalk";
import { EventEmitter } from "node:events";
import type { Observable } from "rxjs";
import { fromEvent, share } from "rxjs";

import { isProdEnv } from "#env/defaults";

export enum RunState {
  Idle,

  Running,

  Stopping,
}

//
export type LogType = "normal" | "warning" | "discrete";

//
export abstract class BasicScraperEngine {
  //
  private _workerEH = new EventEmitter();
  private _runState = RunState.Idle;

  //
  public readonly chainId: number;

  //
  constructor(chainId: number) {
    this.chainId = chainId;
  }

  //
  static _STOP_EV_NAME = "stop";

  //
  protected _waitForStopEvent$ = fromEvent(
    this._workerEH,
    BasicScraperEngine._STOP_EV_NAME,
  ).pipe(share());

  //
  //
  //

  //
  protected _mustContinue() {
    return this._runState !== RunState.Stopping;
  }

  //
  public stop() {
    // if already stopping, nothing to do
    if (!this._mustContinue()) return;

    //
    this.__logB(" Stopping...");
    this._runState = RunState.Stopping;
    this._workerEH.emit(BasicScraperEngine._STOP_EV_NAME);
  }

  //
  public async run() {
    // check if not already running...
    if (this._runState !== RunState.Idle) {
      throw new Error("Already running or stopping !");
    }

    this.__logB(" Initializing...");

    // ... if not, define as running
    this._runState = RunState.Running;

    //
    return this._run();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected abstract _run(): Promise<Observable<any>>;

  //
  //
  //

  //
  protected __logB(msg: string, color?: LogType, skippedInProd?: boolean) {
    const fMsg = `[EventsScraper] - ${this.chainId} - ${msg}`;
    BasicScraperEngine.__log(fMsg, color, skippedInProd);
  }

  //
  protected static __log(
    msg: string,
    color: LogType = "normal",
    skippedInProd = false,
  ) {
    //
    if (skippedInProd && isProdEnv()) return;

    //
    switch (color) {
      case "discrete":
        console.log(chalk.gray(msg));
        break;
      case "warning":
        console.log(chalk.yellow(msg));
        break;
      case "normal":
      default:
        console.log(msg);
        break;
    }
  }
}
