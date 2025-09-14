import { motion, useAnimation } from 'framer-motion'
import { useCallback, useEffect, useState } from 'react'

import { Flex, Spinner } from '@chakra-ui/react'

import { CircleIcon } from '#/src/components/App/HUD/SecureBotHealth'
import { delay } from '#/src/lib/MonitoredPromise'
import type { SingleExecPromise } from '#/src/lib/SingleExecPromise'

/** */
const AutoUpdateTracker = (props: {
    /** callback wrapper which will be called on a precise timed schedule */
    toCallPeriodically: SingleExecPromise
    /** period in seconds before the SingleExecPromise will be called automatically */
    periodicityInSecs?: number
    /** if must call at mount 'toCallPeriodically' */
    immediateCall?: boolean
}) => {
  //
  const controls = useAnimation()

  //
  const [waitComplete, setWaitComplete] = useState(props.immediateCall)

  //
  const restart = useCallback(() => {
    controls.set('zero')
    controls.start('completed')
  }, [controls])

  //
  const raiseAndRestart = useCallback(() => {
    // https://juliangaramendy.dev/blog/use-promise-subscription
    let isSubscribed = true

    //
    Promise.allSettled([
      //
      props.toCallPeriodically
        .raiseAndWait()
        .catch(),
      // add time spacer to prevent spamming
      delay(1_000)
    ])
      .then(() => {
        //
        if (isSubscribed === false) return

        //
        restart()

        //
        setWaitComplete(false)
      })

    //
    return () => {
      isSubscribed = false
    }
    //
  }, [props.toCallPeriodically, restart])

  //
  useEffect(() => {
    if (props.immediateCall) return
    restart()
  }, [props.immediateCall, restart])

  //
  useEffect(() => {
    if (!waitComplete) return
    return raiseAndRestart()
  }, [raiseAndRestart, waitComplete])

  //
  return (
    <Flex flex='1' align='center' gap='1px' position='relative' top='-1px'>
      {waitComplete
        ? <Spinner mr='2px' w='4px' h='4px'/>
        : <CircleIcon w='4px' h='4px' mr='2px' color='white'/>
      }
      <motion.div
        animate={controls}
        initial='zero'
        variants={{
          zero: { width: '0%' },
          completed: { width: '100%' }
        }}
        style={{ backgroundColor: 'gray', height: '1px' }}
        transition={{ duration: props.periodicityInSecs, ease: 'linear' }}
        onAnimationComplete={() => setWaitComplete(true)}
      />
    </Flex>
  )
}

AutoUpdateTracker.defaultProps = {
  periodicityInSecs: 20,
  immediateCall: true
}

export default AutoUpdateTracker;