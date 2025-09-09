import { BigNumber } from 'ethers'
import type { ReactElement} from 'react';
import { useMemo, useRef } from 'react'

import { Flex, Grid, Link, Spinner, Text, useDisclosure } from '@chakra-ui/react'

import type { BetTagDecorator, OutcomeDisplayerFunc } from '#/components/Casino/_/base'
import type { SEPRunState } from '#/lib/SingleExecPromise'
import type { AnyBet, AnyBettedCurrencyType, AnyStampType, BetEntry } from '#/lib/store/slices/_/bet'

//
export const BaseBetHistoryDisplayer = <T extends AnyBet, C = AnyBettedCurrencyType, S = AnyStampType, EntryType = BetEntry<T, C, S>> (props: {
  history: EntryType[]
  onLoading: SEPRunState
  betEntryDisplayer: (entry: EntryType, index: number) => ReactElement
  outcomeDisplayer?: OutcomeDisplayerFunc<T>
  singleRowSizePx?: number
  maximumExpandedRows?: number
}) => {
  //
  const { isOpen, onToggle } = useDisclosure({
    onClose: () => {
      scrollableContentRef.current.scrollTop = 0
    }
  })
  const scrollableContentRef = useRef<HTMLDivElement>(null)

  //
  const maxExpendedHeight = useMemo(() =>
    (props.singleRowSizePx * Math.min(
      props.maximumExpandedRows, Math.max(
        props.history.length, 1
      )
    )) + 'px'
  , [props.history.length, props.maximumExpandedRows, props.singleRowSizePx])

  //
  const rowHeight = useMemo(() => props.singleRowSizePx + 'px', [props.singleRowSizePx])

  //
  return (
    <Flex className='bet-tracker' mb={rowHeight}>
      <Flex className='container' maxH={isOpen ? maxExpendedHeight : rowHeight} zIndex='50'>
        {props.onLoading === true &&
                    <Spinner size='xs' position='absolute' zIndex='100' right='.5rem' top='-.25rem' />
        }
        <Grid className='content' ref={scrollableContentRef}
          templateRows={rowHeight}
          autoRows={rowHeight}
          overflow={isOpen ? 'auto' : 'hidden'}
          backgroundColor={isOpen ? '#161616ba' : '#1f1f1f75'}
        >
          {props.history.length !== 0
            ? props.history
              .slice()
              .reverse()
              .map((v, i) => props.betEntryDisplayer(v, i))
            : <NoBetsAwaiter />
          }
        </Grid>
        {props.history.length > 1 &&
                    <Link
                      onClick={onToggle}
                      className='expander'
                    >{isOpen ? 'less' : (props.history.length - 1) + ' more'}</Link>
        }
      </Flex>
    </Flex>
  )
}

const NoBetsAwaiter = () => {
  return (
    <Flex gap='3' alignItems='center' fontSize='.75rem'>
      <Spinner size='sm'/>
      <Text>Awaiting bets...</Text>
    </Flex>
  )
}

BaseBetHistoryDisplayer.defaultProps = {
  singleRowSizePx: 35,
  maximumExpandedRows: 5,
  outcomeDisplayer: outcome => <Flex>{outcome}</Flex>
}

//
//
//

export const BaseBetDisplayer = <T, C, S> (props: {
    bet: BetEntry<T, C, S>,
    currentStamp: S,
    outcomeDisplayer: OutcomeDisplayerFunc<T>
    amountDisplayer: (amount: C) => string
    elapsedStampDisplayer: (current: S, bet: S) => string | null
}) => {
  //
  const expected = useMemo(() => props.outcomeDisplayer(props.bet.expectedOutcome), [props])

  //
  const settled = useMemo(() => props.outcomeDisplayer(props.bet.outcome), [props])

  //
  const hasLostBet = useMemo(() => {
    if (typeof props.bet.amountWon === 'number') {
      return props.bet.amountWon === 0
    } else if (props.bet.amountWon instanceof BigNumber) {
      return props.bet.amountWon.isZero()
    }
    return false
  }, [props.bet.amountWon])

  //
  const elapsed = useMemo(() => props.elapsedStampDisplayer(props.currentStamp, props.bet.stamp), [props])

  //
  return (
    <Flex gap='1' alignItems='center' justifyContent='center' mx='3'>
      {elapsed != null && <Text color='gray' textAlign='center' fontSize='.5rem'>{elapsed}</Text>}
      <Text fontSize='.75rem' fontWeight='bold' textAlign='center'>{props.amountDisplayer(props.bet.bettedAmount)}</Text>
      <BetTag decorator={expected} />
      <Text>:</Text>
      {props.bet.amountWon != null
        ? (<Flex gap='1' alignItems='center'>
          { hasLostBet
            ? <>
              <BetTag decorator={settled} />
              <Text fontSize='.75rem' fontWeight='bold' color='#c0b1b1'>(Lost)</Text>
            </>
            : <Text fontSize='.75rem' fontWeight='bold' color='#68d368' textAlign='center'>+{props.amountDisplayer(props.bet.amountWon)}</Text>
          }
        </Flex>)
        : (
          props.bet.hasFailed
            ? <Text fontSize='.75rem' color='red'>Failure, Refunded.</Text>
            : <Spinner size='sm' />
        )
      }
    </Flex>
  )
}

//
//
//

//
export const BetTag = (props: {
  decorator: BetTagDecorator
}) => {
  return (
    <Text
      px='1'
      py='1px'
      fontSize='.6rem'
      backgroundColor='white'
      color={props.decorator.color}
      fontWeight='bold'
      borderRadius='5px'
    >{props.decorator.descr}</Text>
  )
}
