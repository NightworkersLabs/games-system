import { useMemo } from 'react'

import BaseBetAmountPicker from '#/components/Casino/_/BaseBetAmountPicker'
import { CASINO_COIN_NAME } from '#/env/defaults'
import { useNWStore } from '#/lib/store/main'

export const GameChipsAmountPicker = (props: {
    chipsSetter: (n: number) => void,
    value: number
}) => {
  //
  const {
    maxChipsPerBet,
    allChipsBalance
  } = useNWStore(s => ({
    maxChipsPerBet: s.maxChipsPerBet,
    allChipsBalance: s.allChipsBalance
  }))

  //
  const computedMax = useMemo(() =>
    Math.min(maxChipsPerBet, allChipsBalance ?? 0)
  , [maxChipsPerBet, allChipsBalance])

  //
  return <BaseChipsAmountPicker chipsSetter={props.chipsSetter} value={props.value} max={computedMax} />
}

//
export const BaseChipsAmountPicker = (props: {
    chipsSetter: (n: number) => void,
    value: number,
    max: number,
    subtitle?: string
    isDisabled?: boolean
}) => {
  //
  return (
    <BaseBetAmountPicker
      subtitle={props.subtitle}
      bet={props.value}
      betUpdater={props.chipsSetter}
      isDisabled={props.isDisabled}
      betTick={1}
      minBet={1}
      maxBet={props.max}
      //
      betIncreaser={(tick, max) => {
        const increased = props.value + tick
        if (increased > max) return
        props.chipsSetter(increased)
      }}
      betDecreaser={(tick, min) => {
        const decreased = props.value - tick
        if (decreased < min) return
        props.chipsSetter(decreased)
      }}
      safeMaxResolver={(min, max) => Math.max(min, max)}
      betDisplayer={bet => bet + ' ' + CASINO_COIN_NAME}
    />
  )
}
