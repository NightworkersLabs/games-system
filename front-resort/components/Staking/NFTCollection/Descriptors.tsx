import {
  Box,
  Flex,
  Text,
  Tooltip
} from '@chakra-ui/react'
import { useEffect, useState, useMemo } from 'react'

import { useNWStore } from 'lib/store/main'
import { OwnedNFT } from 'lib/store/slices/stake/nft-collection'
import { BigNumber } from 'ethers'

import { useTimer } from 'react-timer-hook'
import { toCurrency } from 'lib/BigNumberFormatters'

import { SingleExecPromise } from 'lib/SingleExecPromise'

import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime' // use plugin
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faHourglass, faSackDollar } from '@fortawesome/free-solid-svg-icons'
import { NWERC20_NAME } from 'env/defaults'
import AutoUpdateTracker from 'components/_/AutoUpdateTracker'

dayjs.extend(relativeTime)

//
export function UnstakingTimer (props: { nft : OwnedNFT }) {
  //
  const getHookerUnstakableDate = useNWStore(s => s.getHookerUnstakableDate)

  //
  const unstakableAt = useMemo(() =>
    props.nft.isHooker
      ? getHookerUnstakableDate(props.nft)
      : null,
  [getHookerUnstakableDate, props.nft])

  //
  const { isRunning, minutes, restart } = useTimer({ expiryTimestamp: new Date(), autoStart: false })

  //
  const [unstakeStr, setUnstakeStr] = useState(null)

  useEffect(() => {
    if (unstakableAt != null && unstakableAt > new Date()) {
      restart(unstakableAt)
    }
    // "restart" gets refreshed at every call...
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unstakableAt])

  //
  useEffect(() => {
    if (unstakableAt == null || !isRunning) {
      setUnstakeStr(null)
    } else {
      setUnstakeStr(`${dayjs(unstakableAt).fromNow(true)}`)
    }
    // make sure to refresh every minute
  }, [minutes, isRunning, unstakableAt])

  //
  return (
    <Tooltip placement='left' hasArrow label={unstakeStr ? 'Unstakable in ' + unstakeStr : null}>
      <Flex justifyContent='space-between'>
        {unstakeStr && <Flex ml='1px'><FontAwesomeIcon icon={faHourglass} /></Flex>}
        <Text align="center" fontSize="0.7rem">{unstakeStr}</Text>
      </Flex>
    </Tooltip>
  )
}

//
export function EstimatedPimpRevenue (props: { nft: OwnedNFT }) {
  //
  const pimpUnclaimedRevenue = useMemo(() => {
    const unclaimed = props.nft.pimp_unclamedRevenue ?? BigNumber.from(0)
    return toCurrency(unclaimed)
  }, [props.nft.pimp_unclamedRevenue])

  //
  return (
    <Flex direction='column'>
      <Box mb='2'></Box>
      <EstimatedRevenue formattedRevenueEstimation={pimpUnclaimedRevenue} />
    </Flex>
  )
}

//
export function EstimatedHookerRevenue (props: { nft: OwnedNFT }) {
  //
  const getHookerUnclaimedRevenue = useNWStore(s => s.getHookerUnclaimedRevenue)

  //
  const refreshUnclaimedRevenue$ = useMemo(() => SingleExecPromise.of(() => {
    const revenue = getHookerUnclaimedRevenue(props.nft)
    const formatedRevenue = toCurrency(revenue)
    setEstimatedRevenue(formatedRevenue)
  }), [getHookerUnclaimedRevenue, props.nft])

  //
  const [estimatedRevenue, setEstimatedRevenue] = useState<string>('...')

  //
  return (
    <Flex direction='column'>
      <AutoUpdateTracker toCallPeriodically={refreshUnclaimedRevenue$} periodicityInSecs={5} />
      <Box mb='1'></Box>
      <EstimatedRevenue formattedRevenueEstimation={estimatedRevenue} />
    </Flex>
  )
}

//
function EstimatedRevenue (props: {
    formattedRevenueEstimation: string
}) {
  //
  return (
    <Tooltip placement='left' hasArrow label={props.formattedRevenueEstimation + ' ' + NWERC20_NAME + ' accumulated'}>
      <Flex justifyContent='space-between' alignItems='center' py='1'>
        <FontAwesomeIcon fontSize='xs' icon={faSackDollar} />
        <Text className='pixelFont' align="center" fontSize="0.5rem">{props.formattedRevenueEstimation}</Text>
      </Flex>
    </Tooltip>
  )
}
