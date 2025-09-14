import type { OutcomeDisplayerFunc } from '#/src/components/Casino/_/base'
import { BaseBetDisplayer, BaseBetHistoryDisplayer } from '#/src/components/Casino/_/BaseBetHistoryDisplayer'
import { CASINO_COIN_NAME } from '#/src/consts'
import type { AnyBet } from '#/src/lib/store/slices/_/bet'
import type { APIBetEntry } from '#/src/lib/store/slices/casino-api/user-context'

export const APIBetHistoryDisplayer = <BetType extends AnyBet,> (props: {
    history: APIBetEntry<BetType>[],
    outcomeDisplayer: OutcomeDisplayerFunc<BetType>
}) => {
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

const APIBetDisplayer = <T extends AnyBet> (props: {
    bet: APIBetEntry<T>,
    currentStamp: Date,
    outcomeDisplayer: OutcomeDisplayerFunc<T>
}) => {
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
