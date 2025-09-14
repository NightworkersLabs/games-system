import { useMemo, useState } from 'react'
import shallow from 'zustand/shallow'

import { Flex } from '@chakra-ui/react'

import ContractTitle from '#/src/components/_/ContractTitle'
import { GAMES_ICONS } from '#/src/components/Casino'
import { GamePlateau } from '#/src/components/Casino/_/base'
import { greenMultiplicator, rouletteBetOutcomeDisplayer, RouletteColorPicker, RouletteWheel } from '#/src/components/Casino/_/Roulette'
import { CasinoAuthReminderPopup } from '#/src/components/Casino/Offchain/_/CasinoAuth'
import { GameChipsAmountPicker } from '#/src/components/Casino/Offchain/_/ChipsAmountPicker'
import ChipsBalance from '#/src/components/Casino/Offchain/_/ChipsBalance'
import ChipsBetButton from '#/src/components/Casino/Offchain/_/ChipsBetButton'
import { APIBetHistoryDisplayer } from '#/src/components/Casino/Offchain/_/ChipsBetHistoryDisplayer'
import NoChipsPopup from '#/src/components/Casino/Offchain/_/NoChipsPopup'
import GamesStatsTab from '#/src/components/Casino/Stats'
import { useNWStore } from '#/src/lib/store/main'
import { ColorBet } from '#/src/lib/store/slices/_/bet'
import { isAPICasinoBetRunning } from '#/src/lib/store/slices/popup-tx/runners/api'

//
const ChipsRoulette = () => {
  //
  const {
    allChipsBalance,
    chipsRouletteHistory,
    casinoAuthSignature,
    running,
    doChipsRouletteBet
  } = useNWStore(s => ({
    allChipsBalance: s.allChipsBalance,
    chipsRouletteHistory: s.chipsRouletteHistory,
    casinoAuthSignature: s.casinoAuthSignature,
    running: isAPICasinoBetRunning(s.currentPopupTx),
    doChipsRouletteBet: s.doChipsRouletteBet
  }), shallow)

  //
  const [bet, defineBet] = useState<ColorBet>(null)

  //
  const [betAmount, defineBetAmount] = useState<number>(1)

  //
  const hasBalance = useMemo(() => allChipsBalance > 0, [allChipsBalance])

  //
  const betPrevented = useMemo(() => {
    if (casinoAuthSignature == null) return <CasinoAuthReminderPopup />
    if (!hasBalance) return <NoChipsPopup />
    return null
  }, [casinoAuthSignature, hasBalance])

  //
  const cantBet = useMemo(() =>
    betPrevented != null || bet == null || betAmount > allChipsBalance
  , [betPrevented, bet, betAmount, allChipsBalance])

  //
  return (
    <GamePlateau
      top={
        <ContractTitle icon={GAMES_ICONS.roulette} isPaused={!hasBalance} title='ROULETTE' />
      }

      stats={
        <GamesStatsTab game='roulette'/>
      }

      left={
        <>
          <RouletteColorPicker canBet={hasBalance} bet={bet} setBet={defineBet} />
          <Flex
            direction='column'
            opacity={bet == null ? '.25' : '1'}
            pointerEvents={bet == null ? 'none' : 'all'}
          >
            <GameChipsAmountPicker value={betAmount} chipsSetter={defineBetAmount} />
            {casinoAuthSignature != null && <ChipsBalance />}
            <ChipsBetButton
              multiplicator={bet == null ? null : (bet === ColorBet.Green ? greenMultiplicator : 2)}
              bet={betAmount}
              btnName='SPIN!'
              running={running}
              onClick={() => doChipsRouletteBet(betAmount, bet)}
              isDisabled={cantBet}
            />
          </Flex>
        </>
      }

      leftDisabled={betPrevented}

      right={
        <>
          <APIBetHistoryDisplayer
            history={chipsRouletteHistory}
            outcomeDisplayer={rouletteBetOutcomeDisplayer}
          />
          <RouletteWheel history={chipsRouletteHistory} />
        </>
      }
    />
  )
}

export default ChipsRoulette;