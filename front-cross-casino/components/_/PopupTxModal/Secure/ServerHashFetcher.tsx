import { RepeatIcon, TimeIcon, CheckIcon, WarningIcon } from '@chakra-ui/icons'
import { Flex, IconButton, Input, InputGroup, InputLeftElement, InputRightElement, Spinner, Text, Tooltip } from '@chakra-ui/react'
import { useEffect, useMemo, useState } from 'react'
import { useTimer } from 'react-timer-hook'
import { useNWStore } from 'lib/store/main'
import { AnySecurePopupTx } from 'lib/store/slices/popup-tx/handler'
import shallow from 'zustand/shallow'
import { NextStepLayout } from '.'

//
export default function ServerHashFetcher (props: {
    nextStep: () => void,
    popupTx: AnySecurePopupTx
}) {
  //
  const {
    currentPopupTxID,
    requestServerSecret
  } = useNWStore(s => ({
    currentPopupTxID: s.currentPopupTxID,
    requestServerSecret: s.requestServerSecret
  }), shallow)

  //
  const [hasSecretExpired, setSecretExpiration] = useState(true)

  //
  const isHashAvailable = useMemo(() =>
    props.popupTx.requestingSecret === false &&
        props.popupTx.pshPayload != null &&
        !props.popupTx.pshPayload.hash.isZero()
  , [props.popupTx.pshPayload, props.popupTx.requestingSecret])

  //
  const cannotRequestSecret = useMemo(() =>
    props.popupTx.requestingSecret === true
  , [props.popupTx.requestingSecret])

  //
  const errMsg = useMemo(() =>
    typeof props.popupTx.requestingSecret === 'string'
      ? props.popupTx.requestingSecret
      : null
  , [props.popupTx.requestingSecret])

  //
  const { minutes, seconds, restart } = useTimer({ expiryTimestamp: new Date(), autoStart: false })

  //
  useEffect(() => {
    //
    if (props.popupTx.pshPayload == null) return

    //
    const expiresInEpochMs = Math.floor(props.popupTx.pshPayload.autoDisposedAt) * 1_000
    if (new Date().getTime() >= expiresInEpochMs) return

    //
    restart(new Date(expiresInEpochMs), true)
    setSecretExpiration(false)

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.popupTx.pshPayload])

  //
  useEffect(() => {
    if (minutes === 0 && seconds === 0 &&
            props.popupTx.pshPayload &&
            !hasSecretExpired
    ) {
      setSecretExpiration(true)
    }
  }, [hasSecretExpired, minutes, seconds, props.popupTx.pshPayload])

  //
  return (
    <Flex direction='column'>
      <Text textAlign='center'>
                We will ask for our bot to produce a unique secret that will be automatically discarded if we do not use it quickly.
                He will give us back a hash of this secret, that we will use later on to ensure fairness.
      </Text>
      <Flex direction='column' align='center'>
        {props.popupTx.pshPayload &&
                    <PerishableSecretTimer minutes={minutes} seconds={seconds} secretExpired={hasSecretExpired} />
        }
        <InputGroup className='c-input'>
          <InputLeftElement pointerEvents='none'>
            { errMsg ? <WarningIcon /> : (isHashAvailable ? <CheckIcon /> : <Spinner />) }
          </InputLeftElement>
          <Input
            readOnly placeholder={errMsg ? 'Error !' : 'Fetching...'}
            value={isHashAvailable ? props.popupTx.pshPayload.hash.toHexString() : ''}
          />
          <InputRightElement>
            <Tooltip label='Refresh secret'>
              <IconButton
                border='0'
                bgColor='blackAlpha.400'
                borderRadius='5px'
                aria-label='Refresh secret'
                icon={cannotRequestSecret ? <TimeIcon /> : <RepeatIcon />}
                disabled={cannotRequestSecret}
                onClick={() => requestServerSecret(
                  props.popupTx,
                  currentPopupTxID
                )}
              />
            </Tooltip>
          </InputRightElement>
        </InputGroup>
        { errMsg &&
                    <SecretFetchingFailed errMsg={errMsg} />
        }
        {!hasSecretExpired && <NextStepLayout nextDescr='Run Tx' nextStep={props.nextStep} />}
      </Flex>
    </Flex>
  )
}

function PerishableSecretTimer ({ minutes, seconds, secretExpired }) {
  //
  return (
    <Flex p='2'>
      {(!secretExpired &&
                <Text color='green.300'>
                    Act quickly ! Expires in: {minutes}:{seconds.toString().padStart(2, '0')}
                </Text>) ||
             <Text color='#ff7676'>
                Secret Expired ! Please request another by clicking the Refresh button
             </Text>
      }
    </Flex>

  )
}

function SecretFetchingFailed (props : { errMsg: string }) {
  return (
    <Flex direction='column' align='center' mt='2'>
      <Text color='#ff7676'>Issue while fetching secret:</Text>
      <Text color='#ff7676'>{'=> '}{props.errMsg}{' <='}</Text>
      <Text color='#ff7676'>Please try again later.</Text>
    </Flex>
  )
}
