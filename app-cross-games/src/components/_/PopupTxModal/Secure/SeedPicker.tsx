import { useCallback, useEffect, useMemo, useState } from 'react'
import shallow from 'zustand/shallow'

import { Flex, Input, InputGroup, InputLeftElement, InputRightElement,Text } from '@chakra-ui/react'
import { faAnglesDown,faCheck, faCircleExclamation, faLock, faSeedling, faWarning } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import { useNWStore } from '#/src/lib/store/main'
import type { AnySecurePopupTx } from '#/src/lib/store/slices/popup-tx/handler'

import { NextStepLayout } from '.'

//
const SeedPicker = (props: {
    nextStep: () => void
    popupTx: AnySecurePopupTx
}) => {
  //
  const [passphrase, setPassphrase] = useState('')

  //
  const {
    currentPopupTxID,
    updateClientSeedFromPP
  } = useNWStore(s => ({
    currentPopupTxID: s.currentPopupTxID,
    updateClientSeedFromPP: s.updateClientSeedFromPP
  }), shallow)

  //
  const updateSeedFromPP = useCallback((passphrase: string) => {
    setPassphrase(passphrase)
    updateClientSeedFromPP(
      passphrase,
      props.popupTx,
      currentPopupTxID
    )
  }, [currentPopupTxID, props.popupTx, updateClientSeedFromPP])

  //
  const updateSeedFromEv = useCallback((ev) => {
    const input = (ev.target.value as string).trim()
    updateSeedFromPP(input)

    //
    localStorage.setItem('passphrase', input)
  }, [updateSeedFromPP])

  //
  const isSeedOK = useMemo(() =>
    props.popupTx.clientSeed?.isZero() === false
  , [props.popupTx.clientSeed])

  //
  useEffect(() => {
    const passphrase = localStorage.getItem('passphrase')
    updateSeedFromPP(passphrase)
    // leads to a "Maximum update depth exceeded" error
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  //
  return (
    <Flex direction='column' gap='2'>
      <Text textAlign='center'>
                To achieve a provably fair transaction, you must provide a seed of your choosing that must be 256 bits long.
                Type a pass-phrase that will be converted automatically to <b>SHA256</b> and used later on. Please remember it !
      </Text>
      <Flex direction='column' flex={1} gap='3'>
        <InputGroup className='c-input'>
          <InputLeftElement pointerEvents='none'>
            <FontAwesomeIcon icon={faLock} />
          </InputLeftElement>
          <Input type='text' value={passphrase} onChange={updateSeedFromEv} placeholder='Pass-phrase' />
          {!isSeedOK && <InputRightElement>
            <FontAwesomeIcon color='#ffe100' icon={faWarning} />
          </InputRightElement>}
        </InputGroup>
        <Flex className='indic-pop' alignItems='center' justifyContent='space-around'>
          <FontAwesomeIcon icon={faAnglesDown} />
          <Text>SHA256</Text>
          <FontAwesomeIcon icon={faAnglesDown} />
        </Flex>
        <InputGroup className='c-input'>
          <InputLeftElement pointerEvents='none'>
            <FontAwesomeIcon icon={faSeedling} />
          </InputLeftElement>
          <Input type='text' readOnly placeholder='Seed' value={isSeedOK ? props.popupTx.clientSeed.toHexString() : ''} />
          <InputRightElement>
            <FontAwesomeIcon color={isSeedOK ? 'white' : '#ce0f0f'} icon={isSeedOK ? faCheck : faCircleExclamation} />
          </InputRightElement>
        </InputGroup>
      </Flex>
      {isSeedOK && <NextStepLayout nextDescr='Continue' nextStep={props.nextStep} />}
    </Flex>
  )
}

export default SeedPicker;