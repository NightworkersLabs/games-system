import { BigNumber } from 'ethers'
import { useMemo, useState } from 'react'
import useSWR from 'swr'

import { Flex,Switch, Text } from '@chakra-ui/react'
import { faBalanceScale, faFileContract } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import type { ColumnDef} from '@tanstack/react-table';
import { getCoreRowModel,useReactTable } from '@tanstack/react-table'

import { HUDButton } from '#/src/components/App/HUD'
import { MiniNetworkTag } from '#/src/components/App/NetworkPicker'
import { BasicTable, networkFormatted, TooltipedHeader } from '#/src/components/Data/_'
import type { BalanceData, SingleChipsPrices } from '#/src/components/Data/Stats/_';
import { chipsAmountRenderer, fetchStatsData } from '#/src/components/Data/Stats/_'
import { CASINO_COIN_NAME } from '#/src/consts'
import { deployed, networksByChainId } from '#/src/lib/TypedNetworks'

//
const BalancesTable = (props: {
  singleChipValues: SingleChipsPrices
}) => {
  //
  const dataQuery = useSWR<BalanceData[]>(
    ['/balances-total'],
    fetchStatsData,
    { dedupingInterval: 20_000 }
  )

  //
  const [currencyMode, setCurrencyMode] = useState(true)

  //
  const columns = useMemo<ColumnDef<BalanceData>[]>(
    () => [
      {
        accessorKey: 'chainId',
        header: 'Blockchain',
        cell: data => <MiniNetworkTag network={networksByChainId[data.row.original.chainId]} />
      },
      {
        id: 'contract',
        header: null,
        cell: data => {
          //
          const network = networksByChainId[data.row.original.chainId]
          const contractAddress = deployed.CasinoBank[network?.name]?.[0]
          const explorer = 'explorer' in network && network.explorer

          //
          return <HUDButton
            name='CONTRACT'
            icon={faFileContract}
            href={ contractAddress && explorer ? explorer + '/address/' + contractAddress : null }
          />
        }
      },
      {
        id: CASINO_COIN_NAME,
        header: () => <Flex alignItems='center' justifyContent='start' flexWrap='wrap' gap='1'>
          <Text>Token</Text>
          <Text>-</Text>
          <Flex flex='0' gap='2' justifyContent='center' alignItems='center'>
            <Text fontSize='.7rem'>{currencyMode ? 'Currency' : CASINO_COIN_NAME} mode</Text>
            <Switch colorScheme='pink' defaultChecked={currencyMode} onChange={({ target: { checked } }) => setCurrencyMode(checked)} />
          </Flex>
        </Flex>,
        columns: [
          {
            accessorFn: row => row._sum.tBought,
            id: 'totalBought',
            header: 'Bought',
            cell: data => chipsAmountRenderer(data, props.singleChipValues, currencyMode)
          },
          {
            accessorFn: row => row._sum.tWithdrawed,
            id: 'totalWithdrawed',
            header: 'Withdrawed',
            cell: data => chipsAmountRenderer(data, props.singleChipValues, currencyMode)
          },
          {
            accessorFn: row => row._sum.withdrawable,
            id: 'totalWithdrawable',
            header: 'Withdrawable',
            cell: data => chipsAmountRenderer(data, props.singleChipValues, currencyMode)
          },
          {
            id: 'netWon',
            header: () => <TooltipedHeader
              title='Net Banked'
              label='Unwithdrawable bought, eg. safety net for unlucky bank draws. Does not account for neither taxes nor individual contracts balances.'
            />,
            accessorFn: row => row._sum.tBought - row._sum.tWithdrawed - row._sum.withdrawable,
            cell: data => chipsAmountRenderer(
              data,
              props.singleChipValues,
              currencyMode,
              true
            )
          }
        ]
      },
      {
        header: 'Contract',
        columns: [
          {
            id: 'balance',
            header: () => <TooltipedHeader
              title='Balance'
              label='Contract balance minus taxes'
            />,
            accessorFn: row => {
              const infos = props.singleChipValues[row.chainId]
              if (infos == null) return null
              return BigNumber.from(infos.balance)
                .sub(infos.tax)
                .toString()
            },
            cell: networkFormatted
          },
          {
            id: 'solvability',
            header: () => <TooltipedHeader
              title='Solvability'
              label={'How much contract balance covers withdrawable ' + CASINO_COIN_NAME + ' - excluding taxes. If 0%, means that future withdraws will dig into safety bank funds, hence deficitary.'}
            />,
            accessorFn: row => {
              //
              const values = props.singleChipValues[row.chainId]
              if (values == null || values.chipValue == null || values.balance == null) return null

              //
              const { chipValue, balance, tax } = values

              //
              const withdrawableToCurrency = BigNumber.from(chipValue).mul(row._sum.withdrawable)
              const balanceAsBN = BigNumber.from(balance).sub(tax)

              // technically solvable :)
              if (withdrawableToCurrency.isZero()) {
                return 100
              }

              // not solvable at all !
              if (balanceAsBN.isZero()) {
                return null
              }

              return balanceAsBN
                .mul(10_000)
                .div(withdrawableToCurrency)
                .toNumber() / 100
            },
            cell: data => {
              //
              const prc = data.getValue<number>()

              //
              return <Text
                textAlign='right'
                fontWeight='bold'
                color={prc > 120 ? 'green' : (prc < 100 ? 'red' : 'yellow')}
              >{prc ?? 0}{ ' %'}</Text>
            }
          },
          {
            id: 'taxes',
            header: () => <TooltipedHeader
              title='Taxes'
              label='Currently available locked funds from taxes'
            />,
            accessorFn: row => props.singleChipValues[row.chainId]?.tax,
            cell: networkFormatted
          }
        ]
      }
    ],
    [currencyMode, props.singleChipValues]
  )

  //
  const table = useReactTable({
    data: dataQuery.data ?? [],
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
            <FontAwesomeIcon size='2x' icon={faBalanceScale} />
          </Flex>
        </Flex>}
      />
    </Flex>
  )
}

export default BalancesTable;