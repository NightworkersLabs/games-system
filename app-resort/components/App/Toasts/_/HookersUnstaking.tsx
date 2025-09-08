import { useToast } from '@chakra-ui/react'
import { NWERC20_NAME } from 'env/defaults'
import { useEffect } from 'react'
import { useNWStore } from 'lib/store/main'
import { toCurrency } from 'lib/BigNumberFormatters'

import shallow from 'zustand/shallow'

//
export default function HookersUnstakingToast () {
  //
  const {
    lhur,
    clearHookersUnstakeResults
  } = useNWStore(s => ({
    lhur: s.latestHookersUnstakeResults,
    clearHookersUnstakeResults: s.clearHookersUnstakeResults
  }), shallow)

  //
  const toast = useToast()

  //
  useEffect(() => {
    //
    if (lhur == null) {
      return
    }

    //
    const wasRobbed = lhur.howManyStolen !== 0
    const ownedSome = !lhur.totalGiven.isZero()

    //
    const getDescr = () => {
      if (!wasRobbed) {
        return `... your ${lhur.howManyGiven} hooker(s) avoided being stolen, for a total of ${toCurrency(lhur.totalGiven)} ${NWERC20_NAME}. Congratulations !`
      } else if (ownedSome) {
        return `...but ${lhur.howManyStolen} of them ${lhur.howManyStolen > 1 ? 'were' : 'was'} robbed by nasty Pimps, losing ${toCurrency(lhur.totalStolen)} ${NWERC20_NAME} in the process. The ${lhur.howManyGiven} other(s) still managed to salvage ${toCurrency(lhur.totalGiven)} ${NWERC20_NAME}.`
      } else {
        return `...but nasty Pimps stole everything from your ${lhur.howManyStolen} hooker(s), for a total of ${toCurrency(lhur.totalStolen)} ${NWERC20_NAME} :'(`
      }
    }

    //
    toast({
      title: 'Hooker(s) successfully unstaked',
      description: getDescr(),
      status: !wasRobbed
        ? 'success'
        : (
          ownedSome ? 'warning' : 'error'
        ),
      isClosable: true,
      duration: null,
      position: 'bottom'
    })

    //
    clearHookersUnstakeResults()
    //
  }, [clearHookersUnstakeResults, toast, lhur])

  //
  return (<></>)
}
