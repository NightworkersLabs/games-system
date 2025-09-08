import { Flex, Spinner, Text, Tooltip } from '@chakra-ui/react'
import { faCheck, faCircleExclamation, faReceipt, faTrashCan } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useMemo } from 'react'
import { useNWStore } from 'lib/store/main'
import { AnyPopupTx, getPopupTxCurrentStep, isProvable, isSecurePopupTx } from 'lib/store/slices/popup-tx/handler'
import shallow from 'zustand/shallow'

export default function PopupTxModalTracker (props: {
    popupTx: AnyPopupTx
}) {
  //
  const {
    showPopupTx,
    clearPopupTx
  } = useNWStore(s => ({
    showPopupTx: s.showPopupTx,
    clearPopupTx: s.clearPopupTx
  }), shallow)

  // BUG
  const [currentStep, maxSteps] = useMemo(() =>
    getPopupTxCurrentStep(props.popupTx),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [props.popupTx, props.popupTx.stepState])

  //
  const hasFailed = useMemo(() =>
    typeof props.popupTx.runState === 'string',
  [props.popupTx.runState])

  //
  const hasCompleted = useMemo(() =>
    hasFailed === false && currentStep >= maxSteps
  , [hasFailed, maxSteps, currentStep])

  //
  const hasSteppedIn = useMemo(() => currentStep > 0, [currentStep])

  //
  const isSecure = useMemo(() => isSecurePopupTx(props.popupTx), [props.popupTx])

  //
  const descrText = useMemo(() => {
    if (hasFailed) return 'Failed :('
    if (hasCompleted) {
      if (isProvable(props.popupTx) &&
                props.popupTx.provableBotResponse
      ) return 'Check Fairness ?'
      return 'Done !'
    }
    if (props.popupTx.runState == null) {
      return 'Being set up...'
    }
    return 'Processing...'
  }, [hasCompleted, hasFailed, props.popupTx])

  //
  return (
    <Flex
      userSelect='none'
      zIndex='100'
      position='fixed'
      left='1.5rem'
      bottom='1.5rem'
      direction='column'
      className='rb'
      _hover={{ transform: 'scale(1.2)', cursor: 'pointer' }}
      onClick={showPopupTx}
    >
      <Flex
        borderTopRadius='10px'
        p='2'
        backgroundColor='#7e1e51'
        gap='3'
        alignItems='center'
        justifyContent='space-between'
      >
        <Tooltip placement="top" hasArrow label='Clear this transaction from cache ? (Cannot be undone)'>
          <Flex alignSelf='start' zIndex='101' onClick={clearPopupTx} color="#b9b9b98c" _hover={{
            color: 'white'
          }}>
            <FontAwesomeIcon size='xs' icon={faTrashCan} />
          </Flex>
        </Tooltip>
        <FontAwesomeIcon icon={faReceipt} />
        <Flex flex='1' direction='column'>
          <Text lineHeight='1' color='whiteAlpha.600' fontSize='.5rem'>{isSecure ? 'Secure TX' : 'Basic TX'}</Text>
          <Flex lineHeight='1.2' fontSize='.8rem'>{descrText}</Flex>
        </Flex>
        {
          (hasCompleted && <FontAwesomeIcon size='lg' color='#4ba34b' icon={faCheck}/>) ||
                    (hasFailed && <FontAwesomeIcon size='lg' color="#ff5a5a" icon={faCircleExclamation}/>) ||
                    (hasSteppedIn && <Spinner />)}
      </Flex>
      <PopupTxStepTracker
        currentStep={currentStep}
        maxSteps={maxSteps}
        hasFailed={hasFailed}
        hasCompleted={hasCompleted}
        hasSteppedIn={hasSteppedIn}
      />
    </Flex>
  )
}

function PopupTxStepTracker (props: {
    currentStep: number,
    maxSteps: number,
    hasFailed: boolean,
    hasCompleted: boolean,
    hasSteppedIn: boolean
}) {
  //
  return (
    <Flex
      borderBottomRadius='10px'
      px='2'
      py='1'
      backgroundColor='#cd66c236'
      gap='2'
      alignItems='center'
      flexWrap='nowrap'
    >
      <Flex className='tx-popup-step-tracker' minW='100px' flex='1' h='2px' gap='3px' backgroundColor={ props.hasCompleted ? '#4ba34b' : 'inherit'}>
        {props.hasCompleted === false && Array.from(Array(props.maxSteps).keys()).map(i => {
          //
          const buildStep = i + 1
          let backgroundColor = 'white'
          let mustBlink = false

          if (props.currentStep < buildStep) {
            backgroundColor = '#ffffff36'
          } else if (props.currentStep === buildStep) {
            mustBlink = !props.hasFailed
            if (props.hasFailed) {
              backgroundColor = 'red'
            }
          }

          //
          return <Flex
            key={i}
            flex='1'
            backgroundColor={backgroundColor}
            className={mustBlink ? 'blinking' : ''}
          />
        }

        )}
      </Flex>
      <Text fontSize='.6rem'>{
        props.hasSteppedIn
          ? props.currentStep
          : '...'
      } / {props.maxSteps}</Text>
    </Flex>
  )
}
