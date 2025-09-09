import { useCallback, useEffect } from 'react'
import shallow from 'zustand/shallow'

import { Button, Flex, Text,Tooltip } from '@chakra-ui/react'
import { faPersonWalkingArrowRight, faPowerOff, faSpinner, faWarning } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import { useNWStore } from '#/lib/store/main'

//
const CasinoAuth = () => {
  //
  const {
    currentEOAAddress,
    casinoAuthSignature,
    setCasinoAuthSignature,
    clearCasinoAuthSignature
  } = useNWStore(s => ({
    casinoAuthSignature: s.casinoAuthSignature,
    currentEOAAddress: s.currentEOAAddress,
    setCasinoAuthSignature: s.setCasinoAuthSignature,
    clearCasinoAuthSignature: s.clearCasinoAuthSignature
  }), shallow)

  //
  useEffect(() => {
    const authSign : string = localStorage.getItem('casinoSign_' + currentEOAAddress)
    setCasinoAuthSignature(authSign)
  }, [currentEOAAddress, setCasinoAuthSignature])

  //
  useEffect(() => {
    //
    if (casinoAuthSignature == null) return

    //
    localStorage.setItem('casinoSign_' + currentEOAAddress, casinoAuthSignature)
  }, [casinoAuthSignature, currentEOAAddress])

  //
  const clearAuth = useCallback(() => {
    localStorage.removeItem('casinoSign_' + currentEOAAddress)
    clearCasinoAuthSignature()
  }, [clearCasinoAuthSignature, currentEOAAddress])

  //
  return (
    <CasinoAuthButton clearAuth={clearAuth} />
  )
}

//
const CasinoAuthButton = (props: { clearAuth: () => void }) => {
  //
  const {
    casinoAuthSignature,
    running,
    authenticateForCasino$
  } = useNWStore(s => ({
    casinoAuthSignature: s.casinoAuthSignature,
    running: s.authenticateForCasinoRS,
    authenticateForCasino$: s.authenticateForCasino$
  }), shallow)

  //
  return (
    <Flex alignItems='center' gap='1'>
      <Button
        size='xs'
        onClick={running === true
          ? null
          : (casinoAuthSignature == null
            ? () => authenticateForCasino$.raise()
            : props.clearAuth)
        }
        gap='2'
        py='3'
        isDisabled={running === true}
      >
        <FontAwesomeIcon
          className={running === true
            ? 'spinning'
            : ''
          }
          icon={running === true
            ? faSpinner
            : (casinoAuthSignature == null
              ? faPowerOff
              : faPersonWalkingArrowRight)
          }
        />
        <Text>{
          running === true
            ? 'Logging...'
            : (casinoAuthSignature == null
              ? 'Login to Casino'
              : 'Logout from Casino')
        }</Text>
      </Button>
      { typeof running === 'string' && (
        <Tooltip hasArrow label={'Failed to sign-in to casino: ' + running}>
          <Flex ml='1'>
            <FontAwesomeIcon icon={faWarning} />
          </Flex>
        </Tooltip>
      )}
    </Flex>
  )
}

//
export const CasinoAuthReminderPopup = () => {
  return (
    <>
      <Text fontSize='.8rem' fontStyle='italic'>Please</Text>
      <CasinoAuth />
      <Text fontSize='.8rem' fontStyle='italic'>before accessing Casino</Text>
    </>
  )
}

export default CasinoAuth;