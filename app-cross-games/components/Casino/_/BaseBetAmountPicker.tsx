import type { ReactElement} from 'react';
import { useMemo } from 'react'

import { Button, Flex, HStack, Image, Text } from '@chakra-ui/react'

import { BetBox } from '#/components/Casino/_/base'
import { CASINO_COIN_NAME } from '#/env/defaults'
import type { AnyBettedCurrencyType } from '#/lib/store/slices/_/bet'

//
const BaseBetAmountPicker = <T extends AnyBettedCurrencyType> (props: {
    betUpdater: (updatedBetAmount: T) => void,
    betIncreaser: (tick: T, upperLimit: T) => void,
    betDecreaser: (tick: T, lowerLimit: T) => void,
    betDisplayer: (bet: T) => string
    safeMaxResolver: (min: T, max: T) => T
    bet: T,
    minBet: T,
    maxBet: T,
    betTick: T,
    isDisabled?: boolean,
    subtitle?: string,
    image?: ReactElement
}) => {
  //
  const safeMaxBet = useMemo(() =>
    props.safeMaxResolver(props.minBet, props.maxBet)
  , [props])

  //
  return (
    <BetBox subtitle={props.subtitle}>
      <Flex direction='column' alignItems='center' gap='3'>
        <Flex gap='4' alignItems='center'>
          {props.image}
          <Text
            className='pixelFont'
            whiteSpace={'nowrap'}
            fontSize={{ base: 'md', sm: 'xl' }}
          >{props.betDisplayer(props.bet)}</Text>
        </Flex>
        <HStack
          align="center"
          spacing={{ base: 2 }}
          className='pixelFont'
        >
          <BaseBetButton
            text='MIN'
            isDisabled={props.isDisabled}
            onClick={() => props.betUpdater(props.minBet)}
            size='sm'
          />
          <BaseBetButton
            text='-'
            isDisabled={props.isDisabled}
            onClick={() => props.betDecreaser(props.betTick, props.minBet)}
            size='md'
          />
          <Flex fontSize={{ base: 'xl', sm: '2xl' }}>/</Flex>
          <BaseBetButton
            text='+'
            isDisabled={props.isDisabled}
            onClick={() => props.betIncreaser(props.betTick, safeMaxBet)}
            size='md'
          />
          <BaseBetButton
            text='MAX'
            isDisabled={props.isDisabled}
            onClick={() => props.betUpdater(safeMaxBet)}
            size='sm'
          />
        </HStack>
      </Flex>
    </BetBox>
  )
}

//
const BaseBetButton = (props: {
    isDisabled: boolean,
    onClick: () => void,
    text: string
    size: 'md' | 'sm'
}) => {
  return (
    <Button
      variant="outline"
      borderColor="#f67cff"
      borderRadius={'full'}
      _active={{ bg: '#9d00fe5c' }}
      _hover={{ bg: '#5200855c' }}
      onClick={props.onClick}
      isDisabled={props.isDisabled}
      fontSize={ props.size !== 'md' ? { base: 'xx-small', sm: 'xs' } : { base: 'xs', sm: 'md' }}
      padding={{ base: '.5rem', sm: '1rem' }}
      size={props.size}
    >{props.text}</Button>
  )
}

BaseBetAmountPicker.defaultProps = {
  subtitle: '2. Pick your bet',
  image: <Image boxSize='28px' src='/resources/casino/CHIP_14.png' alt={CASINO_COIN_NAME} />
}

export default BaseBetAmountPicker;