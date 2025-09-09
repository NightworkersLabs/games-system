import useSWR from 'swr'

import { Flex, Image, Spinner, Table, Tbody, Td, Text, Th, Thead, Tooltip,Tr } from '@chakra-ui/react'

import { shorthandingBigNumber } from '#/components/App/HUD/Wallet'
import { TooltipdFromNow } from '#/components/Casino/Stats/_'
import { GameOutcomeDisplayer } from '#/components/Data/Stats/Games'
import { CASINO_COIN_NAME } from '#/env/defaults'
import { useNWStore } from '#/lib/store/main'

import type { HandledCasinoGame } from '..'
import { fetchForGameData } from '.'

interface DbBetsData {
  address: string
  ts: string
  betted: number
  bettedOn: string
  won: number
}

//
export const contextualizedAddressDisplay = (currentEOA: string, address?: string) =>
  <Tooltip hasArrow label={address}>
    <Flex>
      <Text>{shorthandingBigNumber(address)}</Text>
      {address?.toLowerCase() === currentEOA.toLowerCase() &&
        <Text color='gray' fontWeight='bold'> - (Me)</Text>
      }
    </Flex>
  </Tooltip>

//
const BetsFeed = (props: {
  game: HandledCasinoGame
}) => {
  //
  const currentEOAAddress = useNWStore(s => s.currentEOAAddress)

  //
  const { data } = useSWR<DbBetsData[]>(
    ['/latest', props.game],
    fetchForGameData,
    {
      refreshInterval: 10_000, dedupingInterval: 10_000
    }
  )

  //
  return (
    <Flex overflow='auto'>
      <Table bgColor='#0005'>
        <Thead>
          <Tr>
            <Th></Th>
            <Th>Betted On</Th>
            <Th>How much</Th>
            <Th>Outcome</Th>
            <Th>Player</Th>
          </Tr>
        </Thead>
        <Tbody>
          {data
            ? data.map((bet, index) =>
              <Tr key={index}>
                <Td>
                  <TooltipdFromNow ts={bet?.ts} />
                </Td>
                <Td>
                  <Flex justifyContent='center'>
                    {GameOutcomeDisplayer[props.game](bet?.bettedOn)}
                  </Flex>
                </Td>
                <Td>
                  <ChipsDisplay betted={bet.betted} />
                </Td>
                <Td>
                  <ChipsDisplay betted={bet.betted} won={bet.won} />
                </Td>
                <Td fontSize='.6rem' fontWeight='bold'>
                  <Flex bgColor='#FFF3' alignItems='center' justifyContent='center'>
                    {contextualizedAddressDisplay(currentEOAAddress, bet?.address)}
                  </Flex>
                </Td>
              </Tr>
            )
            : <Tr>
              <Td colSpan={99}>
                <Flex flex='1' alignItems='center' justifyContent='center' gap='2'>
                  <Spinner />
                  <Text>No plays yet.</Text>
                </Flex>
              </Td>
            </Tr>}
        </Tbody>
      </Table>
    </Flex>
  )
}

//
const ChipsDisplay = (props: {
  betted: number
  won?: number
}) => {
  return (
    <Flex alignItems='center' justifyContent='end' gap='2px' color={props.won ? '#76df76' : 'inherit'}>
      {
        props.won === 0
          ? <Text fontSize='.8rem' color='gray' fontWeight='bold'>Lost...</Text>
          : <>
            {props.won && <Text fontWeight='bold'>+</Text>}
            <Text fontWeight='bold'>{props.won ? props.won - props?.betted : props?.betted}</Text>
            {props.won && <Text fontWeight='bold'>!</Text>}
            <Image w='14px' h='14px' src='/resources/casino/CHIP_14.png' mx='1' alt={CASINO_COIN_NAME} />
          </>
      }
    </Flex>
  )
}

export default BetsFeed;