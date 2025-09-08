import { SEPRunState, SingleExecPromise } from 'lib/SingleExecPromise'
import { StoreSlice } from 'lib/store/_'
import { Contract, ContractTransaction, EventFilter, Event, BigNumber } from 'ethers'
import { IGameSlice } from '../game'
import { _runBasicPopupTx } from './runners/basic'
import { TrustfulBotResponse, TrustfulPayloadContext } from '../_/trustful'

//
// BASE DEF
//

export class PopupTx<AnyPopupTxWaitingStep, R = Event> {
  /** description of the transaction: 1. start with a verb, 2. do NOT use gerond (-ing) */
  description: string
  /** state of the transaction */
  runState?: SEPRunState
  /** callback when tx succeeded */
  onSuccess?: SingleExecPromise | ((args?: R) => void)
  /** callback when tx ran */
  onFinally?: () => void
  /** current tx step */
  stepState?: AnyPopupTxWaitingStep
}

//
// SECURE DEF
//

export interface TrustfulRequest {
    /** seed that the user might have chosen */
    seed?: BigNumber
    /** hash of a temporary secret requested from the server */
    secretHash?: BigNumber
}
export type TrustfulHandler<T> = (payload: TrustfulRequest) => Promise<T>

interface BaseSecurePopupTx<T> extends TrustfulPayloadContext {
    /** callback that will call the underlying service, which will deposit a "Secure Transaction" request */
    submit: TrustfulHandler<T>
}

/** Every steps a "Secure Transaction" goes through */
export enum OnChainSecurePopupTxWaitingStep {
    /** Intitial step, passing the order */
    Local,
    /** Waiting on the blockchain to confirm the order */
    Blockchain,
    /** Waiting on the validation bot to process the order */
    ValidationBot,
    /** Order handled, tx succeeded */
    Done
}

export interface ProvableSecurePopupTx {
    /** payload content when validation bot handled the order */
    provableBotResponse?: TrustfulBotResponse
}

/** Secure tx which is not expected to produce a response from the Validation Bot */
export interface AgnosticOnChainSecurePopupTx extends
    PopupTx<OnChainSecurePopupTxWaitingStep>,
    BaseSecurePopupTx<ContractTransaction> {
    /** callback which will trigger when the confirmation of the order was received from the blockchain */
    onOrdered?: (events: Event[]) => void
    /**
     * will minimize the modal carrying the popup tx once the initial transaction has been sent to the blockchain
     */
    mayMinimizeOnTxSent?: boolean
}

/** Secure Tx which expects a response from the Validation Bot, on which will will wait on */
export interface EndToEndOnChainSecurePopupTx extends AgnosticOnChainSecurePopupTx, ProvableSecurePopupTx {
    /** context id of the transaction */
    purposeId : number
    /** blockchain contract bound to the purposeId which we will listen events on */
    contractToListen: Contract
    /** callback that will produce the filter event used to get the Validation Bot response on the blockchain */
    eventsFilter: (contract: Contract, nonce: number) => EventFilter
}

//
export type AnyOnChainSecurePopupTx = EndToEndOnChainSecurePopupTx | AgnosticOnChainSecurePopupTx
export type AnySecurePopupTx = AnyOnChainSecurePopupTx

//
// BASIC DEF
//

/** Every steps a "Standard Transaction" goes through */
export enum BasicPopupTxWaitingStep {
    /** Optionnal approval phase, waiting for the tx to be sent to blockchain */
    ApprovalLocal,
    /** Optionnal approval phase, waiting for the tx to be accepted by the blockchain */
    ApprovalBlockchain,
    /** Waiting for the tx to be sent to the blockchain */
    Local,
    /** Waiting for the tx to be accepted by the blockchain */
    Blockchain,
    /** Tx accepted */
    Done
}

/** Standard, 1-step transaction */
export interface StandardPopupTx extends PopupTx<BasicPopupTxWaitingStep> {
    /** callback that invoke the subsequent blockchain call of the tx */
    txFunc: () => Promise<ContractTransaction>
    /** optionnal filter that will determine which event to be resolved as tx response */
    eventsFilterName?: string
}

/** 2-step (approval + tx) transaction */
export interface TwoStepsPopupTx extends StandardPopupTx {
    /** callback that will first check allowance before maybe attempting to increase allowance */
    allowanceCheck: () => Promise<BigNumber>
    /** callback that may invoke the preleminary allowance increase blockchain call (if needed) */
    increaseAllowanceFunc: (remainingToApprove: BigNumber) => Promise<ContractTransaction>
    /** how much must be allowed */
    toAllow: BigNumber
}

//
export type AnyBasicPopupTx = TwoStepsPopupTx | StandardPopupTx

//
export type AnyPopupTx = AnySecurePopupTx | AnyBasicPopupTx

//
//
//

//
export function isSecurePopupTx (object: AnyPopupTx): object is AnySecurePopupTx {
  return 'submit' in object
}

/** checks whenever this onchain secure popup tx is End-to-End */
export function isOCEtEPopupTx (object: AnySecurePopupTx): object is EndToEndOnChainSecurePopupTx {
  return 'purposeId' in object
}

/** checks whenever this secure popup tx can produce an provability response */
export function isProvable (object: any): object is ProvableSecurePopupTx {
  return isOCEtEPopupTx(object)
}

//
export function isBasicPopupTx (object: AnyPopupTx): object is AnyBasicPopupTx {
  return 'txFunc' in object
}

//
export function isTwoStepsPopupTx (object: AnyBasicPopupTx): object is TwoStepsPopupTx {
  return 'increaseAllowanceFunc' in object
}

//
// SLICE
//

export type TxUpdater = (txId: number, updated: AnyPopupTx) => boolean

export interface PopupTxInvokeParams <T = AnyPopupTx> {
    popupTxId: number,
    popupTx: T,
    /** calback that may update current popup tx state, and allow continuation of the current off-loaded transaction execution */
    updater: TxUpdater,
    balanceRefresher: () => void
}

export interface SecurePopupTxInvokeParams<T = AnySecurePopupTx> extends PopupTxInvokeParams<T> {
    modalMinimizer: () => void
}

export interface IPopupTxSlice {
    //
    isPopupTxVisible: boolean

    //
    currentPopupTx?: AnyPopupTx
    currentPopupTxID?: number

    //
    setupAgnosticPopupTx: (conf: AgnosticOnChainSecurePopupTx) => void
    setupEndToEndPopupTx: (conf: EndToEndOnChainSecurePopupTx) => void
    setupStandardPopupTx: (conf: StandardPopupTx) => void
    setupTwoStepsPopupTx: (conf: TwoStepsPopupTx) => void

    //
    showPopupTx: () => void
    minimizePopupTx: () => void
    clearPopupTx: () => void
}

export interface IProtectedPopupTxSlice {
    _mayUpdatePopupTxAndContinue: TxUpdater
}

interface IPrivateSlice {
    _setupPopupTx: (conf: AnyPopupTx) => void
}

/** returns the expected number of steps that a specific popup Tx has to go through */
export function getPopupTxCurrentStep (popupTx: AnyPopupTx) : [number, number] {
  if (popupTx == null) return [0, 0]

  //
  const currentStep = popupTx.stepState != null ? popupTx.stepState + 1 : 0

  //
  if (isBasicPopupTx(popupTx)) {
    //
    const stepsCount = Object.keys(BasicPopupTxWaitingStep).length / 2

    //
    return isTwoStepsPopupTx(popupTx)
      ? [currentStep, stepsCount]
      : [currentStep - 2, stepsCount - 2]
    //
  } else {
    //
    const stepsCount = Object.keys(OnChainSecurePopupTxWaitingStep).length / 2

    //
    return isOCEtEPopupTx(popupTx)
      ? [currentStep, stepsCount]
      : [Math.max(currentStep, stepsCount - 1), stepsCount - 1]
  }
}

const slice: StoreSlice<IPopupTxSlice & IPrivateSlice & IProtectedPopupTxSlice, IGameSlice> = (set, get) => ({
  isPopupTxVisible: false,
  //
  setupAgnosticPopupTx: conf => get()._setupPopupTx(conf),
  setupEndToEndPopupTx: conf => get()._setupPopupTx(conf),
  setupStandardPopupTx: conf => get()._setupPopupTx(conf),
  setupTwoStepsPopupTx: conf => get()._setupPopupTx(conf),
  //
  _setupPopupTx: conf => {
    //
    if (isSecurePopupTx(conf)) {
      conf.wantedAsProvable = get().useProvablyFairness
    }

    //
    const cstx = get().currentPopupTx
    if (cstx?.runState !== false) {
      cstx?.onFinally?.()
    }

    //
    const newId = get().currentPopupTxID ?? 1
    set({
      currentPopupTx: conf,
      currentPopupTxID: newId
    })

    // auto-run basic popup transactions
    if (isBasicPopupTx(conf)) {
      _runBasicPopupTx({
        popupTxId: newId,
        popupTx: conf,
        updater: () => get()._mayUpdatePopupTxAndContinue(newId, conf),
        balanceRefresher: () => get().refreshBalances()
      })
    }

    //
    get().showPopupTx()
  },
  _mayUpdatePopupTxAndContinue: (txId, updated) => {
    if (txId < get().currentPopupTxID) return false
    if (get().currentPopupTx == null) return false

    //
    set({ currentPopupTx: { ...updated } })
    return true
  },
  showPopupTx: () => set({ isPopupTxVisible: true }),
  minimizePopupTx: () => set({ isPopupTxVisible: false }),
  clearPopupTx: () => {
    //
    const cstx = get().currentPopupTx
    if (cstx?.runState !== false) {
      cstx?.onFinally?.()
    }

    //
    set({ currentPopupTx: null })
  }
})

export default slice
