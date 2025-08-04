import { Button, Text } from '@chakra-ui/react'
import { faAnglesUp } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useMemo } from 'react'
import { useNWStore } from 'lib/store/main'

import shallow from 'zustand/shallow'

//
export default function PutToWorkButton () {
  //
  const {
    ownedNFTs,
    maximumEmployableAtOnce,
    putManyToWork
  } = useNWStore(s => ({
    ownedNFTs: s.ownedNFTs,
    maximumEmployableAtOnce: s.maximumEmployableAtOnce,
    putManyToWork: s.putManyToWork
  }), shallow)

  //
  const selectedIdleCount = useMemo(() =>
    Object.values(ownedNFTs).reduce((prev, curr) =>
      curr.stakingState === 'idle' && curr.selectionState === 'selected'
        ? prev + 1
        : prev,
    0), [ownedNFTs])

  //
  return (
    <Button
      w='100%'
      mx="auto"
      mt="2"
      borderRadius="none"
      bgColor={'#ed5af7'}
      _hover={{ bgColor: '#ed5af7', color: 'purple.700' }}
      _active={{ bgColor: '#ed5af7' }}
      onClick={putManyToWork}
      isDisabled={selectedIdleCount === 0}
      gap='3'
    >
      <FontAwesomeIcon size='lg' icon={faAnglesUp} />
      <Text>SEND TO THE STREET ({selectedIdleCount}/{maximumEmployableAtOnce})</Text>
    </Button>
  )
}
