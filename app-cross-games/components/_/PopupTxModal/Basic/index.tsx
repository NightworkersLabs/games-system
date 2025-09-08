import { Flex, Modal, ModalBody, ModalCloseButton, ModalContent, ModalHeader, ModalOverlay } from '@chakra-ui/react'
import { useNWStore } from 'lib/store/main'
import { AnyBasicPopupTx, BasicPopupTxWaitingStep, isTwoStepsPopupTx } from 'lib/store/slices/popup-tx/handler'
import { useMemo } from 'react'
import StepsLifecycleDisplayer from '../StepsLifecycleDisplayer'

//
export default function BasicPopupTxModal (props: {
    popupTx: AnyBasicPopupTx
}) {
  //
  const minimizePopupTx = useNWStore(s => s.minimizePopupTx)

  //
  const isTSTx = useMemo(() =>
    isTwoStepsPopupTx(props.popupTx)
  , [props.popupTx])

  //
  const stepDescr = useMemo(() => [
    ...(isTSTx
      ? [
        { step: BasicPopupTxWaitingStep.ApprovalLocal, descr: 'Waiting for approval...' },
        { step: BasicPopupTxWaitingStep.ApprovalBlockchain, descr: 'Waiting for approval blockchain validation...' }
      ]
      : []),
    { step: BasicPopupTxWaitingStep.Local, descr: 'Waiting on transaction...' },
    { step: BasicPopupTxWaitingStep.Blockchain, descr: 'Waiting blockchain validation...' },
    { step: BasicPopupTxWaitingStep.Done, descr: 'Transaction Handled !' }
  ], [isTSTx])

  //
  return (
    <Modal isCentered isOpen onClose={minimizePopupTx}>
      <ModalOverlay />
      <ModalContent bg="purple.600" className="pinkBorder">
        <ModalHeader className="pixelFont">
          <Flex>Basic Tx.</Flex>
          <Flex fontSize='.5rem'>{props.popupTx.description}</Flex>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {<Flex flexDir="column" width="100%" fontSize='.75rem' mb='1rem'>
            <StepsLifecycleDisplayer
              isProvableStepNext={false}
              nextStep={minimizePopupTx}
              runState={props.popupTx.runState}
              stepState={props.popupTx.stepState}
              steps={stepDescr}
            />
          </Flex>}
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}
