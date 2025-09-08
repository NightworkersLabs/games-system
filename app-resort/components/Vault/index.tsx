import { Flex, HStack, VStack } from '@chakra-ui/react'
import { faFileContract, faVault } from '@fortawesome/free-solid-svg-icons'
import AutoUpdateTracker from 'components/_/AutoUpdateTracker'
import { formatEtherFixed } from 'lib/BigNumberFormatters'
import { BLOCKCHAIN_CURRENCY_NAME, getBackroomContractAddress, NWERC20_NAME } from 'env/defaults'
import { useMemo } from 'react'
import { useNWStore } from 'lib/store/main'
import shallow from 'zustand/shallow'

import { HUDButton } from 'components/App/HUD'
import ContractTitle from 'components/_/ContractTitle'
import VaultWithdrawer from './VaultWithdrawer'
import VaultStaker from './VaultStaker'
import RunsDisplay from './RunsDisplay'
import { BetBox } from 'components/Casino/_/base'
import { ContextualizedBRStake, contextualizeStake } from 'lib/store/slices/vault/user-context'
import RewardsCalculator from './RewardsCalculator'

//
export default function Vault () {
  //
  const {
    updateBackroomContext$,
    scheduledBRRuns,
    backroomStake,
    getContractExplorerUrl
  } = useNWStore(s => ({
    updateBackroomContext$: s.updateBackroomContext$,
    scheduledBRRuns: s.scheduledBRRuns,
    backroomStake: s.backroomStake,
    getContractExplorerUrl: s.getContractExplorerUrl
  }), shallow)

  // get the current run, eg. not dead yet
  const latestLivingRun = useMemo(() => {
    //
    const now = new Date()

    //
    return scheduledBRRuns?.find(({ round }) => round.diesAt > now)
    //
  }, [scheduledBRRuns])

  //
  const contextualizedStake = useMemo(() =>
    contextualizeStake(backroomStake, latestLivingRun)
  , [backroomStake, latestLivingRun])

  //
  return (
    <VStack mb='10'>
      <HStack justifyContent='space-evenly' w='100%' p='5' mb='5'>
        <Flex direction='column' alignItems='stretch' justifyContent='center'>
          <ContractTitle icon={faVault} isPaused={latestLivingRun == null} title='Vault' />
          <AutoUpdateTracker toCallPeriodically={updateBackroomContext$} />
        </Flex>
        <HUDButton name='CONTRACT' icon={faFileContract} href={ getContractExplorerUrl(getBackroomContractAddress()) } />
      </HStack>
      <HStack gap='5' alignItems='stretch' flexWrap='wrap'>
        <Flex flex='5' justifyContent='center'>
          <RunsDisplay />
        </Flex>
        <VStack justifyContent='space-between' alignItems='stretch' flex='10'>
          <LOLLYStakedTracker />
          <RewardsCalculator contextualizedStake={contextualizedStake} />
          <VaultButtons contextualizedStake={contextualizedStake} />
        </VStack>
      </HStack>
    </VStack>
  )
}

//
function VaultButtons (props: {
    contextualizedStake: ContextualizedBRStake
}) {
  //
  const hasClaimableRewards = useMemo(() => {
    //
    if (props.contextualizedStake.run == null) return false

    //
    const now = new Date()

    //
    const isClaimPeriod = now > props.contextualizedStake.run.round.endsAt && now <= props.contextualizedStake.run.round.diesAt
    const hasSharesAccumulated = props.contextualizedStake.sharesForRound.isZero() === false

    //
    return isClaimPeriod && hasSharesAccumulated
    //
  }, [props.contextualizedStake.run, props.contextualizedStake.sharesForRound])

  //
  const isWithdrawPeriod = useMemo(() => {
    // if no latest living run, means we can withdraw
    if (props.contextualizedStake.run == null) return true

    // else, make sure that current round has at least ended
    const now = new Date()

    // we can withdraw / claim if latest has not started yet, or if it already ended / died
    return now > props.contextualizedStake.run.round.endsAt || now < props.contextualizedStake.run.round.startsAt
    //
  }, [props.contextualizedStake.run])

  //
  return (
    <Flex gap='1'>
      <BetBox subtitle={'Storing ' + NWERC20_NAME}>
        <VaultStaker
          hasClaimableRewards={hasClaimableRewards}
          isWithdrawPeriod={isWithdrawPeriod}
        />
      </BetBox>
      <BetBox subtitle={'Withdrawing (' + BLOCKCHAIN_CURRENCY_NAME + '/' + NWERC20_NAME + ')'}>
        <VaultWithdrawer
          hasClaimableRewards={hasClaimableRewards}
          isWithdrawPeriod={isWithdrawPeriod}
        />
      </BetBox>
    </Flex>
  )
}

//
function LOLLYStakedTracker () {
  const {
    totalStakedOnVault,
    myStake
  } = useNWStore(s => ({
    totalStakedOnVault: s.totalStakedOnVault,
    myStake: s.backroomStake.staked
  }), shallow)

  //
  return (
    <HStack justifyContent='space-around' backgroundColor='#16161685' p='2' borderRadius="15px">
      <Flex alignItems='center' direction='column' fontSize='.85rem'>
        <Flex className='pixelFont'>You stored</Flex>
        <Flex gap='1'>
          <Flex fontWeight='bold'>{formatEtherFixed(myStake)}</Flex>
          <Flex>{NWERC20_NAME}</Flex>
        </Flex>
      </Flex>
      <Flex alignItems='center' direction='column' fontSize='.75rem'>
        <Flex className='pixelFont'>...Of</Flex>
        <Flex gap='1'>
          <Flex fontWeight='bold'>{formatEtherFixed(totalStakedOnVault)}</Flex>
          <Flex>{NWERC20_NAME}</Flex>
        </Flex>
      </Flex>
    </HStack>
  )
}
