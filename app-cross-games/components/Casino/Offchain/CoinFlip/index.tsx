import { useMemo, useState } from 'react'
import shallow from 'zustand/shallow'

import { Flex } from '@chakra-ui/react'

import ContractTitle from '#/components/_/ContractTitle'
import { GAMES_ICONS } from '#/components/Casino'
import { GamePlateau } from '#/components/Casino/_/base'
import { Coin, coinBetOutcomeDisplayer, CoinBetSelection } from '#/components/Casino/_/Coinflip'
import { CasinoAuthReminderPopup } from '#/components/Casino/Offchain/_/CasinoAuth'
import { GameChipsAmountPicker } from '#/components/Casino/Offchain/_/ChipsAmountPicker'
import ChipsBalance from '#/components/Casino/Offchain/_/ChipsBalance'
import ChipsBetButton from '#/components/Casino/Offchain/_/ChipsBetButton'
import { APIBetHistoryDisplayer } from '#/components/Casino/Offchain/_/ChipsBetHistoryDisplayer'
import NoChipsPopup from '#/components/Casino/Offchain/_/NoChipsPopup'
import GamesStatsTab from '#/components/Casino/Stats'
import { useNWStore } from '#/lib/store/main'
import type { CoinBet } from '#/lib/store/slices/_/bet'
import { isAPICasinoBetRunning } from '#/lib/store/slices/popup-tx/runners/api'

//
const ChipsCoinFlip = () => {
  //
  const {
    allChipsBalance,
    chipsCoinFlipHistory,
    casinoAuthSignature,
    running,
    doChipsCoinBet
  } = useNWStore(s => ({
    allChipsBalance: s.allChipsBalance,
    chipsCoinFlipHistory: s.chipsCoinFlipHistory,
    casinoAuthSignature: s.casinoAuthSignature,
    running: isAPICasinoBetRunning(s.currentPopupTx),
    doChipsCoinBet: s.doChipsCoinBet
  }), shallow)

  //
  const [bet, defineBet] = useState<CoinBet>(null)

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
        <ContractTitle icon={GAMES_ICONS.coinflip} isPaused={!hasBalance} title='COIN FLIP' />
      }

      stats={
        <GamesStatsTab game='coinflip'/>
      }

      left={
        <>
          <CoinBetSelection canBet={hasBalance} bet={bet} setBet={defineBet} />
          <Flex
            direction='column'
            opacity={bet == null ? '.25' : '1'}
            pointerEvents={bet == null ? 'none' : 'all'}
          >
            <GameChipsAmountPicker value={betAmount} chipsSetter={defineBetAmount} />
            {casinoAuthSignature != null && <ChipsBalance />}
            <ChipsBetButton
              multiplicator={bet != null ? 2 : null}
              bet={betAmount}
              btnName='FLIP!'
              running={running}
              onClick={() => doChipsCoinBet(betAmount, bet)}
              isDisabled={cantBet}
            />
          </Flex>
        </>
      }

      leftDisabled={betPrevented}

      right={
        <>
          <APIBetHistoryDisplayer
            history={chipsCoinFlipHistory}
            outcomeDisplayer={coinBetOutcomeDisplayer}
          />
          <Flex flex='1' alignItems="center" justifyContent='center'>
            <Coin history={chipsCoinFlipHistory} />
          </Flex>
        </>
      }
    />
  )
}

export default ChipsCoinFlip;