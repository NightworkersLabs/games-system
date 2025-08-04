import { Flex, Spinner, Button, Text, Image, Box } from '@chakra-ui/react'
import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { useNWStore } from 'lib/store/main'
import MetaMaskOnboarding from '@metamask/onboarding'

//
export default function DAppStateTracker (props: { visibilityClass: string }) {
  //
  const {
    dAppState,
    initialDataFetchingProgress
  } = useNWStore(s => ({
    dAppState: s.dAppState,
    initialDataFetchingProgress: s.initialDataFetchingProgress
  }))

  //
  const renderStateDescription = useMemo(() => {
    switch (dAppState) {
    case 'Idle':
      return '...'
    case 'WaitingOnMetaMaskInstallation':
      return 'Please install and configure MetaMask with at least 1 account before continuing.'
    case 'MetaMaskHanging':
      return 'Auto-reloading, do not touch anything :)'
    case 'MetaMaskFailure':
      return 'MetaMask failed while logging into your account. Please reload to try again.'
    case 'WaitingOnMetamask':
      return 'Please check MetaMask to allow account access or network switch.'
    case 'FetchingInitialData':
      return `Preparing the streets (${initialDataFetchingProgress[0]}/${initialDataFetchingProgress[1]}) ...`
    case 'SetupFromDataFailed':
      return 'Could not fetch initial dApp state from smart contracts. Please contact the developpers.'
    case 'SelectingNetwork':
      return 'Picking handled network...'
    case 'ContractsInitialized':
      return 'Preparing the streets...'
    case 'Reloading':
      return 'Reloading...'
    case 'Ready':
      return 'Ready !'
    }
  }, [dAppState, initialDataFetchingProgress])

  //
  return (
    <Flex id='app-state' className={props.visibilityClass} direction='column' alignItems='center' mt='5'>
      <Box h='1.2em' />
      <Text textAlign='center' px='1.5rem'>{renderStateDescription}</Text>
      {dAppState === 'WaitingOnMetaMaskInstallation' && <OnboardingButton />}
    </Flex>
  )
}

function OnboardingButton () {
  //
  const dAppState = useNWStore(s => s.dAppState)

  /** @dev cannot instantiate MetaMaskOnboarding directly into useRef because of SSR */
  const onboarding = useRef<MetaMaskOnboarding>(null)

  /** @dev cannot instantiate MetaMaskOnboarding directly into useRef because of SSR */
  useEffect(() => {
    if (onboarding.current) return
    onboarding.current = new MetaMaskOnboarding()
  }, [])

  //
  const [currentlyOnboarding, setCurrentlyOnboarding] = useState(false)

  //
  const doOnboarding = useCallback(() => {
    if (onboarding.current == null) return

    //
    onboarding.current.startOnboarding()
    setCurrentlyOnboarding(true)
  }, [onboarding])

  //
  const mustDisplaySpinner = useMemo(() =>
    (dAppState !== 'WaitingOnMetaMaskInstallation' && dAppState !== 'MetaMaskFailure') || currentlyOnboarding
  , [currentlyOnboarding, dAppState])

  //
  return (
    <>
      <Button
        leftIcon={<Image boxSize='16px' alt='Metamask' src='/resources/icons/metamask_64.png' />}
        mt='2'
        p='3'
        disabled={currentlyOnboarding}
        onClick={doOnboarding}
      >
        {mustDisplaySpinner ? 'Installing...' : 'Install MetaMask'}
        {mustDisplaySpinner && <Spinner color="#ed5af7" ml='2' size='xs' />}
      </Button>
      {currentlyOnboarding && <Text mt='1' fontSize='10px'>(...please reload once it is done :D)</Text> }
    </>
  )
}
