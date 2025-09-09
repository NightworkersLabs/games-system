import { BigNumber } from 'ethers'

import { getMeaningfulMessageFromError } from '#/lib/EthersErrorDigger'
import { SingleExecPromise } from '#/lib/SingleExecPromise'
import type { ChipsBalance } from '#/lib/store/slices/casino-bank/user-context'
import type {
  AnyPopupTx,
  APISecurePopupTx,
  SecurePopupTxInvokeParams} from '#/lib/store/slices/popup-tx/handler';
import {
  APISecurePopupTxWaitingStep,
  isApiSecurePopupTx,
  isSecurePopupTx} from '#/lib/store/slices/popup-tx/handler'

//
export const isAPICasinoBetRunning = (popupTx: AnyPopupTx) => {
  return popupTx && isSecurePopupTx(popupTx) && isApiSecurePopupTx(popupTx) && popupTx.runState === true
}

//
export const runAPISecurePopupTx = async ({
  popupTxId,
  popupTx,
  updater,
  balanceRefresher,
  modalMinimizer
}: SecurePopupTxInvokeParams<APISecurePopupTx>) => {
  //
  try {
    //
    popupTx.runState = true
    popupTx.stepState = APISecurePopupTxWaitingStep.Requested
    if (!updater(popupTxId, popupTx)) return

    //
    modalMinimizer()

    // run the proxied function to get the Tx
    const [httpResponse] = await Promise.allSettled([
      popupTx.submit({
        seed: popupTx.wantedAsProvable ? popupTx.clientSeed : null,
        secretHash: popupTx.wantedAsProvable ? popupTx.pshPayload?.hash : null
      }),
      new Promise(resolve =>
        setTimeout(resolve,
          randomWithinRange(...popupTx.minimalMsThrottleRange)
        )
      )
    ])

    //
    if (httpResponse.status === 'rejected') {
      throw httpResponse.reason
    }

    const data = httpResponse.value

    //
    balanceRefresher(data.updatedBalance as ChipsBalance)

    //
    if (popupTx.onSuccess instanceof SingleExecPromise) {
      popupTx.onSuccess.raise()
    } else {
      popupTx.onSuccess?.(data)
    }

    //
    popupTx.runState = false
    popupTx.stepState = APISecurePopupTxWaitingStep.Responded
    popupTx.provableBotResponse = {
      /** defaulted to zero, not handled for now */
      nonce: 0,
      randomNumber: BigNumber.from(data.randomNumberProduced as string),
      usedSecret: BigNumber.from(data.revealedSecret as string),
      wasHashedSecretLegitimate: data.isProvable as boolean
    }

    //
  } catch (e) {
    popupTx.runState = getMeaningfulMessageFromError(e)
    popupTx.onFailed()
  } finally {
    if (updater(popupTxId, popupTx)) {
      popupTx.onFinally?.()
    }
  }
}

//
// Function to generate random number
const randomWithinRange = (min: number, max: number) => {
  return Math.random() * (max - min) + min
}
