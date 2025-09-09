import { Button, Divider,Flex, Text } from '@chakra-ui/react'
import type { IconProp } from '@fortawesome/fontawesome-svg-core'
import { faCircleQuestion, faUserShield } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import AudioController from '#/components/App/HUD/AudioController'
import ProvablyFairChooser from '#/components/App/HUD/ProvablyFairChooser'
import SecureBotHealth from '#/components/App/HUD/SecureBotHealth'
import Wallet from '#/components/App/HUD/Wallet'
import { useNWStore } from '#/lib/store/main'

//
const HUD = (props: { visibilityClass: string }) => {
  //
  const dAppState = useNWStore(s => s.dAppState)

  //
  return (
    <Flex
      id='hud'
      flexFlow='row wrap'
      justifyContent={{ base: 'center', md: 'center', lg: 'space-between', xl: 'space-between' }}
      alignItems={{ base: 'center', md: 'center', lg: 'self-start', xl: 'self-start' }}
      minH='10rem'
      className={props.visibilityClass}
      p='5' gap='5'
      position='relative'
    >
      <Flex zIndex='99'>
        {dAppState === 'Ready' && <SecureBotStatus />}
      </Flex>
      <Flex zIndex='99'
        alignItems='center'
        justifyContent='center'
        flexWrap='wrap'
        direction={{ base: 'row-reverse', md: 'row-reverse', lg: 'column', xl: 'column' }}
        gap={{ base: 5, md: 5, lg: 2, xl: 2 }}
        position={{ base: 'initial', md: 'initial', lg: 'absolute', xl: 'absolute' }} right='1rem'
      >
        <AudioController />
        <Wallet isVisible={props.visibilityClass === 'ready'} />
      </Flex>
    </Flex>
  )
}

//
const SecureBotStatus = () => {
  return (
    <Flex
      border='1px'
      borderColor="#ed5af7"
      direction='column'
      alignItems='center'
      justifyContent='center'
      p='3'
      gap='2px'
      backgroundColor='blackAlpha.700'
    >
      <Flex alignItems='center' gap={2}>
        <FontAwesomeIcon icon={faUserShield}/>
        <Text fontSize='.75rem' fontWeight='bold'>SECURE BOT</Text>
      </Flex>
      <SecureBotHealth />
      <Divider my={1} />
      <Flex alignItems='center' gap={1} color='#DDD'>
        <Text fontSize='.6rem'>Provably Fair</Text><FontAwesomeIcon color='gray' fontSize='.7rem' icon={faCircleQuestion} />
      </Flex>
      <ProvablyFairChooser />
    </Flex>
  )
}

//
export const HUDButton = (props: { name: string, icon: IconProp, href: string }) => {
  return (
    <a href={props.href} target='_blank' rel="noreferrer">
      <Button
        leftIcon={<FontAwesomeIcon icon={props.icon} />}
        fontSize={'xs'}
        disabled={props.href == null}
      >{props.name}</Button>
    </a>
  )
}

export default HUD;