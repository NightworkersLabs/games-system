import type { Event } from 'ethers'

import { getMeaningfulMessageFromError } from '#/src/lib/EthersErrorDigger'
import { SingleExecPromise } from '#/src/lib/SingleExecPromise'
import type { TrustfulBotResponse } from '#/src/lib/store/slices/_/trustful'
import type {
  AnyOnChainSecurePopupTx,
  EndToEndOnChainSecurePopupTx,
  SecurePopupTxInvokeParams} from '#/src/lib/store/slices/popup-tx/handler';
import {
  isOCEtEPopupTx,
  OnChainSecurePopupTxWaitingStep} from '#/src/lib/store/slices/popup-tx/handler'

//
export const runOnChainSecurePopupTx = async ({
  popupTxId,
  popupTx,
  updater,
  balanceRefresher,
  modalMinimizer
}: SecurePopupTxInvokeParams<AnyOnChainSecurePopupTx>) => {
  //
  try {
    //
    popupTx.runState = true
    popupTx.stepState = OnChainSecurePopupTxWaitingStep.Local
    const isEtE = isOCEtEPopupTx(popupTx)

    //
    if (!updater(popupTxId, popupTx)) return

    // run the proxied function to get the Tx
    const ct = await popupTx.submit({
      seed: popupTx.wantedAsProvable && isEtE ? popupTx.clientSeed : null,
      secretHash: popupTx.wantedAsProvable && isEtE ? popupTx.pshPayload?.hash : null
    })

    //
    if (popupTx.mayMinimizeOnTxSent) {
      modalMinimizer()
    }

    //
    popupTx.stepState = OnChainSecurePopupTxWaitingStep.Blockchain
    if (!updater(popupTxId, popupTx)) return

    // now wait for the receipt
    const cr = await ct.wait()

    //
    popupTx.onOrdered?.(cr.events)

    //
    balanceRefresher()

    //
    const mayExecOnSuccess = (args?: Event) => {
      //
      if (popupTx.onSuccess instanceof SingleExecPromise) {
        popupTx.onSuccess.raise(args)
      } else {
        popupTx.onSuccess?.(args)
      }
    }

    // whenever it is an end-to-end popupTx execution
    if (isEtE) {
      // get Trustful event to extract order nonce
      const stEv = cr.events?.find(x => x.event === 'RandomNumberOrdered')
      if (stEv === undefined) {
        throw new Error('No Trustful event found in initial transaction receipt. Please contract the developpers.')
      }
      const nonce = stEv?.args?.nonce as number

      //
      popupTx.stepState = OnChainSecurePopupTxWaitingStep.ValidationBot

      //
      if (!updater(popupTxId, popupTx)) return

      // wait for both provable event data AND order event data
      const [provableBotResponse, orderResponse] = await Promise.all([
        _getBotProvableResponse(popupTx, nonce),
        ...[popupTx.onSuccess ? _getBotOrderResponse(popupTx, nonce) : null]
      ])

      //
      popupTx.provableBotResponse = provableBotResponse

      //
      mayExecOnSuccess(orderResponse)
      //
    } else {
      //
      mayExecOnSuccess()
    }

    //
    popupTx.runState = false
    popupTx.stepState = OnChainSecurePopupTxWaitingStep.Done

    //
  } catch (e) {
    popupTx.runState = getMeaningfulMessageFromError(e)
  } finally {
    if (updater(popupTxId, popupTx)) {
      popupTx.onFinally?.()
    }
  }
}

// wait for the provable part of bot response to an order
const _getBotProvableResponse = async (conf: EndToEndOnChainSecurePopupTx, nonce: number) => {
  //
  const filter = conf.contractToListen.filters.RandomNumberGenerated(conf.purposeId, nonce)

  //
  return new Promise<TrustfulBotResponse>(resolve => {
    // wait for a single triggering of said filtered event
    conf.contractToListen.once(filter, (...rawArgs) => {
      // full event object is last arg
      const ev = (rawArgs[rawArgs.length - 1] as Event)

      // decouple...
      const {
        wasHashedSecretLegitimate,
        randomNumber,
        usedSecret,
        nonce
      } = ev.args

      // resolve !
      resolve({
        wasHashedSecretLegitimate,
        randomNumber,
        usedSecret,
        nonce
      })
    })
  })
}

/** wait for the context-related data of bot response to an order */
 
const _getBotOrderResponse = async (conf: EndToEndOnChainSecurePopupTx, nonce: number) => {
  const filter = conf.eventsFilter(conf.contractToListen, nonce)
  return new Promise<Event>(resolve => {
    conf.contractToListen.once(filter, (...args) => {
      resolve(args[args.length - 1])
    })
  })
}
