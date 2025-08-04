import { Image, Flex, Modal, ModalOverlay, ModalContent, ModalHeader, Text, ModalCloseButton, ModalBody, Box, Button } from '@chakra-ui/react'
import { faTwitter } from '@fortawesome/free-brands-svg-icons'
import { faCashRegister } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { formatEtherFixed } from 'lib/BigNumberFormatters'
import { useNWStore } from 'lib/store/main'
import { useMemo } from 'react'

export default function WinningsModal () {
  //
  const {
    currencyName,
    logo,
    latestChipsConversion,
    getGrossCurrencyFromChips,
    resetLCCResult
  } = useNWStore(s => ({
    currencyName: s.currentNetwork?.currencyName,
    logo: s.currentNetwork?.logo,
    latestChipsConversion: s.latestChipsConversion,
    getGrossCurrencyFromChips: s.getGrossCurrencyFromChips,
    resetLCCResult: s.resetLCCResult
  }))

  //
  const won = useMemo(() =>
    formatEtherFixed(getGrossCurrencyFromChips(latestChipsConversion.netEvol))
  , [getGrossCurrencyFromChips, latestChipsConversion.netEvol])

  //
  const transfered = useMemo(() =>
    formatEtherFixed(getGrossCurrencyFromChips(latestChipsConversion.howManyChips))
  , [getGrossCurrencyFromChips, latestChipsConversion.howManyChips])

  //
  const preformattedTwit = useMemo(() => 'http://twitter.com/intent/tweet?text=' + encodeURIComponent(
    `Hey @nightworkersP2E, many thanks for your ${won} ${currencyName} ! Join us on ${window.location} #${currencyName}`
  ), [currencyName, won])

  //
  return (
    <Modal closeOnOverlayClick={false} isCentered isOpen onClose={resetLCCResult}>
      <ModalOverlay />
      <ModalContent className="win-bg pinkBorder">
        <ModalHeader>
          <Flex gap='2' alignItems='center' justifyContent='center'>
            <Text fontSize='2rem'>🎰</Text>
            <Text fontSize='.9rem' className='pixelFont'>You lucky devil</Text>
            <Text fontSize='.9rem' className='pixelFont'>!</Text>
            <Text fontSize='2rem'>🎰</Text>
          </Flex>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Flex textAlign='center' w='100%' flex='1' direction='column' justifyContent='center' alignItems='center' gap='3'>
            <Box>
              <Text>You successfully robbed the</Text>
              <Text className='pixelFont'>Bank</Text>
              <Flex position='relative' lineHeight='1' direction='column' mt='.6rem' alignItems='center' gap='2' className='pixelFont'>
                <Text position='absolute' top='-.2rem' fontSize='.35rem'>of...</Text>
                <Flex alignItems='center' flexWrap='nowrap' gap='2'>
                  <Text fontWeight='bold'>{won}</Text>
                  <Text fontSize='.6rem'>{currencyName}</Text>
                  <Image boxSize='2rem' src={logo} alt='' />
                  <Text>!</Text>
                </Flex>
              </Flex>
            </Box>
            <Flex position='relative'>
              <Flex position='absolute' bottom='-.1rem' right='1.3rem' opacity='.9'>
                <FontAwesomeIcon icon={faCashRegister} />
              </Flex>
              <Text backgroundColor='#3027' p='2' borderRadius='5px' color='#DDD' mb='1' fontSize='.6rem'>Your transfer order was approved, you will receive your {transfered} {currencyName} on your account soon.</Text>
            </Flex>
            <Flex gap='1' flex='1' justifyContent='center' alignItems='center' textAlign='center' w='100%' direction='column' p='2'>
              <Button
                size='md'
                _hover={{ backgroundColor: 'twitter.600' }}
                gap='2' border='none' bgColor='twitter.500' borderRadius='5rem'
                onClick={() => window.open(preformattedTwit, '_blank')}
              >
                <FontAwesomeIcon icon={faTwitter}/>
                <Text>Tweet</Text>
              </Button>
              <Text fontSize='.5rem'>If you had fun playing with us, please share your success on Twitter {':)'}</Text>
            </Flex>
          </Flex>
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}
