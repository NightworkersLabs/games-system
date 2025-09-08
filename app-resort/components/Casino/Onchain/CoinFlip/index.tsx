import { Flex } from '@chakra-ui/react'
import ContractTitle from 'components/_/ContractTitle'
import AutoUpdateTracker from 'components/_/AutoUpdateTracker'
import { useEffect, useMemo } from 'react'
import { useNWStore } from 'lib/store/main'
import shallow from 'zustand/shallow'
import BetAmountPicker from '../_/BetAmountPicker'
import BetButton from '../_/BetButton'
import { OnChainBetHistoryDisplayer } from '../_/BetHistoryDisplayer'
import TableGamesAvailability from '../_/TableGamesAvailability'

import { Coin, coinBetOutcomeDisplayer, CoinBetSelection } from 'components/Casino/_/Coinflip'
import { GamePlateau } from 'components/Casino/_/base'
import { faCoins } from '@fortawesome/free-solid-svg-icons'

//
export default function CoinFlip () {
  //
  const {
    tgAllowsBet,
    coinBet,
    updateTableGamesContext$,
    updateCoinflipHistory$,
    areTableGamesPaused,
    coinBetAmount,
    tgBasePtsTaxOnWin,
    coinflipHistoryStore,
    updateCoinflipHistoryRS,
    defineCoinBet,
    defineCoinBetAmount,
    secureCoinBet
  } = useNWStore(s => ({
    tgAllowsBet: s.tgAllowsBet,
    coinBet: s.coinBet,
    updateTableGamesContext$: s.updateTableGamesContext$,
    updateCoinflipHistory$: s.updateCoinflipHistory$,
    areTableGamesPaused: s.areTableGamesPaused,
    coinBetAmount: s.coinBetAmount,
    tgBasePtsTaxOnWin: s.tgBasePtsTaxOnWin,
    coinflipHistoryStore: s.coinflipHistoryStore,
    updateCoinflipHistoryRS: s.updateCoinflipHistoryRS,
    defineCoinBet: s.defineCoinBet,
    defineCoinBetAmount: s.defineCoinBetAmount,
    secureCoinBet: s.secureCoinBet
  }), shallow)

  //
  useEffect(() => {
    updateCoinflipHistory$.raise()
  }, [updateCoinflipHistory$, updateTableGamesContext$])

  //
  const cantBet = useMemo(() =>
    tgAllowsBet !== true || coinBet == null
  , [coinBet, tgAllowsBet])

  //
  return (
    <GamePlateau
      top={
        <Flex flex='1' gap='5' flexWrap='wrap' alignItems='center' justifyContent='space-around'>
          <Flex direction='column'>
            <ContractTitle icon={faCoins} isPaused={areTableGamesPaused} title='COIN FLIP' />
            <AutoUpdateTracker toCallPeriodically={updateTableGamesContext$} />
          </Flex>
          <TableGamesAvailability />
        </Flex>
      }

      left={
        <>
          <CoinBetSelection canBet={tgAllowsBet === true} bet={coinBet} setBet={defineCoinBet} />
          <Flex
            direction='column'
            opacity={coinBet == null ? '.25' : '1'}
            pointerEvents={coinBet == null ? 'none' : 'all'}
          >
            <BetAmountPicker value={coinBetAmount} amountSetter={defineCoinBetAmount} isDisabled={cantBet} />
            <BetButton
              basePtsTax={tgBasePtsTaxOnWin}
              multiplicator={coinBet != null ? 2 : null}
              bet={coinBetAmount}
              btnName="FLIP!"
              onClick={secureCoinBet}
              isDisabled={cantBet}
            />
          </Flex>
        </>
      }

      leftDisabled={tgAllowsBet !== true ? <Flex fontSize='.7rem' mt='2'>{tgAllowsBet}</Flex> : null}

      right={
        <>
          <OnChainBetHistoryDisplayer
            historyStore={coinflipHistoryStore}
            onLoading={updateCoinflipHistoryRS}
            outcomeDisplayer={coinBetOutcomeDisplayer}
          />
          <Flex flex='1' alignItems="center" justifyContent='center'>
            <Coin history={coinflipHistoryStore.history} />
          </Flex>
        </>
      }
    />
  )
}
