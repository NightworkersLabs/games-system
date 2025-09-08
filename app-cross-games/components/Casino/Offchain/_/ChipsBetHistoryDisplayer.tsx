import { AnyBet } from 'lib/store/slices/_/bet'
import { OutcomeDisplayerFunc } from 'components/Casino/_/base'
import { CASINO_COIN_NAME } from 'env/defaults'
import { BaseBetDisplayer, BaseBetHistoryDisplayer } from 'components/Casino/_/BaseBetHistoryDisplayer'
import { APIBetEntry } from 'lib/store/slices/casino-api/user-context'

export function APIBetHistoryDisplayer<BetType> (props: {
    history: APIBetEntry<BetType>[],
    outcomeDisplayer: OutcomeDisplayerFunc<BetType>
}) {
  return <BaseBetHistoryDisplayer
    history={props.history}
    onLoading={false} /** never loading nor failing history fetching, since it is local-only */
    outcomeDisplayer={props.outcomeDisplayer}
    betEntryDisplayer={(v, i) =>
      <APIBetDisplayer
        key={i}
        bet={v}
        currentStamp={new Date()}
        outcomeDisplayer={props.outcomeDisplayer}
      />
    }
  />
}

function APIBetDisplayer<T = AnyBet> (props: {
    bet: APIBetEntry<T>,
    currentStamp: Date,
    outcomeDisplayer: OutcomeDisplayerFunc<T>
}) {
  //
  return (
    <BaseBetDisplayer
      bet={props.bet}
      currentStamp={props.currentStamp}
      outcomeDisplayer={props.outcomeDisplayer}
      amountDisplayer={amount => amount + ' ' + CASINO_COIN_NAME}
      elapsedStampDisplayer={(current, bet) => {
        return bet.toLocaleString()
      }}
    />
  )
}
