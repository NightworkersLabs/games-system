import {
  Flex,
  Text,
  VStack
} from '@chakra-ui/react'
import AutoUpdateTracker from 'components/_/AutoUpdateTracker'
import { useMemo } from 'react'

import { useNWStore } from 'lib/store/main'
import shallow from 'zustand/shallow'

import UnstakeButton from '../Buttons/Unstake'

import PutToWorkButton from '../Buttons/Stake'
import { NightworkersFrame } from './Framing'
import { faBed, faBicycle } from '@fortawesome/free-solid-svg-icons'

//
export default function NFTCollection () {
  //
  const {
    syncOwnedNFTs$,
    ownedNFTs,
    updatePimpsUnclaimedRevenue$
  } = useNWStore(s => ({
    ownedNFTs: s.ownedNFTs,
    syncOwnedNFTs$: s.syncOwnedNFTs$,
    updatePimpsUnclaimedRevenue$: s.updatePimpsUnclaimedRevenue$
  }), shallow)

  //
  const idleNFTs = useMemo(() =>
    Object.values(ownedNFTs).filter(nft => nft.stakingState === 'idle')
  , [ownedNFTs])

  //
  const stakedNFTs = useMemo(() =>
    Object.values(ownedNFTs).filter(nft => nft.stakingState === 'staked')
  , [ownedNFTs])

  const ownedNFTsCount = useMemo(() =>
    Object.keys(ownedNFTs).length
  , [ownedNFTs])

  //
  return (
    <Flex direction="column" p="5" py='10' alignItems='center'
      backgroundColor='#2e0444'
      boxShadow='inset 0px 20px 20px 0px #00000024'
    >
      <Flex direction='column' pt='1rem' pb='2rem'>
        <Text className='pixelFont' align="center" fontSize="2xl">MY CARTEL ({ownedNFTsCount})</Text>
        <AutoUpdateTracker periodicityInSecs={30} toCallPeriodically={syncOwnedNFTs$} immediateCall={false}/>
      </Flex>
      <Flex flexWrap='wrap' justifyContent='center' alignItems='center' gap='5'>
        <VStack backgroundColor='#2a2a2a87' boxShadow='0px 0px 10px #000000b3' pt='5'>
          <NightworkersFrame
            icon={faBicycle}
            groupName='WORKING'
            tokens={stakedNFTs}
            updateTracker={<AutoUpdateTracker periodicityInSecs={20} toCallPeriodically={updatePimpsUnclaimedRevenue$} />}
          />
          <UnstakeButton />
        </VStack>
        <VStack backgroundColor='#2a2a2a87' boxShadow='0px 0px 10px #000000b3' pt='5'>
          <NightworkersFrame icon={faBed} groupName='IDLE' tokens={idleNFTs} />
          <PutToWorkButton />
        </VStack>
      </Flex>
    </Flex>
  )
}
