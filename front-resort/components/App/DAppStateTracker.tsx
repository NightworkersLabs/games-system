import { Flex, Spinner, Button, Text, Image } from '@chakra-ui/react'
import { useState, useMemo, useCallback } from 'react'
import { useNWStore } from 'lib/store/main'
import MetaMaskOnboarding from '@metamask/onboarding'

//
export default function DAppStateTracker (props: { onboarding: MetaMaskOnboarding, visibilityClass: string }) {
  //
  const {
    dAppState,
    initialDataFetchingProgress
  } = useNWStore(s => ({
    dAppState: s.dAppState,
    initialDataFetchingProgress: s.initialDataFetchingProgress
  }))

  //
  const [currentlyOnboarding, setCurrentlyOnboarding] = useState(false)

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
    case 'ProviderReady':
      return 'Preparing the streets...'
    case 'Reloading':
      return 'Reloading...'
    case 'Ready':
      return 'Ready !'
    }
  }, [dAppState, initialDataFetchingProgress])

  //
  const mustDisplaySpinner = useMemo(() =>
    (dAppState !== 'WaitingOnMetaMaskInstallation' && dAppState !== 'MetaMaskFailure') || currentlyOnboarding
  , [currentlyOnboarding, dAppState])

  //
  const doOnboarding = useCallback(() => {
    if (props.onboarding) {
      props.onboarding.startOnboarding()
      setCurrentlyOnboarding(true)
    }
  }, [props.onboarding])

  //
  return (
    <Flex id='app-state' className={props.visibilityClass} direction='column' alignItems='center' mt='5'>
      {mustDisplaySpinner && <Spinner size="lg" color="#ed5af7" />}
      <br />
      <Text textAlign='center' px='1.5rem'>{renderStateDescription}</Text>
      {dAppState === 'WaitingOnMetaMaskInstallation' &&
                <Button
                  leftIcon={<Image boxSize='16px' alt='Metamask' src='/resources/icons/metamask_64.png' />}
                  mt='2'
                  disabled={currentlyOnboarding}
                  onClick={doOnboarding}
                >Install MetaMask</Button>}
      {currentlyOnboarding && <Text mt='1' fontSize='10px'>(...please reload once it is done :D)</Text> }
    </Flex>
  )
}
