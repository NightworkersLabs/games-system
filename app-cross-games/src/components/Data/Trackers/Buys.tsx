import { useMemo, useState } from 'react'
import useSWR from 'swr'

import { Flex } from '@chakra-ui/react'
import { faCashRegister,faGauge } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import type { ColumnDef, PaginationState} from '@tanstack/react-table';
import { getCoreRowModel, useReactTable } from '@tanstack/react-table'

import { MiniNetworkTag } from '#/src/components/App/NetworkPicker'
import { TooltipdFromNow } from '#/src/components/Casino/Stats/_'
import { BasicTable, networkFormatted, TooltipedHeader,withAddressExplorer, withBlockExplorerLink } from '#/src/components/Data/_'
import type { BuyData, BuyTotalData} from '#/src/components/Data/Trackers/_';
import { fetchTrackersData } from '#/src/components/Data/Trackers/_'
import { CASINO_COIN_NAME } from '#/src/consts'
import type { BacklinkReference } from '#/src/lib/Backlinking'
import { networksByChainId } from '#/src/lib/TypedNetworks'

/** props are cached data */
const SalesAnalyticsBuys = (props: {
  backlinkRef: BacklinkReference
}) => {
  //
  return (
    <Flex direction='column' gap='2'>
      <BuysTotalTable backlinkRef={props.backlinkRef} />
      <BuysTable backlinkRef={props.backlinkRef} />
    </Flex>
  )
}

//
const BuysTable = (props: {
  backlinkRef: BacklinkReference
}) => {
  //
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20
  })

  //
  const dataQuery = useSWR<BuyData[]>(
    ['/buys', props.backlinkRef.trackerId],
    fetchTrackersData,
    { dedupingInterval: 20_000 }
  )

  //
  const columns = useMemo<ColumnDef<BuyData>[]>(
    () => [
      {
        header: 'Environment',
        columns: [
          {
            accessorKey: 'chainId',
            header: 'Blockchain',
            cell: data => <MiniNetworkTag network={networksByChainId[data.row.original.chainId]} />
          },
          {
            accessorKey: 'block',
            header: 'Block Number',
            cell: withBlockExplorerLink
          }
        ]
      },
      {
        header: 'Buys',
        columns: [
          {
            accessorKey: 'buyer',
            header: 'Buyer',
            cell: withAddressExplorer
          },
          {
            accessorKey: 'amount',
            header: `${CASINO_COIN_NAME} Bought`
          },
          {
            accessorKey: 'taxes',
            header: () =>
              <TooltipedHeader
                title='Tax resulting'
                label='Total tax amount that was banked by the contract. Your negociated share is a fraction of that amount.'
              />,
            cell: networkFormatted
          },
          {
            accessorKey: 'bts',
            header: () => null,
            cell: data => <TooltipdFromNow ts={data.getValue()} />
          }
        ]
      }
    ],
    []
  )

  //
  const table = useReactTable({
    data: dataQuery.data ?? [],
    columns,
    pageCount: -1,
    state: {
      pagination
    },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true
  })

  //
  return (
    <BasicTable
      table={table}
      title={<FontAwesomeIcon size='2x' icon={faCashRegister} />}
    />
  )
}

//
const BuysTotalTable = (props: {
  backlinkRef: BacklinkReference
}) => {
  //
  const dataQuery = useSWR<BuyTotalData[]>(
    ['/buysTotal', props.backlinkRef.trackerId],
    fetchTrackersData,
    { dedupingInterval: 20_000 }
  )

  //
  const columns = useMemo<ColumnDef<BuyTotalData>[]>(
    () => [
      {
        accessorKey: 'chainId',
        header: 'Blockchain',
        cell: data => <MiniNetworkTag network={networksByChainId[data.row.original.chainId]} />
      },
      {
        accessorFn: row => row._sum.amount,
        id: 'amount',
        header: `Total ${CASINO_COIN_NAME} Bought`
      },
      {
        accessorFn: row => row._count._all,
        id: 'count',
        header: 'Unique Buys'
      },
      {
        accessorFn: row => row._sum.taxes,
        id: 'taxes',
        header: () =>
          <TooltipedHeader
            title='Total Taxes'
            label='Total tax amount that was banked by the contract. Your negociated share is a fraction of that amount.'
          />,
        cell: networkFormatted
      }
    ],
    []
  )

  //
  const table = useReactTable({
    data: dataQuery.data ?? [],
    columns,
    getCoreRowModel: getCoreRowModel()
  })

  //
  return (
    <BasicTable
      table={table}
      title={<FontAwesomeIcon size='2x' icon={faGauge} />}
    />
  )
}

export default SalesAnalyticsBuys;