import { getMeaningfulMessageFromError } from 'lib/EthersErrorDigger'
import { SingleExecPromise } from 'lib/SingleExecPromise'
import { isTwoStepsPopupTx, BasicPopupTxWaitingStep, PopupTxInvokeParams, AnyBasicPopupTx } from '../handler'
import { Event } from 'ethers'

export const _runBasicPopupTx = async ({
  popupTxId,
  popupTx,
  updater
}: PopupTxInvokeParams<AnyBasicPopupTx>) => {
  //
  const mustApproveFirst = isTwoStepsPopupTx(popupTx)

  //
  try {
    //
    popupTx.runState = true
    popupTx.stepState = mustApproveFirst ? BasicPopupTxWaitingStep.ApprovalLocal : BasicPopupTxWaitingStep.Local
    if (!updater(popupTxId, popupTx)) return

    //
    if (mustApproveFirst) {
      // check how much is currently allowed
      const currentlyAllowed = await popupTx.allowanceCheck()

      //
      const mustAllowMore = currentlyAllowed.lt(popupTx.toAllow)

      // if needed, increase allowance
      if (mustAllowMore) {
        // compute how much is needed to reach what we want to allow
        const howMuchToIncrease = popupTx.toAllow.sub(currentlyAllowed)

        // ask for allowance increase
        const ct = await popupTx.increaseAllowanceFunc(howMuchToIncrease)

        // update state...
        popupTx.stepState = BasicPopupTxWaitingStep.ApprovalBlockchain
        if (!updater(popupTxId, popupTx)) return

        // wait for blockchain validation
        await ct.wait()
      }

      // update state...
      popupTx.stepState = BasicPopupTxWaitingStep.Local
      if (!updater(popupTxId, popupTx)) return
    }

    // run the proxied function to get the Tx
    const ct = await popupTx.txFunc()

    // update state...
    popupTx.stepState = BasicPopupTxWaitingStep.Blockchain
    if (!updater(popupTxId, popupTx)) return

    // now wait for the receipt
    const rcpt = await ct.wait()

    // try to get the event to return as trace
    let returnEv: Event = null
    if (popupTx.eventsFilterName) {
      returnEv = rcpt.events?.find(x => x.event === popupTx.eventsFilterName)
    }

    //
    if (popupTx.onSuccess instanceof SingleExecPromise) {
      popupTx.onSuccess.raise(returnEv)
    } else {
      popupTx.onSuccess?.(returnEv)
    }

    //
    popupTx.runState = false
    popupTx.stepState = BasicPopupTxWaitingStep.Done
    //
  } catch (e) {
    popupTx.runState = getMeaningfulMessageFromError(e)
  } finally {
    if (updater(popupTxId, popupTx)) {
      popupTx.onFinally?.()
    }
  }
}
