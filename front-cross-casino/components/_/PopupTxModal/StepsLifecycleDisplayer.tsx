import { Flex, Spinner, Text } from '@chakra-ui/react'
import { APISecurePopupTxWaitingStep, BasicPopupTxWaitingStep, OnChainSecurePopupTxWaitingStep } from 'lib/store/slices/popup-tx/handler'

import { WarningIcon, CheckIcon } from '@chakra-ui/icons'
import { NextStepLayout } from './Secure'
import { useCallback, useMemo } from 'react'
import { SEPRunState } from 'lib/SingleExecPromise'

//
export type StepState = 'Waiting' | 'Handling' | 'Handled' | 'Error'

//
function colorByStepState (state: StepState) : string {
  switch (state) {
  case 'Error':
    return '#ff9292' // red
  case 'Waiting':
    return 'gray'
  case 'Handled':
    return '#3cf33c' // green
  case 'Handling':
    return 'white'
  }
}

//
function StepIcon (props: { state: StepState, color: string }) {
  return (props.state === 'Handling' && <Spinner size='xs' mr='1' />) ||
    (props.state === 'Error' && <WarningIcon mr='1' color={props.color} />) ||
    (props.state === 'Handled' && <CheckIcon mr='1' color={props.color} />) ||
    <></>
}

type AnyPopupTxStep = OnChainSecurePopupTxWaitingStep | APISecurePopupTxWaitingStep | BasicPopupTxWaitingStep

export interface PopupTxStep<T = AnyPopupTxStep> {
    step: T
    descr: string
}

//
export default function StepsLifecycleDisplayer <T = AnyPopupTxStep> (props: {
    /** callback to call when last step reached finished */
    nextStep: () => void,
    /** popup tx run state to monitor */
    runState: SEPRunState,
    /** popup tx current step state to monitor */
    stepState: T
    /** whenever popup tx has a provable step */
    isProvableStepNext: boolean,
    /** steps configuration */
    steps: PopupTxStep<T>[]
}) {
  const lastStep = useMemo(() => props.steps[props.steps.length - 1].step, [props.steps])

  //
  const stepState = useCallback((step: T) : StepState => {
    if (step < props.stepState) return 'Handled'

    //
    else if (step === props.stepState) {
      if (typeof props.runState === 'string') return 'Error'
      else if (props.stepState === lastStep) return 'Handled'
      return 'Handling'
    }

    //
    return 'Waiting'
  }, [lastStep, props.runState, props.stepState])

  //
  return (
    <Flex direction='column'>
      {props.steps.map(({ step, descr }, i) => {
        //
        const state = stepState(step)
        const color = colorByStepState(state)

        //
        return (
          <Flex direction='column' key={i}>
            <Flex alignItems='center'>
              <StepIcon state={state} color={color}/>
              <Text color={color}>{descr}</Text>
            </Flex>
            {props.stepState === step && typeof props.runState === 'string' &&
                            (<Text p='1' color={color}>{'- ' + props.runState}</Text>)
            }
          </Flex>
        )
      })}
      {props.stepState === lastStep &&
                <NextStepLayout nextDescr={props.isProvableStepNext ? 'Check ?' : 'OK !'} nextStep={props.nextStep} />
      }
    </Flex>
  )
}
