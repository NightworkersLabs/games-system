import { VStack, Flex, Text } from '@chakra-ui/react'
import { BigNumber } from 'ethers'
import { BLOCKCHAIN_CURRENCY_NAME, NWERC20_NAME } from 'env/defaults'
import { useEffect, useMemo, useState } from 'react'
import { BRRun, ContextualizedBRStake } from 'lib/store/slices/vault/user-context'
import { formatEtherFixed } from 'lib/BigNumberFormatters'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChampagneGlasses, faGift } from '@fortawesome/free-solid-svg-icons'

enum RunState {
    Upcoming,
    Undergoing,
    ClaimPeriod
}

function getRunState (run: BRRun) {
  const now = new Date()

  //
  if (run == null || now >= run.round.diesAt || run.round.startsAt >= now) {
    return RunState.Upcoming
  }

  //
  if (now >= run.round.endsAt) {
    return RunState.ClaimPeriod
  }

  //
  return RunState.Undergoing
}

export default function RewardsCalculator (props: {
    contextualizedStake: ContextualizedBRStake
}) {
  //
  const [runState, setRunState] = useState(getRunState(props.contextualizedStake.run))

  //
  useEffect(() => {
    //
    const interval = setInterval(() => {
      setRunState(getRunState(props.contextualizedStake.run))
    }, 2_000)

    //
    return () => clearInterval(interval)
  }, [props.contextualizedStake.run])

  //
  return (
    <VStack p='2'>
      { runState === RunState.Upcoming &&
                <Flex direction='column' color='gray'>
                  <Text fontWeight='bold'>No rewards / estimates available for now.</Text>
                  <Text fontSize='.75rem'>Deposit {NWERC20_NAME} before the next round starts to maximize your gains !</Text>
                </Flex>
      }
      { runState !== RunState.Upcoming &&
                <RewardsDisplay
                  rState={runState}
                  contextualizedStake={props.contextualizedStake}
                />
      }
    </VStack>
  )
}

function RewardsDisplay (props: {
    rState: RunState
    contextualizedStake: ContextualizedBRStake
}) {
  //
  const hasClaimedThisRound = useMemo(() =>
    props.contextualizedStake.claimRoundId >= props.contextualizedStake.run.round.id
  , [props.contextualizedStake.claimRoundId, props.contextualizedStake.run.round.id])

  //
  const hasEstimate = useMemo(() =>
    props.contextualizedStake.sharesForRound.isZero() === false
  , [props.contextualizedStake.sharesForRound])

  //
  return (
    <Flex direction='column' alignItems='center'>
      {hasClaimedThisRound
        ? <Flex direction='column' gap='2'>
          <FontAwesomeIcon size='2x' icon={faChampagneGlasses} />
          <Flex>You already claimed your gains this round :3</Flex>
        </Flex>
        : (
          hasEstimate
            ? <RewardsEstimate
              rState={props.rState}
              contextualizedStake={props.contextualizedStake}
            />
            : <Flex>Cannot estimate gains... have you staked some {NWERC20_NAME} ?</Flex>
        )
      }
    </Flex>
  )
}

function RewardsEstimate (props: {
    rState: RunState
    contextualizedStake: ContextualizedBRStake
}) {
  //
  const isInClaimPeriod = useMemo(() =>
    props.rState === RunState.ClaimPeriod
  , [props.rState])

  //
  const [now, setNow] = useState(new Date())

  //
  useEffect(() => {
    //
    const interval = setInterval(() => {
      setNow(new Date())
    }, 2_000)

    //
    return () => clearInterval(interval)
  }, [])

  //
  const prcOfTotalShares = useMemo(() => {
    //
    const prc = props.contextualizedStake.sharesForRound
      .mul(10_000)
      .div(props.contextualizedStake.run.accountedRoundShares)

    //
    return prc.toNumber() / 10_000
    //
  }, [props.contextualizedStake.run.accountedRoundShares, props.contextualizedStake.sharesForRound])

  //
  const estimated = useMemo(() => {
    //
    const secsRelativeToStart = (now.getTime() - props.contextualizedStake.run.round.startsAt.getTime()) / 1_000

    // means we are before round started, no estimate
    if (secsRelativeToStart <= 0) {
      return BigNumber.from(0)
    }

    // if relative secs goes after duration of round ("> endsAt"), trim excess seconds
    const duration = secsRelativeToStart > props.contextualizedStake.run.round.duration
      ? props.contextualizedStake.run.round.duration
      : Math.ceil(secsRelativeToStart)

    //
    return props.contextualizedStake.sharesForRound
      .mul(duration)
      .mul(props.contextualizedStake.run.round.rewardsPerSecond)
      .div(props.contextualizedStake.run.accountedRoundShares)
    //
  }, [now, props.contextualizedStake.run.accountedRoundShares,
    props.contextualizedStake.run.round.duration,
    props.contextualizedStake.run.round.rewardsPerSecond,
    props.contextualizedStake.run.round.startsAt,
    props.contextualizedStake.sharesForRound])

  //
  return (
    <>
      <Flex fontSize='.8rem'>{ isInClaimPeriod ? 'You won' : 'Your estimated rewards' }</Flex>
      <Flex gap='1' fontSize='1.5rem'>
        <Flex fontWeight='bold'>{formatEtherFixed(estimated, 4)}</Flex>
        <Flex>{BLOCKCHAIN_CURRENCY_NAME}</Flex>
      </Flex>
      <Flex fontSize='.6rem' fontStyle='italic'>(Owning {prcOfTotalShares * 100} % of total shares)</Flex>
      { isInClaimPeriod &&
                    <Flex mt='5' gap='2' direction='column'>
                      <FontAwesomeIcon size='2x' icon={faGift} />
                      <Flex>Claim your gains now !</Flex>
                    </Flex>
      }
    </>
  )
}
