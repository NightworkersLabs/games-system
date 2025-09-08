import { Flex, Text } from '@chakra-ui/react'

import NetworkIssueModal from 'components/App/NetworkIssueModal'
import NWTitle from 'components/App/NWTitle'

import { useNWStore } from 'lib/store/main'

import { useCallback, useEffect, useRef, useState } from 'react'
import shallow from 'zustand/shallow'
import NWTabs from './NWTabs'
import HUD from 'components/App/HUD'
import PopupTxModal from 'components/_/PopupTxModal'

import MetaMaskOnboarding from '@metamask/onboarding'
import NWToasts from './Toasts'
import { DAppState } from 'lib/store/slices/web3'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircleArrowUp } from '@fortawesome/free-solid-svg-icons'

import { motion } from 'framer-motion'

//
export default function App (props: {
    isStoreCompatible: boolean
}) {
  //
  const {
    dAppState,
    L2NetworkToManuallyInsert,
    isCurrentDAppState
  } = useNWStore(s => ({
    dAppState: s.dAppState,
    L2NetworkToManuallyInsert: s.L2NetworkToManuallyInsert,
    isCurrentDAppState: s.isCurrentDAppState
  }), shallow)

  /** @dev cannot instantiate MetaMaskOnboarding directly into useRef because of SSR */
  const onboarding = useRef<MetaMaskOnboarding>()

  /** @dev cannot instantiate MetaMaskOnboarding directly into useRef because of SSR */
  useEffect(() => {
    if (onboarding.current) return
    onboarding.current = new MetaMaskOnboarding()
  }, [])

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
    }, 1_500)

    //
    return () => clearInterval(mayReloadLater)
  }, [isCurrentDAppState])

  //
  useEffect(() => {
    // if still in MetaMask hang state after 1.5secs, reload
    if (dAppState === 'MetaMaskHanging' || dAppState === 'Reloading') {
      return mayReload(dAppState)
    }
  }, [mayReload, dAppState])

  //
  return (
    <Flex direction="column" minH='100vh' maxW='100vw'>
      { L2NetworkToManuallyInsert && <NetworkIssueModal /> }
      <NWToasts />
      <NWTitle isPlaceholder={true} />
      <NWTitle onboarding={onboarding.current} visibilityClass={visibilityClass} />
      <HUD visibilityClass={visibilityClass} />
      <GameZone visibilityClass={visibilityClass}>
        { dAppState === 'Ready' &&
                    <>
                      <PopupTxModal />
                      <NWTabs />
                    </>
        }
      </GameZone>
      {
        (dAppState === 'WaitingOnMetamask' || dAppState === 'MetaMaskFailure') &&
                props.isStoreCompatible === false &&
                <ExtensionBarPointer />
      }
    </Flex>
  )
}

//
function GameZone (props) {
  //
  return (
    <Flex
      id='game-zone'
      className={props.visibilityClass}
      direction="column"
      flex='1'
    >
      <Flex
        direction="column"
        w="full"
        maxW="container.lg"
        mx="auto"
        boxShadow='0px 0px 14px 3px #000000b8'
        borderRadius='10px'
      >{props.children}</Flex>
      <Flex flex='1' />
      <Flex justifyContent='center' fontSize='.6rem' my='3' gap='1'>
        <Text>© 2022 - Night Workers Team</Text>
      </Flex>
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
