import { OnChainBet, OnChainBetHistoryStore } from 'lib/store/slices/table-games/user-context'
import { SEPRunState } from 'lib/SingleExecPromise'
import { formatEtherFixed } from 'lib/BigNumberFormatters'
import { AnyBet } from 'lib/store/slices/_/bet'
import { OutcomeDisplayerFunc } from 'components/Casino/_/base'
import { BLOCKCHAIN_CURRENCY_NAME } from 'env/defaults'
import { BaseBetDisplayer, BaseBetHistoryDisplayer } from 'components/Casino/_/BaseBetHistoryDisplayer'

export function OnChainBetHistoryDisplayer<BetType> (props: {
    historyStore: OnChainBetHistoryStore<BetType>,
    onLoading: SEPRunState,
    outcomeDisplayer: OutcomeDisplayerFunc<BetType>
}) {
  return <BaseBetHistoryDisplayer
    history={props.historyStore.history}
    onLoading={props.onLoading}
    outcomeDisplayer={props.outcomeDisplayer}
    betEntryDisplayer={(v, i) =>
      <OnChainBetDisplayer
        key={i}
        bet={v}
        currentStamp={props.historyStore.updateStamp}
        outcomeDisplayer={props.outcomeDisplayer}
      />
    }
  />
}

function OnChainBetDisplayer<T = AnyBet> (props: {
    bet: OnChainBet<T>,
    currentStamp: number,
    outcomeDisplayer: OutcomeDisplayerFunc<T>
}) {
  //
  return (
    <BaseBetDisplayer
      bet={props.bet}
      currentStamp={props.currentStamp}
      outcomeDisplayer={props.outcomeDisplayer}
      amountDisplayer={amount => formatEtherFixed(amount, 3) + ' ' + BLOCKCHAIN_CURRENCY_NAME}
      elapsedStampDisplayer={(current, bet) => {
        const diff = current - bet
        if (diff < 1) return null
        return diff + ' block(s) ago'
      }}
    />
  )
}
