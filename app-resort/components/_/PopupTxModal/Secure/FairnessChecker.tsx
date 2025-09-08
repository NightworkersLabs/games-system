import {
  Flex, Text, Link,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Input,
  InputGroup,
  Tooltip
} from '@chakra-ui/react'
import { faCheck, faCircleQuestion, faCubesStacked, faDice, faKey, faSeedling, faWarning } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { BigNumber } from 'ethers'
import { keccak256 } from 'ethers/lib/utils'
import { useMemo } from 'react'
import { ProvableSecurePopupTx } from 'lib/store/slices/popup-tx/handler'
import { TrustfulPayloadContext } from 'lib/store/slices/_/trustful'

//
export default function FairnessChecker (props: {
    popupTx: TrustfulPayloadContext & ProvableSecurePopupTx
}) {
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
      </Accordion>
      <Flex flex='1' textAlign='right' justifyContent='center' my='2' fontSize='.7rem'>
        <Flex gap='1'>
          <Text>Check our</Text>
          <Link
            isExternal
            href='https://github.com/Nightworkers-P2E/offchain-service/blob/main/lib/provably-fair/compliance.ts'
          >Random Number Calculator</Link>
          <Text>algorithm</Text>
        </Flex>
      </Flex>
    </Flex>
  )
}

//
function NotProvableText (props: { wantsProvabilityForSecurePopupTx: boolean }) {
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
function ProvableText () {
  return (
    <Text color='#54db54' textAlign='center' mb='2'>
            Everything worked as intended, let&apos;s check the values...
    </Text>
  )
}

//
function HashSecretFairnessItem (props: {
    usedServerSecretHash: BigNumber,
    usedSecret: BigNumber
}) {
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
function RandomNumberFairnessItem (props: {
    clientSeed: BigNumber,
    orderNonce: number,
    randomNumber: BigNumber,
    usedSecret: BigNumber
}) {
  //
  const safeClientSeedHex = useMemo(() =>
    props.clientSeed?.toHexString() || '0x00'
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
            <Flex direction='column'>
              <Flex alignItems='center' gap='1' ml='1'>
                <FontAwesomeIcon icon={faCubesStacked}/>
                <Text>Order Nonce</Text>
              </Flex>
              <InputGroup className='c-input'>
                <Input readOnly value={props.orderNonce}/>
              </InputGroup>
            </Flex>
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

function FCAccordionTitle (props: {
    areEquals: boolean,
    title: string,
    tooltip: string
}) {
  return (
    <Tooltip placement='top' hasArrow label={props.tooltip}>
      <Flex alignItems='center' flex='1' textAlign='left' gap='2'>
        <FontAwesomeIcon color={props.areEquals ? '#5fc95f' : '#ff3c75'} icon={props.areEquals ? faCheck : faWarning} />
        <Text>{props.title}</Text>
        <Flex alignSelf='start' mt='1'>
          <FontAwesomeIcon icon={faCircleQuestion} size='xs' />
        </Flex>
      </Flex>
    </Tooltip>
  )
}
