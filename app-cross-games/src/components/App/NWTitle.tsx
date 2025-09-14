import { useMemo } from 'react'

import { Box, Flex, Image, Link,Text } from '@chakra-ui/react'
import { faMultiply } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import DAppStateTracker from '#/src/components/App/DAppStateTracker'
import NetworkPicker from '#/src/components/App/NetworkPicker'
import SocialBlade from '#/src/components/App/SocialBlade'
import type { BacklinkReference } from '#/src/lib/Backlinking'
import { useNWStore } from '#/src/lib/store/main'
import { domainUrl } from '#/src/pages/_document'

//
const NWTitle = (props: {
    visibilityClass?: string,
    isPlaceholder?: boolean,
    doNetworkSelection?: boolean
}) => {
  //
  const isProdEnv = useMemo(() => process.env.NEXT_PUBLIC_BC_FILTER === 'mainnet', [])

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
      <SocialBlade hideToolboxButton={isProdEnv} />
      { !props.isPlaceholder && <>
        { !props.doNetworkSelection &&
          <DAppStateTracker visibilityClass={props.visibilityClass}/>
        }
        { props.doNetworkSelection && <NetworkPicker />}
      </>
      }
    </Flex>
  )
}

export const NWVersion = () => {
  const version = useMemo(() => process.env.NEXT_PUBLIC_VERSION, [])

  return (
    <Text
      fontSize={10}
      position='relative'
      textAlign='center'
    >v{version}</Text>
  )
}

export const NWNakedTitle = () => {
  //
  const currentBacklink = useNWStore(s => s.currentBacklink)

  //
  return (
    <Flex
      direction='column'
      fontSize={{ base: '2xl', md: '3xl' }}
      position='relative'
      justifyContent='center'
      alignItems='center'
    >
      {currentBacklink?.sponsorIsComprehensive
        ? <CollabTitle backlink={currentBacklink} />
        : <NWNakedTitleContent />
      }
    </Flex>
  )
}

//
const CollabTitle = (props: { backlink: BacklinkReference }) => {
  return (
    <Flex alignItems='center' gap='4'>
      <BasicTitle isVertical={true} />
      <FontAwesomeIcon icon={faMultiply} />
      <Flex position='relative'>
        {props.backlink.hyperlink == null
          ? <CollabImage backlink={props.backlink} />
          : <Link backgroundColor='transparent' isExternal href={props.backlink.hyperlink}>
            <CollabImage backlink={props.backlink}/>
          </Link>
        }
      </Flex>
    </Flex>
  )
}

//
export const getSponsorImageUrl = (backlink: BacklinkReference | {
  uniqueDashboardName: string,
  imgExt?: string
}, fullUrl?: true) => `${fullUrl ? domainUrl : '/'}sponsors/${backlink.uniqueDashboardName}.${backlink.imgExt ?? 'png'}`

//
export const CollabImage = (props: { backlink: BacklinkReference | {
  dashboardDescription: string,
  uniqueDashboardName: string,
  imgExt?: string
} }) => {
  return (
    <Image
      boxSize='64px'
      my='8px'
      filter='drop-shadow(0 0 0.25rem crimson)'
      alt={props.backlink.dashboardDescription}
      src={getSponsorImageUrl(props.backlink)}
      zIndex={11}
      whiteSpace='pre-wrap'
    />
  )
}

//
const BasicTitle = (props: {
    isVertical?: boolean
}) => {
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

export const NWNakedTitleContent = () => {
  //
  const isntProdEnv = useMemo(() => process.env.NEXT_PUBLIC_BC_FILTER !== 'mainnet', [])

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
        <Text letterSpacing='1.5em' css={{ textIndent: '1.5em' }}>CASINO</Text>
        {isntProdEnv && <Text mt='.5em' fontSize='.5em' color='#d3ffa3'>STAGING REALM</Text>}
      </Flex>
    </>
  )
}

export default NWTitle;