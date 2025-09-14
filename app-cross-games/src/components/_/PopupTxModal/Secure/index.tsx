import { Step, Steps, useSteps } from 'chakra-ui-steps'
import { useEffect, useMemo } from 'react'
import shallow from 'zustand/shallow'

import { Button, Flex, Modal, ModalBody, ModalCloseButton, ModalContent, ModalHeader, ModalOverlay } from '@chakra-ui/react'

import FairnessChecker from '#/src/components/_/PopupTxModal/Secure/FairnessChecker'
import SecurePopupTxDescriptor from '#/src/components/_/PopupTxModal/Secure/SecureTxDescriptor'
import SeedPicker from '#/src/components/_/PopupTxModal/Secure/SeedPicker'
import ServerHashFetcher from '#/src/components/_/PopupTxModal/Secure/ServerHashFetcher'
import type { PopupTxStep } from '#/src/components/_/PopupTxModal/StepsLifecycleDisplayer';
import StepsLifecycleDisplayer from '#/src/components/_/PopupTxModal/StepsLifecycleDisplayer'
import { useNWStore } from '#/src/lib/store/main'
import { PerishableSecretHash } from '#/src/lib/store/slices/_/trustful'
import type {
  AnyOnChainSecurePopupTx,
  AnySecurePopupTx} from '#/src/lib/store/slices/popup-tx/handler';
import {
  APISecurePopupTxWaitingStep,
  isApiSecurePopupTx,
  isOCEtEPopupTx,
  isProvable,
  OnChainSecurePopupTxWaitingStep
} from '#/src/lib/store/slices/popup-tx/handler'

//
const getOnChainSubSteps = (popupTx: AnyOnChainSecurePopupTx) : PopupTxStep<OnChainSecurePopupTxWaitingStep>[] => [
  { step: OnChainSecurePopupTxWaitingStep.Local, descr: 'Requesting order...' },
  { step: OnChainSecurePopupTxWaitingStep.Blockchain, descr: 'Waiting blockchain validation...' },
  ...(isOCEtEPopupTx(popupTx) ? [{ step: OnChainSecurePopupTxWaitingStep.ValidationBot, descr: 'Waiting Bot handling of order...' }] : []),
  { step: OnChainSecurePopupTxWaitingStep.Done, descr: ' Handled !' }
]

//
const getAPISubSteps = () : PopupTxStep<APISecurePopupTxWaitingStep>[] => [
  { step: APISecurePopupTxWaitingStep.Requested, descr: 'Submitting...' },
  { step: APISecurePopupTxWaitingStep.Responded, descr: ' Response received !' }
]

//
const SecurePopupTxModal = (props: {
    popupTx: AnySecurePopupTx
}) => {
  //
  const minimizePopupTx = useNWStore(s => s.minimizePopupTx)

  //
  return (
    <Modal isCentered isOpen onClose={minimizePopupTx}>
      <ModalOverlay />
      <ModalContent bg="purple.600" className="pinkBorder">
        <ModalHeader className="pixelFont">
          <Flex>Secure Transaction</Flex>
          <Flex fontSize='.5rem'>{props.popupTx.description}</Flex>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <SecurePopupTxSteps
            popupTx={props.popupTx}
            modalDiscarder={minimizePopupTx}
          />
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}

//
const SecurePopupTxSteps = (props : {
    popupTx: AnySecurePopupTx,
    modalDiscarder: () => void
}) => {
  //
  const {
    currentPopupTxID,
    requestServerSecret,
    runSecurePopupTx
  } = useNWStore(s => ({
    currentPopupTxID: s.currentPopupTxID,
    requestServerSecret: s.requestServerSecret,
    runSecurePopupTx: s.runSecurePopupTx
  }), shallow)

  //
  const willBeProvable = useMemo(() => isProvable(props.popupTx), [props.popupTx])

  //
  const mustSkipPFDescr = useMemo(() => sessionStorage.getItem('skipPFDescr') != null, [])

  //
  const computedCurrentStep = useMemo(() => {
    //
    if (isProvable(props.popupTx) && props.popupTx.provableBotResponse) {
      return props.popupTx.wantedAsProvable ? 4 : 2
    }

    //
    if (props.popupTx.runState != null) {
      return props.popupTx.wantedAsProvable ? 3 : 1
    }

    //
    if (props.popupTx.wantedAsProvable) {
      if (props.popupTx.pshPayload) {
        return 2
      }
      if (props.popupTx.clientSeed) {
        return 1
      }
    }

    //
    return mustSkipPFDescr ? 1 : 0
    //
  }, [mustSkipPFDescr, props.popupTx])

  //
  const { nextStep, activeStep } = useSteps({
    initialStep: computedCurrentStep
  })

  //
  const subSteps = useMemo(() =>
    isApiSecurePopupTx(props.popupTx)
      ? getAPISubSteps()
      : getOnChainSubSteps(props.popupTx),
  [props.popupTx])

  //
  const steps = useMemo(() => [
    {
      label: 'Description',
      content: <SecurePopupTxDescriptor
        willBeProvable={willBeProvable}
        description={props.popupTx.description}
        nextStep={nextStep}
        usesProvablyFairness={props.popupTx.wantedAsProvable} />
    },
    ...(props.popupTx.wantedAsProvable
      ? [
        { label: 'Secure Tx (client-side)', content: <SeedPicker popupTx={props.popupTx} nextStep={nextStep} /> },
        { label: 'Secure Tx (server-side)', content: <ServerHashFetcher popupTx={props.popupTx} nextStep={nextStep} /> }
      ]
      : []),
    {
      label: 'Pass Order',
      content: <StepsLifecycleDisplayer
        nextStep={willBeProvable ? nextStep : props.modalDiscarder}
        runState={props.popupTx.runState}
        stepState={props.popupTx.stepState}
        isProvableStepNext={willBeProvable}
        steps={subSteps}
      />
    }
  ], [nextStep, props.modalDiscarder, props.popupTx, subSteps, willBeProvable])

  //
  const mightExecuteTx = useMemo(() =>
    (props.popupTx.wantedAsProvable === true && activeStep === 3) ||
    (props.popupTx.wantedAsProvable === false && activeStep === 1)
   
  , [activeStep, props.popupTx.wantedAsProvable])

  //
  const mustRequestServerSecret = useMemo(() =>
    props.popupTx.wantedAsProvable === true &&
        activeStep === 2 &&
        !PerishableSecretHash.isValid(props.popupTx.pshPayload)
  , [activeStep, props.popupTx])

  //
  useEffect(() => {
    // if no need for execution, OR execution is already pending, skip
    if (!mightExecuteTx || props.popupTx.runState != null) return

    // run tx
    runSecurePopupTx(props.popupTx, currentPopupTxID)

  // @dev no need to listen to props.popupTx.runState
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mightExecuteTx])

  //
  useEffect(() => {
    //
    if (mustRequestServerSecret) {
      requestServerSecret(props.popupTx, currentPopupTxID)
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mustRequestServerSecret])

  //
  return (
    <Flex flexDir="column" width="100%" fontSize='.75rem'>
      <Steps responsive={false} activeStep={activeStep}>
        {steps.map(({ label, content }) => (
          <Step key={label}>
            <Flex py='5' direction='column'>
              {content}
            </Flex>
          </Step>
        ))}
      </Steps>
      {activeStep === steps.length &&
                isProvable(props.popupTx) &&
                props.popupTx.provableBotResponse &&
                <Flex mt='5'>
                  <FairnessChecker popupTx={props.popupTx} />
                </Flex>
      }
    </Flex>
  )
}

//
export const NextStepLayout = (props: { nextStep: () => void, nextDescr: string }) => {
  return (
    <Flex mt='5' width="100%" justify="flex-end">
      <NextStepButton nextStep={props.nextStep} nextDescr={props.nextDescr} />
    </Flex>
  )
}

//
export const NextStepButton = (props: { nextStep: () => void, nextDescr: string }) => {
  return (
    <Button size="sm" onClick={props.nextStep}>
      {props.nextDescr}
    </Button>
  )
}

export default SecurePopupTxModal;