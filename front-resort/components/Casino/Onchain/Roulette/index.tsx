import { Flex } from '@chakra-ui/react'
import { useEffect, useMemo } from 'react'
import TableGamesAvailability from '../_/TableGamesAvailability'
import BetAmountPicker from '../_/BetAmountPicker'
import { useNWStore } from 'lib/store/main'
import shallow from 'zustand/shallow'
import AutoUpdateTracker from 'components/_/AutoUpdateTracker'
import ContractTitle from 'components/_/ContractTitle'
import BetButton from '../_/BetButton'
import { OnChainBetHistoryDisplayer } from '../_/BetHistoryDisplayer'
import { ColorBet } from 'lib/store/slices/_/bet'
import { RouletteColorPicker, rouletteBetOutcomeDisplayer, RouletteWheel } from 'components/Casino/_/Roulette'
import { GamePlateau } from 'components/Casino/_/base'
import { faDharmachakra } from '@fortawesome/free-solid-svg-icons'

//
export default function Roulette () {
  //
  const {
    rouletteBetAmount,
    updateTableGamesContext$,
    updateRouletteHistory$,
    tgAllowsBet,
    rouletteBet,
    areTableGamesPaused,
    tgBasePtsTaxOnWin,
    rouletteHistoryStore,
    updateRouletteHistoryRS,
    defineRouletteBet,
    defineRouletteBetAmount,
    secureRouletteBet
  } = useNWStore(s => ({
    rouletteBetAmount: s.rouletteBetAmount,
    updateTableGamesContext$: s.updateTableGamesContext$,
    updateRouletteHistory$: s.updateRouletteHistory$,
    rouletteBet: s.rouletteBet,
    tgAllowsBet: s.tgAllowsBet,
    areTableGamesPaused: s.areTableGamesPaused,
    tgBasePtsTaxOnWin: s.tgBasePtsTaxOnWin,
    rouletteHistoryStore: s.rouletteHistoryStore,
    updateRouletteHistoryRS: s.updateRouletteHistoryRS,
    defineRouletteBetAmount: s.defineRouletteBetAmount,
    defineRouletteBet: s.defineRouletteBet,
    secureRouletteBet: s.secureRouletteBet
  }), shallow)

  //
  const cantBet = useMemo(() =>
    tgAllowsBet !== true || rouletteBet == null
  , [rouletteBet, tgAllowsBet])

  //
  useEffect(() => {
    updateRouletteHistory$.raise()
  }, [updateTableGamesContext$, updateRouletteHistory$])

  //
  return (
    <GamePlateau
      top={
        <Flex flex='1' gap='5' flexWrap='wrap' alignItems='center' justifyContent='space-around'>
          <Flex direction='column'>
            <ContractTitle icon={faDharmachakra} isPaused={areTableGamesPaused} title='ROULETTE' />
            <AutoUpdateTracker toCallPeriodically={updateTableGamesContext$} />
          </Flex>
          <TableGamesAvailability />
        </Flex>
      }

      left={
        <>
          <RouletteColorPicker bet={rouletteBet} canBet={tgAllowsBet === true} setBet={defineRouletteBet} />
          <Flex
            direction='column'
            opacity={rouletteBet == null ? '.25' : '1'}
            pointerEvents={rouletteBet == null ? 'none' : 'all'}
          >
            <BetAmountPicker value={rouletteBetAmount} amountSetter={defineRouletteBetAmount} isDisabled={cantBet} />
            <BetButton
              basePtsTax={tgBasePtsTaxOnWin}
              multiplicator={rouletteBet == null ? null : (rouletteBet === ColorBet.Green ? 14 : 2)}
              bet={rouletteBetAmount}
              onClick={secureRouletteBet}
              isDisabled={cantBet}
              btnName="SPIN!"
            />
          </Flex>
        </>
      }

      leftDisabled={tgAllowsBet !== true ? <Flex fontSize='.7rem' mt='2'>{tgAllowsBet}</Flex> : null}

      right={
        <>
          <OnChainBetHistoryDisplayer
            historyStore={rouletteHistoryStore}
            onLoading={updateRouletteHistoryRS}
            outcomeDisplayer={rouletteBetOutcomeDisplayer}
          />
          <RouletteWheel history={rouletteHistoryStore.history} />
        </>
      }
    />
  )
}
