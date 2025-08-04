import { Divider, Flex, SimpleGrid, Text } from '@chakra-ui/react'
import { faHandHoldingDollar, faTags } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { BlockchainCurrencyIcon, NWERC20CurrencyIcon } from 'components/_/MixedCurrencyIcon'
import { BLOCKCHAIN_CURRENCY_NAME, NWERC20_NAME } from 'env/defaults'
import { useMemo } from 'react'
import { useNWStore } from 'lib/store/main'
import { CompositeMintPrice } from 'lib/store/slices/mint/user-context'
import { formatEtherFixed } from 'lib/BigNumberFormatters'
import shallow from 'zustand/shallow'

//
export default function MintPrice () {
  //
  return (
    <SimpleGrid columns={2} spacing={5}>
      <MyPrivileges />
      <MyPrice />
    </SimpleGrid>
  )
}

//
function MyPrivileges () {
  //
  const {
    discountedMintsLeft,
    freeMintsLeft
  } = useNWStore(s => ({
    discountedMintsLeft: s.discountedMintsLeft,
    freeMintsLeft: s.freeMintsLeft
  }), shallow)

  //
  return (
    <Flex direction='column' backgroundColor='#5d4c5bbf' p='3' borderRadius='5px' boxShadow='0px 0px 7px 0px #400d0d'>
      <Flex alignItems='center' justifyContent='center' gap='2'>
        <FontAwesomeIcon icon={faTags} />
        <Text fontSize='.65rem' className='pixelFont' fontWeight='bold'>My Privileges</Text>
      </Flex>
      <Divider mt='2' mb='1' />
      <Flex direction='column' flex='1' justifyContent='center'>
        <Flex gap={2}>
          <Flex flex='1'>Free:</Flex>
          <Text fontWeight='bold'>{freeMintsLeft}</Text>
        </Flex>
        <Flex gap={2}>
          <Flex flex='1'>Discounted:</Flex>
          <Text fontWeight='bold'>{discountedMintsLeft}</Text>
        </Flex>
      </Flex>
    </Flex>
  )
}

//
function MyPrice () {
  //
  const {
    freeMintsLeft,
    currentUserMintPrice
  } = useNWStore(s => ({
    freeMintsLeft: s.freeMintsLeft,
    currentUserMintPrice: s.currentUserMintPrice
  }), shallow)

  //
  return (
    <Flex direction='column' flex={1} backgroundColor='#5d4c5bbf' p='3'borderRadius='5px' boxShadow='0px 0px 7px 0px #400d0d'>
      <Flex alignItems='center' gap='2' justifyContent='center'>
        <FontAwesomeIcon icon={faHandHoldingDollar} />
        <Text fontSize='.65rem' className='pixelFont' fontWeight='bold'>My Price</Text>
      </Flex>
      <Divider mt='2' mb='1' />
      <Flex flex='1' alignItems='center' justifyContent='center' direction='column' py='2' gap='2'>
        {!currentUserMintPrice
          ? <Text>NOT AVAILABLE</Text>
          : (freeMintsLeft > 0
            ? <Text flex='1'>Free !</Text>
            : <MintPriceDisplayer compositeDescription={currentUserMintPrice} />
          )
        }
        <Text fontSize='.6rem'>/ Night Worker</Text>
      </Flex>
    </Flex>
  )
}

//
function MintPriceDisplayer (props: {
    compositeDescription: CompositeMintPrice
}) {
  //
  const isERC20 = useMemo(() => props.compositeDescription.currency === 'NWERC20', [props.compositeDescription.currency])

  //
  const currencyNameToUse = useMemo(() => isERC20 ? NWERC20_NAME : BLOCKCHAIN_CURRENCY_NAME, [isERC20])

  //
  return (
    <Flex gap='2' alignItems='center'>
      <Flex fontWeight='bold'>{
        formatEtherFixed(isERC20
          ? props.compositeDescription.price.div(1000)
          : props.compositeDescription.price,
        isERC20 ? 0 : 2)
      }{isERC20 ? 'k' : ''}</Flex>
      <Flex alignItems='center' gap='1'>
        { currencyNameToUse === '$LOLLY' ? <NWERC20CurrencyIcon /> : <BlockchainCurrencyIcon /> }
        <Text mt='1' ml='1' fontSize='.6rem' className='pixelFont'>{currencyNameToUse}</Text>
      </Flex>
    </Flex>
  )
}
