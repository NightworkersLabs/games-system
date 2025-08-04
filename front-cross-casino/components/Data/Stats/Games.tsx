import { useReactTable, getCoreRowModel, ColumnDef } from '@tanstack/react-table'
import { BasicTable, TooltipedHeader } from 'components/Data/_'
import { Flex, Text } from '@chakra-ui/react'

import { useMemo } from 'react'
import useSWR from 'swr'
import { fetchStatsData, GamesStats, PackedGamesStats } from './_'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { CASINO_COIN_NAME } from 'env/defaults'
import { IconDefinition } from '@fortawesome/free-brands-svg-icons'
import { GAMES_ICONS } from 'components/Casino'
import { BetTag } from 'components/Casino/_/BaseBetHistoryDisplayer'
import { coinBetOutcomeDisplayer } from 'components/Casino/_/Coinflip'
import { CoinBet, ColorBet } from 'lib/store/slices/_/bet'
import { rouletteBetOutcomeDisplayer } from 'components/Casino/_/Roulette'

//
export const GameOutcomeDisplayer : {
  [gameType: string] : (outcomeAsString: string) => any
} = {
  coinflip: outcome => <BetTag decorator={coinBetOutcomeDisplayer(CoinBet[outcome as keyof typeof CoinBet])} />,
  roulette: outcome => <BetTag decorator={rouletteBetOutcomeDisplayer(ColorBet[outcome as keyof typeof ColorBet])} />
}

//
export default function GamesStatsUI () {
  //
  const dataQuery = useSWR<PackedGamesStats>(
    ['/games-stats'],
    fetchStatsData,
    { dedupingInterval: 20_000 }
  )

  //
  return (
    <Flex direction='column' alignItems='center' gap='2'>
      {dataQuery.data
        ? Object.entries(dataQuery.data).map(([gameName, data]) =>
          <GamesTable
            key={gameName}
            gameName={gameName}
            data={data}
            icon={GAMES_ICONS[gameName]}
          />
        )
        : null}
    </Flex>
  )
}

//
function GamesTable (props: {
  gameName: string
  data: GamesStats[],
  icon: IconDefinition
}) {
  //
  const columns = useMemo<ColumnDef<GamesStats>[]>(
    () => [
      {
        accessorKey: 'bettedOn',
        header: 'Bet Type',
        cell: data => <Flex alignItems='center' justifyContent='center'>
          {GameOutcomeDisplayer[props.gameName](data.getValue<string>())}
        </Flex>
      },
      {
        accessorKey: 'plays',
        header: 'Total Plays',
        cell: data => <Flex gap='1' textAlign='right'>
          <Text fontWeight='bold'>{data.getValue<string>()}</Text>
          <Text fontSize='.8rem'>times</Text>
        </Flex>
      },
      {
        accessorKey: 'wons',
        header: 'Total Wons',
        cell: data => <Flex gap='1' textAlign='right'>
          <Text fontWeight='bold'>{data.getValue<string>()}</Text>
          <Text fontSize='.8rem'>times</Text>
        </Flex>
      },
      {
        id: 'winrate',
        header: () => <TooltipedHeader
          title='Winrate'
          label={'Win rate of outcome. Unsignificant until +1k plays.'}
        />,
        accessorFn: data => {
          const plays = parseInt(data.plays)
          const wons = parseInt(data.wons)
          if (plays === 0 || wons > plays) return null

          //
          return (wons / plays) * 100
        },
        cell: data => <Flex gap='1' textAlign='right'>
          <Text fontWeight='bold'>{parseFloat(data.getValue<number>().toFixed(2))}</Text>
          <Text fontSize='.8rem'>%</Text>
        </Flex>
      },
      {
        id: 'avgBet',
        accessorKey: 'avgBet',
        header: () => <TooltipedHeader
          title='Avg. bet'
          label={'Average ' + CASINO_COIN_NAME + ' betted by bet.'}
        />,
        cell: data => <Flex gap='1' textAlign='right'>
          <Text fontWeight='bold'>{parseFloat(parseFloat(data.getValue<string>()).toPrecision(4))}</Text>
          <Text fontSize='.8rem'>{CASINO_COIN_NAME}</Text>
        </Flex>
      },
      {
        id: 'avgWins',
        accessorKey: 'avgWins',
        header: () => <TooltipedHeader
          title='Avg. won'
          label={'Average ' + CASINO_COIN_NAME + ' won on all bets, lost or won.'}
        />,
        cell: data => <Flex gap='1' textAlign='right'>
          <Text fontWeight='bold'>{parseFloat(parseFloat(data.getValue<string>()).toPrecision(4))}</Text>
          <Text fontSize='.8rem'>{CASINO_COIN_NAME}</Text>
        </Flex>
      },
      {
        id: 'maxWin',
        accessorKey: 'maxWin',
        header: () => <TooltipedHeader
          title='Max. Win'
          label={'Single maximum ' + CASINO_COIN_NAME + ' won in a single bet.'}
        />,
        cell: data => <Flex gap='1' textAlign='right'>
          <Text fontWeight='bold'>{data.getValue<string>()}</Text>
          <Text fontSize='.8rem'>{CASINO_COIN_NAME}</Text>
        </Flex>
      }
    ],
    [props.gameName]
  )

  //
  const table = useReactTable({
    data: props.data,
    columns,
    getCoreRowModel: getCoreRowModel()
  })

  //
  return (
    <Flex direction='column' alignItems='center' gap='2'>
      <BasicTable
        table={table}
        title={<Flex justifyContent='space-between' alignItems='center' w='100%'>
          <Flex flex='1' alignItems='center' justifyContent='center'>
            <FontAwesomeIcon size='2x' icon={props.icon} />
          </Flex>
        </Flex>}
      />
    </Flex>
  )
}
