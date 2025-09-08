import { Flex } from '@chakra-ui/react'
import { faFileInvoiceDollar, faGauge } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import useSWR from 'swr'
import { ColumnDef, getCoreRowModel, PaginationState, useReactTable } from '@tanstack/react-table'
import { BacklinkReference } from 'lib/Backlinking'
import { useMemo, useState } from 'react'
import { PaymentData, PaymentTotalData, fetchTrackersData } from './_'
import { networkFormatted, BasicTable, withBlockExplorerLink, withAddressExplorer } from '../_'

import { MiniNetworkTag } from 'components/App/NetworkPicker'
import { networksByChainId } from 'lib/TypedNetworks'
import { TooltipdFromNow } from 'components/Casino/Stats/_'

/** props are cached data */
export default function SalesAnalyticsPayments (props: {
  backlinkRef: BacklinkReference
}) {
  return (
    <Flex direction='column' gap='2'>
      <PaymentsTotalTable backlinkRef={props.backlinkRef} />
      <PaymentsTable backlinkRef={props.backlinkRef} />
    </Flex>
  )
}

//
function PaymentsTable (props: {
  backlinkRef: BacklinkReference
}) {
  //
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20
  })

  //
  const dataQuery = useSWR<PaymentData[]>(
    ['/payments', props.backlinkRef.trackerId],
    fetchTrackersData,
    { dedupingInterval: 20_000 }
  )

  //
  const columns = useMemo<ColumnDef<PaymentData>[]>(
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
        header: 'Payments',
        columns: [
          {
            accessorKey: 'receiver',
            header: 'Transfered To',
            cell: withAddressExplorer
          },
          {
            accessorKey: 'amount',
            header: 'Amount transfered',
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

  return (
    <BasicTable
      table={table}
      title={<FontAwesomeIcon size='2x' icon={faFileInvoiceDollar} />}
    />
  )
}

//
function PaymentsTotalTable (props: {
  backlinkRef: BacklinkReference
}) {
  //
  const dataQuery = useSWR<PaymentTotalData[]>(
    ['/paymentsTotal', props.backlinkRef.trackerId],
    fetchTrackersData,
    { dedupingInterval: 20_000 }
  )

  //
  const columns = useMemo<ColumnDef<PaymentTotalData>[]>(
    () => [
      {
        id: 'chainId',
        accessorKey: 'chainId',
        header: () => 'Blockchain',
        cell: data => <MiniNetworkTag network={networksByChainId[data.row.original.chainId]} />
      },
      {
        accessorFn: row => row._count._all,
        id: 'count',
        header: 'Unique Transfers'
      },
      {
        accessorFn: row => row._sum.amount,
        id: 'amount',
        cell: networkFormatted,
        header: 'Total Amounts Transfered'
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

  return (
    <BasicTable
      table={table}
      title={<FontAwesomeIcon size='2x' icon={faGauge} />}
    />
  )
}
