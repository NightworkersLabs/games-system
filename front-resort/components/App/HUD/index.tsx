import { Flex, Button, Text, Divider } from '@chakra-ui/react'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircleQuestion, faRulerVertical, faUserShield } from '@fortawesome/free-solid-svg-icons'

import Wallet from 'components/App/HUD/Wallet'
import AudioController from 'components/App/HUD/AudioController'
import SecureBotHealth from './SecureBotHealth'
import ProvablyFairChooser from './ProvablyFairChooser'
import { useNWStore } from 'lib/store/main'
import { IconProp } from '@fortawesome/fontawesome-svg-core'

//
export default function HUD (props: { visibilityClass: string }) {
  //
  const dAppState = useNWStore(s => s.dAppState)

  //
  return (
    <Flex
      id='hud'
      flexFlow='row wrap'
      justifyContent={{ base: 'center', md: 'center', lg: 'space-between', xl: 'space-between' }}
      alignItems='self-start'
      minH='11rem'
      className={props.visibilityClass}
      p='5' gap='5'
    >
      <Flex direction='column' gap={2} zIndex='99'>
        <HUDButton name='WHITEPAPER' icon={faRulerVertical} href='/resources/nw-whitepaper.pdf' />
        {dAppState === 'Ready' && <SecureBotStatus />}
      </Flex>
      <Flex direction='column' gap={2} zIndex='99'>
        <AudioController />
        <Wallet isVisible={props.visibilityClass === 'ready'} />
      </Flex>
    </Flex>
  )
}

//
function SecureBotStatus () {
  return (
    <Flex
      border='1px'
      borderColor="#ed5af7"
      direction='column'
      alignItems='center'
      justifyContent='center'
      p='2'
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
export function HUDButton (props: { name: string, icon: IconProp, href: string }) {
  return (
    <a href={props.href} target='_blank' rel="noreferrer">
      <Button
        leftIcon={<FontAwesomeIcon icon={props.icon} />}
        fontSize={'xs'}
      >{props.name}</Button>
    </a>
  )
}
