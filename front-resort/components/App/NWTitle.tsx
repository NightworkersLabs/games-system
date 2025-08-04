import { Box, Flex, Text } from '@chakra-ui/react'
import MetaMaskOnboarding from '@metamask/onboarding'
import SocialBlade from './SocialBlade'

import pkg from 'package.json'
import DAppStateTracker from './DAppStateTracker'
import { useMemo } from 'react'

//
export default function NWTitle (props: {
    onboarding?: MetaMaskOnboarding,
    visibilityClass?: string,
    isPlaceholder?: boolean
}) {
  //
  const isProdEnv = useMemo(() => process.env.NEXT_PUBLIC_IS_PROD != null, [])

  //
  return (
    <Flex
      id={!props.isPlaceholder ? 'title' : 'title-placeholder'}
      visibility={props.isPlaceholder ? 'hidden' : 'visible'}
      pos={props.isPlaceholder ? 'initial' : 'absolute'}
      mt={props.isPlaceholder ? 'initial' : 2}
      display={{ lg: props.isPlaceholder && 'none' }}
      left={0}
      right={0}
      className={props.visibilityClass}
      direction='column'
      alignItems='center'
      zIndex={10}
      gap='1'
    >
      <NWNakedTitle />
      <SocialBlade hideToolboxButton={isProdEnv}/>
      { !props.isPlaceholder &&
                <DAppStateTracker
                  onboarding={props.onboarding}
                  visibilityClass={props.visibilityClass}
                />
      }
    </Flex>
  )
}

export function NWVersion () {
  return (
    <Text
      fontSize={10}
      position='relative'
      textAlign='center'
    >v{pkg.version}</Text>
  )
}

export function NWNakedTitle () {
  //
  return (
    <Flex
      direction='column'
      fontSize={{ base: '2xl', md: '3xl' }}
      position='relative'
      justifyContent='center'
      alignItems='center'
    >
      <NWNakedTitleContent />
    </Flex>
  )
}

//
function BasicTitle (props: {
    isVertical?: boolean
}) {
  return (
    <Flex direction='column'>
      <NWVersion />
      <Flex
        userSelect='none'
        className={'norowgap pixelFont'}
        textAlign='center'
        justifyContent='center'
        alignItems='center'
        flexWrap='wrap'
        gap={5}
        fontSize={props.isVertical ? '1rem' : null}
        direction={props.isVertical ? 'column' : null}
      >
        <Box as='span' className="text-glow">NIGHT</Box>
        <Box as='span' className="text-glow-purple">WORKERS</Box>
      </Flex>
    </Flex>
  )
}

function NWNakedTitleContent () {
  //
  const isntProdEnv = useMemo(() => process.env.NEXT_PUBLIC_IS_PROD == null, [])

  //
  return (
    <>
      <BasicTitle />
      <Flex
        fontSize='.5em'
        direction='column'
        className={'norowgap pixelFont text-glow'}
        flex='1'
        justifyContent='center'
        alignItems='center'
        textAlign='center'
        color='#f5e957'
        flexWrap='wrap'
      >
        <Text /** letterSpacing='1.5em' css={{ textIndent: '1.5em' }} */>CASINO / NFT / P2E</Text>
        {isntProdEnv && <Text mt='.5em' fontSize='.5rem' color='#d3ffa3'>PREVIEW</Text>}
      </Flex>
    </>
  )
}
