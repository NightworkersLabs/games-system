import { Flex, Image } from '@chakra-ui/react'
import { NWERC20CoinImagePath, NWERC20_NAME, BLOCKCHAIN_CURRENCY_NAME } from 'env/defaults'

export default function MixedCurrencyIcon () {
  return (
    <Flex width='32px' height='32px' position='relative' alignItems='center' overflow='hidden'>
      <Image
        objectPosition='16px 0'
        left='-16px'
        position='absolute'
        src={NWERC20CoinImagePath()}
        alt={NWERC20_NAME}
      />
      <Image
        position='absolute'
        objectPosition='-16px 0'
        left='20px'
        width='28px'
        src="/resources/icons/bc.svg"
        alt={BLOCKCHAIN_CURRENCY_NAME}
      />
    </Flex>
  )
}

//
export function NWERC20CurrencyIcon () {
  return (
    <Image src={NWERC20CoinImagePath()} alt={NWERC20_NAME} />
  )
}

//
export function BlockchainCurrencyIcon () {
  return (
    <Image
      className='bc-logo'
      src="/resources/icons/bc.svg"
      alt={BLOCKCHAIN_CURRENCY_NAME}
      objectFit='cover'
      height='24px'
      width='24px'
    />
  )
}
