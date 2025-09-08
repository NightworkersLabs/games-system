import { useToast } from '@chakra-ui/react'
import { useEffect } from 'react'
import { useNWStore } from 'lib/store/main'

import shallow from 'zustand/shallow'

//
export default function MintedRobbedToast () {
  //
  const {
    latestMintResults,
    clearLatestMintResults
  } = useNWStore(s => ({
    latestMintResults: s.latestMintResults,
    clearLatestMintResults: s.clearLatestMintResults
  }), shallow)

  //
  const toast = useToast()

  //
  useEffect(() => {
    //
    if (latestMintResults == null) {
      return
    }

    //
    const wasRobbed = latestMintResults.stolenCount !== 0
    const ownedSome = latestMintResults.ownedCount !== 0

    //
    const getDescr = () => {
      if (!wasRobbed) {
        return `You successfully minted ${latestMintResults.ownedCount} Night worker(s), congratulations !`
      } else if (ownedSome) {
        return `You successfully minted ${latestMintResults.ownedCount} Night worker(s), but ${latestMintResults.stolenCount} Night worker(s) you minted were stolen by nasty Pimps :'(`
      } else {
        return `Bad luck, all the ${latestMintResults.stolenCount} Night worker(s) you tried to mint were stolen by nasty Pimps :'(`
      }
    }

    //
    toast({
      title: 'Mint Succeeded',
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
    clearLatestMintResults()
    //
  }, [clearLatestMintResults, latestMintResults, toast])

  //
  return (<></>)
}
