import { Box, Flex, Image, Text, Link, Divider, VStack, HStack } from '@chakra-ui/react'

import ProgressBar from './ProgressBar'

import { useNWStore } from 'lib/store/main'
import { getNWERC721Address } from 'env/defaults'
import MintPrice from './MintPrice'
import { HUDButton } from 'components/App/HUD'
import { faFileContract, faStamp } from '@fortawesome/free-solid-svg-icons'
import MintButton from './MintButton'
import AutoUpdateTracker from 'components/_/AutoUpdateTracker'
import shallow from 'zustand/shallow'
import ContractTitle from 'components/_/ContractTitle'
import { useMemo } from 'react'

//
export default function Mint () {
  //
  const {
    updateUserMintingContext$,
    getContractExplorerUrl
  } = useNWStore(s => ({
    updateUserMintingContext$: s.updateUserMintingContext$,
    getContractExplorerUrl: s.getContractExplorerUrl
  }), shallow)

  //
  return (
    <Flex direction="column" p="4" gap={10}>
      <HStack justifyContent='space-around'>
        <Lifeline />
        <VStack>
          <HUDButton name='CONTRACT' icon={faFileContract} href={ getContractExplorerUrl(getNWERC721Address()) } />
          <NFTsDexPartners />
        </VStack>
      </HStack>
      <Flex direction='column' gap='2'>
        <ProgressBar />
        <AutoUpdateTracker periodicityInSecs={10} toCallPeriodically={updateUserMintingContext$} immediateCall={false}/>
      </Flex>
      <Flex flexWrap='wrap' p='2' flex={1} gap={5} justifyContent='space-evenly' alignItems='start'>
        <MintPrice />
        <MintButton />
      </Flex>
    </Flex>
  )
}

//
function NFTsDexPartners () {
  return (
    <Flex direction='column' flex={1} gap='3' justifyContent='center' alignItems='center' textAlign='center'>
      <Text>Buy<Box as='span' mx={1} fontSize='.7rem' className='pixelFont parteners-traded-good'>Night Workers</Box>from:</Text>
      <Flex gap={2} alignItems='center'>
        <Link href={ 'https://nftrade.com/assets/avalanche/' + getNWERC721Address() } isExternal >
          <Image alt='NFTrade' src="/resources/icons/nftrade_64.png" />
                    NFTrade
        </Link>
        <Link href={ 'https://marketplace.kalao.io/collection/' + getNWERC721Address() } isExternal >
          <Image alt='Kalao' src="/resources/icons/kalao_64.png" />
                    Kalao
        </Link>
      </Flex>
    </Flex>
  )
}

//
function Lifeline () {
  //
  const {
    whitelistLaunch,
    publicLaunch,
    mintingPaused
  } = useNWStore(s => ({
    whitelistLaunch: s.whitelistLaunch,
    publicLaunch: s.publicLaunch,
    mintingPaused: s.mintingPaused
  }), shallow)

  //
  const index = useMemo(() => {
    if (!whitelistLaunch && !publicLaunch) return 0
    if (whitelistLaunch) return 1
    return 2
  }, [publicLaunch, whitelistLaunch])

  //
  return (
    <VStack>
      <ContractTitle icon={faStamp} isPaused={mintingPaused} title='Mint' />
      <Flex className='pinkBorder' backgroundColor='#16161685' p='2' borderRadius="15px" direction='column' justifyContent='center' alignItems='center'>
        <Text fontSize='.75rem' className='pixelFont'>Status</Text>
        <Divider my='1' />
        <Flex flexWrap='wrap' justifyContent='center' alignItems='center' gap={2} px='5'>
          <Text color={index === 0 ? '#c11a1a' : 'inherit'} opacity={index !== 0 ? '.75' : '1'} fontWeight='bold'>CLOSED</Text>
          <Text fontSize='.5rem'>{'>'}</Text>
          <Text fontWeight={ index >= 1 ? 'bold' : ''} opacity={index !== 1 ? '.75' : '1'} color={ index === 1 ? '#d9ef5f' : 'inherit'}>WHITELIST</Text>
          <Text fontSize='.5rem'>{'>'}</Text>
          <Text fontWeight={ index >= 2 ? 'bold' : ''} opacity={index !== 2 ? '.75' : '1'} color={ index === 2 ? '#76fb76' : 'inherit'}>PUBLIC LAUNCH</Text>
        </Flex>
      </Flex>
    </VStack>
  )
}
