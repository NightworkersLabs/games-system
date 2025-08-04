import { formatEtherFixed } from 'lib/BigNumberFormatters'
import { BLOCKCHAIN_CURRENCY_NAME } from 'env/defaults'
import { BigNumber } from 'ethers'
import { parseEther } from 'ethers/lib/utils'
import { useNWStore } from 'lib/store/main'
import shallow from 'zustand/shallow'
import BaseBetAmountPicker from 'components/Casino/_/BaseBetAmountPicker'
import { Image } from '@chakra-ui/react'

//
export default function BetAmountPicker (props: {
    amountSetter: (n: BigNumber) => void,
    value: BigNumber,
    isDisabled: boolean
}) {
  //
  const {
    currencyMaxBet,
    currencyMinBet
  } = useNWStore(s => ({
    currencyMaxBet: s.currencyMaxBet,
    currencyMinBet: s.currencyMinBet
  }), shallow)

  //
  return (
    <BaseBetAmountPicker
      bet={props.value}
      betUpdater={props.amountSetter}
      isDisabled={props.isDisabled}
      betTick={parseEther('0.05')}
      minBet={currencyMinBet}
      maxBet={currencyMaxBet}
      image={<Image boxSize='32px' alt={BLOCKCHAIN_CURRENCY_NAME} src='resources/icons/bc.svg' />}
      //
      betIncreaser={(tick, max) => {
        const increased = props.value.add(tick)
        if (increased.gt(max)) return
        props.amountSetter(increased)
      }}
      betDecreaser={(tick, min) => {
        const decreased = props.value.sub(tick)
        if (decreased.lt(min)) return
        props.amountSetter(decreased)
      }}
      safeMaxResolver={(min, max) => min.gt(max) ? min : max}
      betDisplayer={bet => formatEtherFixed(bet) + ' ' + BLOCKCHAIN_CURRENCY_NAME}
    />
  )
}
