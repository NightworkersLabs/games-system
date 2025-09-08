import { Flex, Link, Text } from '@chakra-ui/react'

import NWTitle from 'components/App/NWTitle'

import { useNWStore } from 'lib/store/main'

import { useCallback, useEffect, useState } from 'react'
import shallow from 'zustand/shallow'
import Casino from 'components/Casino'
import HUD from 'components/App/HUD'
import PopupTxModal from 'components/_/PopupTxModal'

import NWToasts from './Toasts'
import { DAppState } from 'lib/store/slices/web3'

import { motion } from 'framer-motion'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircleArrowUp } from '@fortawesome/free-solid-svg-icons'
import { BacklinkReference } from 'lib/Backlinking'

//
export default function App (props: {
    isStoreCompatible: boolean
}) {
  //
  const {
    dAppState,
    isCurrentDAppState
  } = useNWStore(s => ({
    dAppState: s.dAppState,
    isCurrentDAppState: s.isCurrentDAppState
  }), shallow)

  // handled css transition states
  const [visibilityClass, setVisibilityClass] = useState<'ready' | 'preparing'>('preparing')

  //
  useEffect(() => {
    setVisibilityClass(dAppState === 'Ready' ? 'ready' : 'preparing')
  }, [dAppState])

  //
  const mayReload = useCallback((state: DAppState) => {
    //
    const mayReloadLater = setInterval(() => {
      // if dAppState changed during reload attempt, cancel
      if (!isCurrentDAppState(state)) return

      //
      window.location.reload()
    //
    }, 1_500)

    //
    return () => clearInterval(mayReloadLater)
  }, [isCurrentDAppState])

  //
  useEffect(() => {
    // if either in these state...
    if (dAppState === 'MetaMaskHanging' || dAppState === 'Reloading') {
      // might reload if state has not changed in a time period
      return mayReload(dAppState)
    }
  }, [mayReload, dAppState])

  //
  const currentBacklink = useNWStore(s => s.currentBacklink)

  //
  return (
    <Flex direction="column" minH='100vh' maxW='100vw' overflow='auto'>
      <NWToasts />
      <NWTitle isPlaceholder={true} />
      <NWTitle
        visibilityClass={visibilityClass}
        doNetworkSelection={dAppState === 'SelectingNetwork'}
      />
      <HUD visibilityClass={visibilityClass} />
      <GameZone visibilityClass={visibilityClass}>
        { dAppState === 'Ready' &&
                    <>
                      <PopupTxModal />
                      <Casino />
                    </>
        }
      </GameZone>
      { dAppState === 'Ready' &&
        <Flex
          id='footerCR'
          className={visibilityClass}
          zIndex='99'
          position={{ base: 'initial', md: 'initial', lg: 'sticky', xl: 'sticky' }}
          alignSelf={{ base: 'initial', md: 'initial', lg: 'end', xl: 'end' }}
          bottom='.5rem' right='0'
          direction='column' alignItems='center' justifyContent='center'
          fontSize='.55rem'
          py='2' px='5' gap='1px'
          mt={{ base: 2, md: 2, lg: 0, xl: 0 }}
          backgroundColor='#0006'
        >
          <Text>© 2022 - Night Workers Team</Text>
          {currentBacklink?.sponsorIsComprehensive != null && <EndorsementFooter backlink={currentBacklink}/>}
        </Flex>
      }
      { (dAppState === 'WaitingOnMetamask' || dAppState === 'MetaMaskFailure') &&
                props.isStoreCompatible === false &&
                <ExtensionBarPointer />
      }
    </Flex>
  )
}

//
function GameZone (props: {
  visibilityClass: string
  children: any
}) {
  //
  return (
    <Flex
      id='game-zone'
      px='5'
      className={props.visibilityClass}
      direction="column"
      flex='1'
    >
      <Flex flex='1' />
      <motion.div layout="position" transition={{ duration: 0.15, ease: 'easeIn' }}>
        <Flex
          direction="column"
          w="full"
          maxW="container.lg"
          mx="auto"
          px='3'
          pt='4'
          pb='7'
          boxShadow='0px 0px 14px 3px #000000b8'
          borderRadius='10px'
          backgroundColor='#371a54de'
        >{props.children}</Flex>
      </motion.div>
      <Flex flex='1' />
    </Flex>
  )
}

//
function EndorsementFooter (props: {
  backlink: BacklinkReference
}) {
  return (
    <Flex alignItems='center' justifyContent='center' gap='1'>
      <Text>Endorsed by</Text>
      {props.backlink.hyperlink == null
        ? <Text>{props.backlink.dashboardDescription}</Text>
        : <Link backgroundColor='transparent' href={props.backlink.hyperlink}>{props.backlink.dashboardDescription}</Link>
      }
    </Flex>
  )
}

//
function ExtensionBarPointer () {
  return (
    <Flex position='absolute' right='3.5cm' top='.2rem'>
      <motion.div
        style={{ position: 'absolute' }}
        animate={{ top: '10px' }}
        transition={{ duration: 0.6, repeat: Infinity, ease: 'easeIn' }}
      >
        <motion.div
          style={{ opacity: 0, display: 'flex', gap: '.5rem' }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, ease: 'backIn' }}
        >
          <FontAwesomeIcon size='2x' icon={faCircleArrowUp} />
          <Text alignItems='center' fontSize='.75rem'>Check Your Extensions</Text>
        </motion.div>
      </motion.div>
    </Flex>
  )
}
