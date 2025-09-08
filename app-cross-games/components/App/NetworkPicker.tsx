import { Flex, Image, Link, Text } from '@chakra-ui/react'
import { AvailableNetwork } from 'env/networksCompiler'
import { useNWStore } from 'lib/store/main'

import { ExtraCompiledNetwork, handledNetworks } from 'lib/TypedNetworks'
import { useEffect, useMemo, useRef } from 'react'

export default function NetworkPicker () {
  //
  const myRef = useRef<HTMLDivElement>(null)

  //
  useEffect(() => {
    if (myRef.current) {
      const { scrollWidth, clientWidth } = myRef.current
      if (scrollWidth > clientWidth) {
        myRef.current.scrollTo({ behavior: 'auto', left: (scrollWidth - clientWidth) / 2 })
      }
    }
  }, [])

  //
  return <Flex
    direction='column' alignItems='center' justifyContent='center'
    mt='5' gap='1rem' py='5'
    backgroundColor='#000C'
  >
    <Text className='pixelFont' fontSize='xs'>Pick your network</Text>
    <Flex w='100vw' position='relative' justifyContent='center'>
      <Flex
        pointerEvents='none'
        w='100%' h='100%' position='absolute' flex='1' background='linear-gradient(90deg, #000 0%, #0000 10%, #0000 90%, #000 100%)'
        zIndex='1'
      />
      <Flex ref={myRef} overflowX='auto' pb='1rem' __css={{ scrollbarWidth: 'thin' }}>
        <Flex alignItems='center'>
          {Object.entries(handledNetworks).map(([name, network]) =>
            <NetworkButton key={name} network={network} />
          )}
        </Flex>
      </Flex>
    </Flex>
    <Text fontSize='.6rem'>It will be saved until you close this window.</Text>
  </Flex>
}

//
function NetworkButton (props: {
  network: ExtraCompiledNetwork
}) {
  //
  const connectToPreferredNetwork = useNWStore(s => s.connectToPreferredNetwork)

  //
  return (
    <Link
      backgroundColor='transparent'
      onClick={() => connectToPreferredNetwork((props.network.name as AvailableNetwork))}
    >
      <NetworkTag network={props.network} />
    </Link>
  )
}

//
export function NetworkTag (props: {
  network: ExtraCompiledNetwork
}) {
  //
  const subtext = useMemo(() => {
    if ('faucet' in props.network) {
      return 'test'
    } else if ('debugNetwork' in props.network) {
      return 'dev'
    } else {
      return null
    }
  }, [props.network])

  //
  return (
    <Flex
      flexGrow='0'
      borderRadius='5px'
      backgroundColor={props.network.subcolor}
      minW='5rem'
      maxH='5rem'
      color='white'
      flexWrap='nowrap'
      gap='1' position='relative' p='2' direction='column' alignItems='center' justifyContent='center'
    >
      { subtext &&
        <Text
          lineHeight='2'
          position='absolute' right='.25rem' top='.2rem' borderRadius='3px' fontSize='.4rem' py='1px' px='3px' color='black' backgroundColor='white'
        >{subtext}</Text>
      }
      <Image
        __css={{ imageRendering: 'initial' }}
        h='2rem'
        alt={props.network.name}
        src={props.network.logo}
        whiteSpace='pre-wrap'
      />
      <Flex alignItems='center' gap='.25rem'>
        <Text lineHeight='1.2' whiteSpace='nowrap' textAlign='center' fontSize='.6rem'>{props.network.networkName}</Text>
      </Flex>
    </Flex>
  )
}

export function MiniNetworkTag (props: {
  network: ExtraCompiledNetwork
}) {
  //
  return (
    <Flex
      minW='6rem'
      maxWidth='fit-content'
      borderRadius='5px'
      backgroundColor={props.network.subcolor}
      color='white'
      gap='1' position='relative' p='2' px='3' alignItems='center' justifyContent='center'
    >
      <Image
        __css={{ imageRendering: 'initial' }}
        h='1rem'
        alt={props.network.name}
        src={props.network.logo}
        whiteSpace='pre-wrap'
      />
      <Flex alignItems='center' gap='.25rem'>
        <Text textAlign='center' fontSize='.6rem'>{props.network.networkName}</Text>
      </Flex>
    </Flex>
  )
}
