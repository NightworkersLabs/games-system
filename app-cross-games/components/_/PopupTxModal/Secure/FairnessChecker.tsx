import { BigNumber } from 'ethers'
import { keccak256 } from 'ethers/lib/utils'
import { useMemo } from 'react'

import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Flex,   Input,
  InputGroup,
Link,
Text,   Tooltip
} from '@chakra-ui/react'
import { faCheck, faCircleQuestion, faCubesStacked, faDice, faInfoCircle, faKey, faSeedling, faWarning } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import type { RandomNumberResolver } from '#/components/_/PopupTxModal/Secure/OutcomeResolvers';
import { OUTCOME_RESOLVERS } from '#/components/_/PopupTxModal/Secure/OutcomeResolvers'
import type { TrustfulPayloadContext } from '#/lib/store/slices/_/trustful'
import type { ProvableSecurePopupTx } from '#/lib/store/slices/popup-tx/handler'

//
const FairnessChecker = (props: {
    popupTx: TrustfulPayloadContext & ProvableSecurePopupTx
}) => {
  //
  const associatedResolver = useMemo(() =>
    OUTCOME_RESOLVERS[props.popupTx.resolveContext]
  , [props.popupTx.resolveContext])

  //
  return (
    <Flex direction='column' flex='1' gap='2'>
      { props.popupTx.provableBotResponse?.wasHashedSecretLegitimate
        ? <ProvableText />
        : <NotProvableText wantsProvabilityForSecurePopupTx={props.popupTx.wantedAsProvable} /> }
      <Accordion backgroundColor='#ffffff21'>
        <HashSecretFairnessItem
          usedServerSecretHash={props.popupTx.pshPayload?.hash ?? BigNumber.from(0)}
          usedSecret={props.popupTx.provableBotResponse?.usedSecret}
        />
        <RandomNumberFairnessItem
          clientSeed={props.popupTx.clientSeed ?? BigNumber.from(0)}
          orderNonce={props.popupTx.provableBotResponse?.nonce}
          randomNumber={props.popupTx.provableBotResponse?.randomNumber}
          usedSecret={props.popupTx.provableBotResponse?.usedSecret}
        />
        {associatedResolver && <OutcomeReplayerItem
          randomNumber={props.popupTx.provableBotResponse?.randomNumber}
          resolver={associatedResolver}
        />}
      </Accordion>
      <Flex flex='1' textAlign='right' justifyContent='center' my='2' fontSize='.7rem'>
        <Flex gap='1'>
          <Text>Check our</Text>
          <Link
            isExternal
            href='https://github.com/Nightworkers-P2E/pf-compliance/blob/main/compliance.ts'
          >Random Number Calculator</Link>
          <Text>algorithm</Text>
        </Flex>
      </Flex>
    </Flex>
  )
}

//
const NotProvableText = (props: { wantsProvabilityForSecurePopupTx: boolean }) => {
  //
  return (
    <Text color='#ff7676' textAlign='center' mb='2'>
      { (!props.wantsProvabilityForSecurePopupTx && 'You explicitely opted-out of provability and default values were used. Provability is not to be expected.') ||
                'Provability could not be achieved... maybe the secret you requested timed-out ?'
      }
    </Text>
  )
}

//
const ProvableText = () => {
  return (
    <Text color='#54db54' textAlign='center' mb='2'>
            Everything worked as intended, let&apos;s check the values...
    </Text>
  )
}

//
const HashSecretFairnessItem = (props: {
    usedServerSecretHash: BigNumber,
    usedSecret: BigNumber
}) => {
  //
  const rehashedSecret = useMemo(() =>
    keccak256(props.usedSecret.toHexString())
  , [props.usedSecret])

  //
  const areEquals = useMemo(() =>
    props.usedServerSecretHash.toHexString() === rehashedSecret,
  [props.usedServerSecretHash, rehashedSecret])

  //
  return (
    <AccordionItem>
      <h2>
        <AccordionButton>
          <FCAccordionTitle
            areEquals={areEquals}
            title='Hash Secret Fairness'
            tooltip='Compare the Secret hash we might have fetched earlier with the hash we calculate from the revealed secret'
          />
          <AccordionIcon />
        </AccordionButton>
      </h2>
      <AccordionPanel>
        <Flex direction='column' gap='1'>
          <Flex alignItems='center' gap='1' ml='1'>
            <FontAwesomeIcon icon={faKey}/>
            <Text>Secret</Text>
          </Flex>
          <InputGroup className='c-input'>
            <Input className='c-input' readOnly value={props.usedSecret.toHexString()}/>
          </InputGroup>
          <Flex p='2' direction='column' gap='1'>
            <Flex direction='column'>
              <Text ml='1'>Expected Secret Hash</Text>
              <InputGroup className='c-input'>
                <Input size='xs' readOnly value={props.usedServerSecretHash.toHexString()}/>
              </InputGroup>
            </Flex>
            <Flex direction='column'>
              <Flex gap='2'>
                <Text ml='1'>Replayed Secret Hash</Text>
                <Text color='#ffdb28'>(auto-calculated)</Text>
              </Flex>
              <InputGroup className='c-input'>
                <Input size='xs' readOnly value={rehashedSecret}/>
              </InputGroup>
            </Flex>
          </Flex>
        </Flex>
      </AccordionPanel>
    </AccordionItem>
  )
}

//
const OutcomeReplayerItem = (props: {
  randomNumber: BigNumber
  resolver: RandomNumberResolver
}) => {
//
  return (
    <AccordionItem>
      <h2>
        <AccordionButton>
          <FCAccordionTitle
            title='Outcome Replay'
            tooltip='Compute steps to reproduce resulting outcome from received random number.'
          />
          <AccordionIcon />
        </AccordionButton>
      </h2>
      <AccordionPanel>
        {props.resolver(props.randomNumber)}
      </AccordionPanel>
    </AccordionItem>
  )
}

//
const RandomNumberFairnessItem = (props: {
    clientSeed: BigNumber
    orderNonce: number
    randomNumber: BigNumber
    usedSecret: BigNumber
}) => {
  //
  const safeClientSeedHex = useMemo(() =>
    props.clientSeed?.toHexString() ?? '0x00'
  , [props.clientSeed])

  // extracted from the trusted validator code
  const replayedRandomNumber = useMemo(() => {
    //
    const concated =
            safeClientSeedHex +
            props.orderNonce.toString() +
            props.usedSecret.toHexString()

    //
    return keccak256(Buffer.from(concated, 'ascii'))
  }, [props.orderNonce, props.usedSecret, safeClientSeedHex])

  //
  const areEquals = useMemo(() =>
    props.randomNumber.toHexString() === replayedRandomNumber,
  [props.randomNumber, replayedRandomNumber])

  //
  return (
    <AccordionItem>
      <h2>
        <AccordionButton>
          <FCAccordionTitle
            areEquals={areEquals}
            title='Random Number Fairness'
            tooltip='Use the Seed we might have provided earlier to re-compute the random number using our open-source algorithm'
          />
          <AccordionIcon />
        </AccordionButton>
      </h2>
      <AccordionPanel>
        <Flex direction='column'>
          <Flex direction='column' gap='2'>
            { props.orderNonce != null && props.orderNonce !== 0 &&
              <Flex direction='column'>
                <Flex alignItems='center' gap='1' ml='1'>
                  <FontAwesomeIcon icon={faCubesStacked}/>
                  <Text>Order Nonce</Text>
                </Flex>
                <InputGroup className='c-input'>
                  <Input readOnly value={props.orderNonce}/>
                </InputGroup>
              </Flex>
            }
            <Flex direction='column'>
              <Flex alignItems='center' gap='1' ml='1'>
                <FontAwesomeIcon icon={faSeedling}/>
                <Text>Seed</Text>
              </Flex>
              <InputGroup className='c-input'>
                <Input readOnly value={safeClientSeedHex}/>
              </InputGroup>
            </Flex>
            <Flex direction='column' p='2' gap={1}>
              <Flex direction='column'>
                <Flex gap='2'>
                  <Text ml='1'>Replayed Random Number</Text>
                  <Text color='#ffdb28'>(auto-calculated)</Text>
                </Flex>
                <InputGroup className='c-input'>
                  <Input size='xs' readOnly value={replayedRandomNumber}/>
                </InputGroup>
              </Flex>
              <Flex direction='column'>
                <Flex alignItems='center' gap='1' ml='1'>
                  <FontAwesomeIcon icon={faDice}/>
                  <Text>Random Number</Text>
                </Flex>
                <InputGroup className='c-input'>
                  <Input size='xs' readOnly value={props.randomNumber.toHexString()}/>
                </InputGroup>
              </Flex>
            </Flex>
          </Flex>
        </Flex>
      </AccordionPanel>
    </AccordionItem>
  )
}

const FCAccordionTitle = (props: {
    title: string
    tooltip: string
    areEquals?: boolean
}) => {
  return (
    <Tooltip placement='top' hasArrow label={props.tooltip}>
      <Flex alignItems='center' flex='1' textAlign='left' gap='2'>
        {props.areEquals != null
          ? <FontAwesomeIcon color={props.areEquals ? '#5fc95f' : '#ff3c75'} icon={props.areEquals ? faCheck : faWarning} />
          : <FontAwesomeIcon icon={faInfoCircle} />
        }
        <Text>{props.title}</Text>
        <Flex alignSelf='start' mt='1'>
          <FontAwesomeIcon icon={faCircleQuestion} size='xs' />
        </Flex>
      </Flex>
    </Tooltip>
  )
}

export default FairnessChecker;