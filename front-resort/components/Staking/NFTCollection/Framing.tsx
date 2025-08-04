import {
  Flex,
  Text,
  SimpleGrid,
  Image,
  VStack,
  Tooltip
} from '@chakra-ui/react'
import { useMemo } from 'react'

import { useNWStore } from 'lib/store/main'
import { OwnedNFT } from 'lib/store/slices/stake/nft-collection'

import SVG from 'react-inlinesvg' // import plugin
import { EstimatedHookerRevenue, EstimatedPimpRevenue, UnstakingTimer } from './Descriptors'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { IconProp } from '@fortawesome/fontawesome-svg-core'
import { faBan } from '@fortawesome/free-solid-svg-icons'
import { motion } from 'framer-motion'

//
export function NightworkersFrame (props : {
    groupName: string,
    icon: IconProp,
    tokens: OwnedNFT[],
    updateTracker?: any
}) {
  //
  return (
    <Flex direction='column' justifyContent='center' alignItems='center'>
      <Flex direction='column' className='pixelFont' mb='2'>
        <Flex gap='3'>
          <FontAwesomeIcon size='lg' icon={props.icon} />
          <Text fontSize="xl">{props.groupName} ({props.tokens.length})</Text>
        </Flex>
        {props.updateTracker}
      </Flex>
      {(props.tokens.length === 0 && <NoNightWorkersPlaceholder />) ||
                <SimpleGrid
                  p='4'
                  columns={{ base: 1, md: 3, lg: 5 }}
                  spacingY="1"
                  spacingX="1"
                >
                  {props.tokens.map((token, id) =>
                    <NightWorkerSelectable key={id} token={token} />
                  )}
                </SimpleGrid>
      }
    </Flex>
  )
}

//
function getPimpTitleByNotorietyScore (score?: number) {
  if (score === 5) return '+0 (Normal)'
  else if (score === 6) return '+1 (Unusual)'
  else if (score === 7) return '+2 (Marvelous)'
  else if (score === 8) return '+3 (Extraordinary)'
  return '+?? (???)'
}

//
export function NightWorkerSelectable (props: {
    token: OwnedNFT
}) {
  //
  const mayToggleTokenSelection = useNWStore(s => s.mayToggleTokenSelection)

  //
  const isSelected = useMemo(() => props.token.selectionState === 'selected', [props.token.selectionState])

  //
  const isMutating = useMemo(() => props.token.selectionState === 'mutating', [props.token.selectionState])

  //
  return (
    <Tooltip placement='top' hasArrow label={isMutating ? 'On the move, please wait...' : ''}>
      <Flex
        direction="column"
        w="36"
        mx="auto"
        _hover={{ cursor: 'pointer', backgroundColor: '#0000005e' }}
        transition='.2s background-color ease-in-out'
        border={isSelected ? '2px' : '0'}
        borderRadius='10px'
        bgColor={isSelected ? '#9c66a359' : 'inherit'}
        py='2'
        px='2'
        borderColor={isSelected ? 'pink' : 'none'}
        onClick={() => mayToggleTokenSelection(props.token.tokenId)}
        gap='1'
      >
        <Flex justifyContent='center' alignItems='center' mb='1'>
          { isMutating && <FontAwesomeIcon size='xs' icon={faBan} /> }
          <Flex direction='column' align="center" px="2">
            <Text className='pixelFont' fontSize=".65rem">{props.token.name ?? 'UNKNOWN'}</Text>
            {props.token.nScore &&
                            <Text className='pixelFont' fontSize=".4rem">{getPimpTitleByNotorietyScore(props.token.nScore)}</Text>
            }
          </Flex>
        </Flex>
        <NightWorkersPortrait
          isPimp={!props.token.isHooker}
          image_url={props.token.image_url}
          isGray={isMutating}
        />
        { props.token.stakingState === 'staked' &&
                    <Flex direction='column' gap='1'>
                      { props.token.isHooker
                        ? <EstimatedHookerRevenue nft={props.token} />
                        : <EstimatedPimpRevenue nft={props.token} />
                      }
                      <UnstakingTimer nft={props.token}/>
                    </Flex>
        }
      </Flex>
    </Tooltip>
  )
}

//
function NightWorkersPortrait (props: {
    image_url: string,
    isPimp: boolean,
    isGray: boolean
}) {
  //
  return (
    <motion.div
      style={props.isPimp
        ? {
          scale: 1.0,
          boxShadow: '0 0 5px 0px #91892c'
        }
        : null
      }
      animate={props.isPimp
        ? {
          scale: 1.02,
          boxShadow: '0 0 10px 0px #91892c'
        }
        : null
      }
      transition={{ ease: 'easeInOut', duration: 2, repeat: Infinity, repeatType: 'reverse' }}
    >
      <Flex filter={props.isGray ? 'grayscale(1)' : null}>
        {(props.image_url &&
                    <SVG loader={<LoadingNightWorker />} style={{ pointerEvents: 'none' }} src={props.image_url}></SVG>
        ) || <LoadingNightWorker />
        }
      </Flex>
    </motion.div>
  )
}

//
function LoadingNightWorker () {
  return <Image alt='Unknown Nightworker' src='/resources/staking/unknown_nw.png' />
}

//
function NoNightWorkersPlaceholder () {
  return (
    <VStack
      my='5'
      p='3'
      justifyContent='center'
      className='pinkBorder'
      alignItems='center'
      borderRadius='5px'
      backgroundColor='#ff74ea7a'
      boxShadow='0px 0px 14px 1px #cd6666'
    >
      <Text>None Yet !</Text>
      <Text fontSize='.5rem'>Bring some Nightworkers in {':)'}</Text>
    </VStack>
  )
}
