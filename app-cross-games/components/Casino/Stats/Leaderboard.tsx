import useSWR from 'swr'

import { Flex, Image, Spinner, Table, Tbody, Td, Text, Th, Thead, Tooltip,Tr } from '@chakra-ui/react'
import { faAddressCard, faCircleQuestion, faRankingStar, faStopwatch } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import { contextualizedAddressDisplay } from '#/components/Casino/Stats/BetsFeed'
import { CASINO_COIN_NAME } from '#/env/defaults'
import { useNWStore } from '#/lib/store/main'

import type { HandledCasinoGame } from '..'
import { fetchForGameData } from '.'

//
interface LeaderboardData {
  address: string
  gamesPlayed: number
  gainRatio: string
  balance: number
}

//
const Leaderboard = (props: {
  game: HandledCasinoGame
}) => {
  //
  const currentEOAAddress = useNWStore(s => s.currentEOAAddress)

  //
  const { data } = useSWR<LeaderboardData[]>(
    ['/leaderboard', props.game],
    fetchForGameData,
    { dedupingInterval: 20_000 }
  )

  //
  return (
    <Flex mt='10' direction='column' gap='3rem'>
      <Flex justifyContent='center'>
        <CuppedBadge
          loading={data == null}
          data={data?.[0]}
          zIndex={3}
          cupType='gold'
          size='big'
        />
      </Flex>
      <Flex justifyContent='space-around' flexWrap='wrap' flex='1' gap='3rem'>
        <CuppedBadge loading={data == null} data={data?.[1]} zIndex={2} cupType='silver' />
        <CuppedBadge loading={data == null} data={data?.[2]} zIndex={1} cupType='bronze' />
      </Flex>
      <Table bgColor='#0005'>
        <Thead>
          <Tr>
            <Th>Rank</Th>
            <Th>
              <Text textAlign='center'>Address</Text>
            </Th>
          </Tr>
        </Thead>
        <Tbody>
          {Array.from({ length: 7 }, (_, k) => k + 3).map(index =>
            <Tr key={index}>
              <Td className='pixelFont'>
                <Flex alignItems='end' justifyContent='start'>
                  <Text fontSize='.5em'>n°</Text>
                  <Text>{index + 1}</Text>
                </Flex>
              </Td>
              { data?.[index]
                ? <>
                  <Td fontWeight='bold' textAlign='center'>
                    {contextualizedAddressDisplay(currentEOAAddress, data?.[index]?.address)}
                  </Td>
                </>
                : <Td colSpan={99}>
                  <Flex flex='1' justifyContent='center' gap='2' alignItems='center'>
                    <EmptyDataHandler state={data === null ? 'loading' : 'noData'} />
                  </Flex>
                </Td>
              }
            </Tr>
          )}
        </Tbody>
      </Table>
    </Flex>
  )
}

//
const EmptyDataHandler = (props: {
  state: 'loading' | 'noData'
}) => {
  return props.state === 'noData'
    ? <>
      <Text fontSize='.65rem' bgColor='#0005' px='10' py='1' borderRadius='3px'>(Nobody yet !)</Text>
    </>
    : <>
      <Spinner size='xs' />
      <Text fontSize='.8rem'>Loading...</Text>
    </>
}

//
const CuppedBadge = (props: {
  cupType: 'gold' | 'silver' | 'bronze'
  loading: boolean
  size?: 'big' | 'normal'
  zIndex?: number
  data?: LeaderboardData
}) => {
  return (
    <Flex direction='row' flexWrap='wrap' bgColor='#0008' borderRadius='10px' alignItems='center' justifyContent='center' gap='5'>
      <Cupped size={props.size} cupType={props.cupType} zIndex={props.zIndex} data={props.data} />
      <Flex p='4' minW='10rem' justifyContent='center' alignItems='center' gap='2'>
        {props.data == null
          ? <EmptyDataHandler state={props.loading ? 'loading' : 'noData'} />
          : <Flex direction='column' gap='3'>
            <Flex direction='column'>
              <Flex fontSize='.8rem' alignItems='center' gap='1'>
                <FontAwesomeIcon icon={faAddressCard} color='gold' />
                <Text fontWeight='bold'>Address</Text>
              </Flex>
              <Text fontSize='.75em'>{props.data?.address}</Text>
            </Flex>
            <Flex gap='5'>
              <Flex direction='column'>
                <Tooltip hasArrow label={'How much in total was stolen from the Bank by betting.'}>
                  <Flex alignItems='center' gap='1'>
                    <FontAwesomeIcon icon={faRankingStar} color='gold' />
                    <Text fontSize='.8rem' fontWeight='bold'>Net Winnings</Text>
                    <FontAwesomeIcon color='gray' icon={faCircleQuestion} />
                  </Flex>
                </Tooltip>
                <Flex gap='1' alignItems='center'>
                  <Image src='/resources/casino/CHIP_14.png' alt={CASINO_COIN_NAME} />
                  <Text fontWeight='bold'>+{props.data?.balance}</Text>
                  <Text fontSize='.75em'>{CASINO_COIN_NAME}</Text>
                </Flex>
              </Flex>
              <Flex direction='column'>
                <Tooltip hasArrow label={'How much, in average, was made by ' + CASINO_COIN_NAME + ' betted.'}>
                  <Flex alignItems='center' gap='1'>
                    <FontAwesomeIcon icon={faRankingStar} color='gold' />
                    <Text fontSize='.8rem' fontWeight='bold'>Gain Rates</Text>
                    <FontAwesomeIcon color='gray' icon={faCircleQuestion} />
                  </Flex>
                </Tooltip>
                <Flex alignItems='center'>
                  <Text fontSize='.75em'>x</Text>
                  <Text fontWeight='bold'>{parseFloat(props.data?.gainRatio ?? '0').toPrecision(3)} </Text>
                </Flex>
              </Flex>
            </Flex>
            <Flex direction='column'>
              <Flex alignItems='center' gap='1'>
                <FontAwesomeIcon icon={faStopwatch} color='gold' />
                <Text fontSize='.8rem' fontWeight='bold'>Played</Text>
              </Flex>
              <Flex gap='1' alignItems='center'>
                <Text fontWeight='bold'>{props.data?.gamesPlayed}</Text>
                <Text fontSize='.75em'>times</Text>
              </Flex>
            </Flex>
          </Flex>
        }
      </Flex>
    </Flex>
  )
}

CuppedBadge.defaultProps = {
  size: 'normal'
}

//
const Cupped = (props: {
  cupType: 'gold' | 'silver' | 'bronze'
  size?: 'big' | 'normal'
  zIndex?: number
  data?: LeaderboardData
}) => {
  return (
    <Flex zIndex={props.zIndex} position='relative'>
      <Image
        boxSize={props.size === 'normal' ? '3rem' : '6rem'}
        position='absolute'
        bottom={props.size === 'normal' ? '-.65rem' : '-1.2rem'}
        left={props.size === 'normal' ? '-1.65rem' : '-4rem'}
        alt={props.cupType} src={`/resources/ranking/${props.cupType}_cup.png`}
      />
      <Image
        w={props.size === 'normal' ? '1rem' : '1.5rem'}
        position='absolute'
        top={props.size === 'normal' ? '-.5rem' : '-1rem'}
        right={props.size === 'normal' ? '-.3rem' : '-.8rem'}
        alt={props.cupType} src={`/resources/ranking/${props.cupType}_medal.png`}
      />
      <Image
        boxSize='10rem'
        alt={props.cupType} src='/nw_assets/unknown.png'
      />
    </Flex>
  )
}

export default Leaderboard;