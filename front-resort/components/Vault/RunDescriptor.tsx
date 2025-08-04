import { VStack, Flex, Tooltip, Text, Divider } from '@chakra-ui/react'
import { BLOCKCHAIN_CURRENCY_NAME, NWERC20_NAME } from 'env/defaults'
import { formatEtherFixed, toCurrency } from 'lib/BigNumberFormatters'

import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime' // import plugin
import { useMemo } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircleQuestion } from '@fortawesome/free-solid-svg-icons'
import { BRRun } from 'lib/store/slices/vault/user-context'
dayjs.extend(relativeTime) // use plugin

export default function RunDescriptor (props: {
    run: BRRun
}) {
  //
  return (
    <Flex direction='column' gap='1'>
      <Flex flex='1' alignItems='center' justifyContent='center' className='pixelFont' color='#e26eff'>n°{props.run.round.id}</Flex>
      <VStack className='pinkBorder' backgroundColor='#6619689e' p='3' borderRadius="15px" alignItems='stretch'>
        <DateDescriptor
          date={props.run.round.startsAt}
          labels={['Started', 'Starts']}
          helpDescr={`When your staked ${NWERC20_NAME} starts to be accounted for reward calculations. You cannot withdraw anymore, but any subsequent deposit will be accounted.`}
        />
        <DateDescriptor
          date={props.run.round.endsAt}
          labels={['Ended', 'Ends']}
          helpDescr={'Point in time at which your reward can be settled : the first claimer will settle the rewards for all participants. If you won something, you need to claim before depositing again.'}
        />
        <DateDescriptor
          date={props.run.round.diesAt}
          labels={['Died', 'Dies']}
          helpDescr={'Point in time at which a new round can be scheduled. If you have not claimed this round rewards after that point, they are lost forever.'}
        />
        <Divider />
        <RoundRewardsDescriptor run={props.run} />
        <Divider />
        <Flex direction='column' gap='1' flex='1' justifyContent='space-between' alignItems='center'>
          <Tooltip hasArrow label='Amount that will be used for computing rewards per share. It is settled by the first claimer once the round has ended.'>
            <Flex gap='1' flexWrap='nowrap'>
              <Text fontSize='.8rem'>Finally staked</Text>
              <FontAwesomeIcon icon={faCircleQuestion} color='grey' size='xs' />
            </Flex>
          </Tooltip>
          <Flex gap='1' alignItems='center' direction='column'>
            <Flex fontWeight='bold'>{toCurrency(props.run.totalStakedAtEnd)}</Flex>
            <Flex fontSize='.5rem'>{NWERC20_NAME}</Flex>
          </Flex>
        </Flex>
      </VStack>
    </Flex>
  )
}

//
function DateDescriptor (props: {
    labels: [string, string],
    helpDescr: string,
    date: Date
}) {
  //
  const fDate = useMemo(() => dayjs(props.date), [props.date])

  //
  const isThen = useMemo(() => fDate.isBefore(new Date()), [fDate])

  //
  return (
    <Flex flex='1' gap='10' alignItems='center' justifyContent='space-between'>
      <Tooltip hasArrow label={props.helpDescr}>
        <Flex gap='1' flexWrap='nowrap'>
          <Text>{props.labels[isThen ? 0 : 1]}</Text>
          <FontAwesomeIcon icon={faCircleQuestion} color='grey' size='xs' />
        </Flex>
      </Tooltip>
      <Tooltip hasArrow label={props.date.toLocaleString()}>
        <Flex fontWeight='bold' fontSize='.75rem' flexWrap='nowrap'>{fDate.fromNow()}</Flex>
      </Tooltip>
    </Flex>
  )
}

function RoundRewardsDescriptor (props: {
    run: BRRun
}) {
  //
  const remainingRewards = useMemo(() => {
    //
    const now = new Date()
    if (now > props.run.round.endsAt) return 0
    if (now < props.run.round.startsAt) return props.run.round.toDistribute

    //
    const diff = (now.getTime() - props.run.round.startsAt.getTime()) / 1_000
    const remainingSecs = props.run.round.duration - Math.ceil(diff)

    //
    //
    return props.run.round.toDistribute
      .mul(remainingSecs)
      .div(props.run.round.duration)
    //
  }, [props.run.round.duration, props.run.round.endsAt, props.run.round.startsAt, props.run.round.toDistribute])

  //
  return (
    <>
      <Flex direction='column' gap='1' flex='1' justifyContent='space-between' alignItems='center'>
        <Tooltip hasArrow label='Rate at which rewards are distributed for all partakers to share'>
          <Flex gap='1' flexWrap='nowrap'>
            <Text fontSize='.8rem'>Distribution rate</Text>
            <FontAwesomeIcon icon={faCircleQuestion} color='grey' size='xs' />
          </Flex>
        </Tooltip>
        <Flex gap='1' alignItems='center'>
          <Flex fontWeight='bold'>{formatEtherFixed(props.run.round.rewardsPerSecond, 4)}</Flex>
          <Flex flexWrap='nowrap' fontSize='.5rem'>{BLOCKCHAIN_CURRENCY_NAME} / s</Flex>
        </Flex>
      </Flex>
      <Flex gap='1' flex='1' justifyContent='space-between' alignItems='center'>
        <Flex direction='column' lineHeight='1.1'>
          <Flex fontSize='.5rem'>Rewards</Flex>
          <Flex fontSize='.8rem'>Total</Flex>
        </Flex>
        <Flex gap='1' alignItems='center'>
          <Flex fontWeight='bold'>{toCurrency(props.run.round.toDistribute)}</Flex>
          <Flex fontSize='.6rem'>{BLOCKCHAIN_CURRENCY_NAME}</Flex>
        </Flex>
      </Flex>
      <Flex gap='1' flex='1' justifyContent='space-between' alignItems='center'>
        <Flex direction='column' lineHeight='1.1'>
          <Flex fontSize='.5rem'>Rewards</Flex>
          <Flex fontSize='.8rem'>Left</Flex>
        </Flex>
        <Flex gap='1' alignItems='center'>
          <Flex fontWeight='bold'>{formatEtherFixed(remainingRewards, 3)}</Flex>
          <Flex fontSize='.6rem'>{BLOCKCHAIN_CURRENCY_NAME}</Flex>
        </Flex>
      </Flex>
    </>
  )
}
