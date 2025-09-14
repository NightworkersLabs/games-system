import { useMemo } from 'react'
import shallow from 'zustand/shallow'

import { Button,Flex, Image, Text } from '@chakra-ui/react'

import { CASINO_COIN_NAME } from '#/src/consts'
import { useNWStore } from '#/src/lib/store/main'

const NoChipsPopup = () => {
  //
  const {
    maxChipsBuyableAtOnce,
    isCasinoBankUnpaused,
    userBalance,
    setCasinoTabIndex,
    getMaxChipsBuyableFromBalance
  } = useNWStore(s => ({
    maxChipsBuyableAtOnce: s.maxChipsBuyableAtOnce,
    isCasinoBankUnpaused: s.isCasinoBankUnpaused,
    userBalance: s.userBalance,
    setCasinoTabIndex: s.setCasinoTabIndex,
    getMaxChipsBuyableFromBalance: s.getMaxChipsBuyableFromBalance
  }), shallow)

  //
  const maxBuyable = useMemo(() =>
    Math.min(
      getMaxChipsBuyableFromBalance(userBalance),
      maxChipsBuyableAtOnce
    )
  , [getMaxChipsBuyableFromBalance, maxChipsBuyableAtOnce, userBalance])

  //
  const cannotAffordToBuy = useMemo(() => maxBuyable <= 0, [maxBuyable])

  //
  const isDisabled = useMemo(() =>
    !isCasinoBankUnpaused || cannotAffordToBuy,
  [cannotAffordToBuy, isCasinoBankUnpaused])

  //
  return (
    <Flex direction='column' fontSize='.8rem' textAlign='center' my='2'>
      <Flex whiteSpace='nowrap' justifyContent='center'>
        <Text>You have no</Text>
        <Image src='/resources/casino/CHIP_14.png' mx='1' alt={CASINO_COIN_NAME} />
        <Text>{CASINO_COIN_NAME}</Text>
        <Text>,</Text>
      </Flex>
      <Text whiteSpace='nowrap'>Please get some before playing.</Text>
      {isDisabled
        ? <Button mt='4' size='sm' onClick={() => setCasinoTabIndex(0)} gap='2'>
          <Text fontSize='.6rem'>Get some !</Text>
          <Image src='/resources/casino/CHIP_14.png' boxSize='.9em' mr='.25em' alt={CASINO_COIN_NAME} />
        </Button>
        : <BuyChipsQuickButtons maxChipsBuyable={maxBuyable} /> }
    </Flex>
  )
}

//
const BuyChipsQuickButtons = (props: { maxChipsBuyable: number }) => {
  //
  const buyChips = useNWStore(s => s.buyChips)

  //
  const availableRanges = useMemo(() => {
    return [10, 50, props.maxChipsBuyable]
      .filter((value, index, self) =>
        self.indexOf(value) === index && value <= props.maxChipsBuyable
      )
  }
  , [props.maxChipsBuyable])

  //
  return (
    <Flex alignSelf='center' mt='4' justifyContent='center' alignItems='center' gap='2' flexWrap='wrap'>
      { availableRanges.map((quantity, i) =>
        <Button key={i} size='sm' gap='1' onClick={() => buyChips(quantity)}>
          <Text fontSize='.4rem'>Buy</Text>
          <Text fontSize='.6rem'>{quantity}</Text>
          <Image src='/resources/casino/CHIP_14.png' boxSize='.9em' mr='.25em' alt={CASINO_COIN_NAME} />
        </Button>
      )}
    </Flex>
  )
}

export default NoChipsPopup;