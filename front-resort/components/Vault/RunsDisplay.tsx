import { Flex, Text, Tooltip } from '@chakra-ui/react'
import { faCaretLeft, faCaretRight } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useMemo, useState } from 'react'
import { useNWStore } from 'lib/store/main'
import { BRRun } from 'lib/store/slices/vault/user-context'
import RunDescriptor from './RunDescriptor'

enum RunTimePeriod {
    Past,
    Present,
    Future
}

interface RunWithPeriod {
    run: BRRun
    period: RunTimePeriod
}

const getTimePeriodDescr = (rwp: RunWithPeriod) => {
  switch (rwp.period) {
  case RunTimePeriod.Past:
    return 'Past Round'
  case RunTimePeriod.Present:
    return 'Ongoing Round'
  case RunTimePeriod.Future:
    return 'Upcoming Round'
  }
}
const roundSorter = (a: BRRun, b: BRRun) => a.round.diesAt.getTime() - b.round.diesAt.getTime()
const getRoundPeriod = (run: BRRun, now: Date) : RunTimePeriod => {
  if (run.round.diesAt < now) return RunTimePeriod.Past
  else if (run.round.startsAt > now) return RunTimePeriod.Future
  return RunTimePeriod.Present
}

//
export default function RunsDisplay () {
  //
  const scheduledBRRuns = useNWStore(s => s.scheduledBRRuns)

  //
  const orderedRuns = useMemo(() => {
    //
    const now = new Date()

    //
    const results : RunWithPeriod[] = scheduledBRRuns == null
      ? []
      : scheduledBRRuns
        .slice()
        .sort(roundSorter)
        .map(run => ({
          run,
          period: getRoundPeriod(run, now)
        }))

    // if we must add a round filler
    const mustFill = results.length === 0 || results.every(x => x.period === RunTimePeriod.Past)

    // always push last in array if filling
    if (mustFill) {
      results.push({
        period: RunTimePeriod.Future,
        run: null
      })
    }

    //
    return results
    //
  }, [scheduledBRRuns])

  //
  const defaultIndex = useMemo(() => {
    // consider first present or future round as most interesting round
    const found = orderedRuns
      .findIndex(x =>
        x.period === RunTimePeriod.Present ||
                x.period === RunTimePeriod.Future
      )
    //
    return found === -1 ? 0 : found
    //
  }, [orderedRuns])

  //
  const [roundIndex, setRoundIndex] = useState(defaultIndex)

  //
  const effectiveRoundIndex = useMemo(() => {
    if (roundIndex >= orderedRuns.length) {
      return orderedRuns.length - 1
    }
    return roundIndex
  }, [orderedRuns.length, roundIndex])

  //
  const displayedRun = useMemo(() =>
    orderedRuns[effectiveRoundIndex]
  , [orderedRuns, effectiveRoundIndex])

  //
  const canPrevious = useMemo(() => effectiveRoundIndex > 0, [effectiveRoundIndex])

  //
  const canNext = useMemo(() =>
    effectiveRoundIndex < (orderedRuns.length - 1)
  , [orderedRuns.length, effectiveRoundIndex])

  //
  return (
    <Flex direction='column' gap='2' flexWrap='nowrap' position='relative'>
      <Flex boxShadow='0px 0px 9px 3px #00000099' direction='column' gap='2' backgroundColor='#35023c' p='5' mb='2' borderRadius='10px' minH='400px'>
        <Text p='2' className='pixelFont'>{getTimePeriodDescr(displayedRun)}</Text>
        {displayedRun.run == null
          ? <NoRun />
          : <RunDescriptor run={displayedRun.run} />
        }
      </Flex>
      {canPrevious &&
                <Tooltip hasArrow label='Previous Round'>
                  <Flex
                    position='absolute'
                    top='45%'
                    onClick={() => setRoundIndex(effectiveRoundIndex - 1)}
                    direction='column'
                    left='-1.5rem'
                    _hover={{ cursor: 'pointer' }}
                  >
                    <FontAwesomeIcon size='2x' icon={faCaretLeft} />
                  </Flex>
                </Tooltip>
      }
      {canNext &&
                <Tooltip hasArrow label='Next Round'>
                  <Flex
                    position='absolute'
                    right='-1.5rem'
                    top='45%'
                    onClick={() => setRoundIndex(effectiveRoundIndex + 1)}
                    direction='column'
                    _hover={{ cursor: 'pointer' }}
                  >
                    <FontAwesomeIcon size='2x' icon={faCaretRight} />
                  </Flex>
                </Tooltip>
      }
    </Flex>
  )
}

//
function NoRun () {
  return (
    <Flex direction='column' flex='1' justifyContent='center' alignItems='center' fontSize='.8rem'>
      <Text>No round</Text>
      <Text>scheduled yet.</Text>
    </Flex>
  )
}
