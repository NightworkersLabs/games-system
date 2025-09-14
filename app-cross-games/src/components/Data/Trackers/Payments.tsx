import { useMemo, useState } from 'react'
import useSWR from 'swr'

import { Flex } from '@chakra-ui/react'
import { faFileInvoiceDollar, faGauge } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import type { ColumnDef, PaginationState} from '@tanstack/react-table';
import { getCoreRowModel, useReactTable } from '@tanstack/react-table'

import { MiniNetworkTag } from '#/src/components/App/NetworkPicker'
import { TooltipdFromNow } from '#/src/components/Casino/Stats/_'
import { BasicTable, networkFormatted, withAddressExplorer,withBlockExplorerLink } from '#/src/components/Data/_'
import type {PaymentData, PaymentTotalData } from '#/src/components/Data/Trackers/_';
import { fetchTrackersData } from '#/src/components/Data/Trackers/_'
import type { BacklinkReference } from '#/src/lib/Backlinking'
import { networksByChainId } from '#/src/lib/TypedNetworks'

/** props are cached data */
const SalesAnalyticsPayments = (props: {
  backlinkRef: BacklinkReference
}) => {
  return (
    <Flex direction='column' gap='2'>
      <PaymentsTotalTable backlinkRef={props.backlinkRef} />
      <PaymentsTable backlinkRef={props.backlinkRef} />
    </Flex>
  )
}

//
const PaymentsTable = (props: {
  backlinkRef: BacklinkReference
}) => {
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
const PaymentsTotalTable = (props: {
  backlinkRef: BacklinkReference
}) => {
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

export default SalesAnalyticsPayments;