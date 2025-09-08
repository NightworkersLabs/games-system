import { getDataServiceUrl } from 'env/defaults'

import { formatEther } from 'ethers/lib/utils'
import { BigNumber } from 'ethers'
import { networksByChainId } from 'lib/TypedNetworks'
import { TableContainer, Table, Thead, Tr, Th, Tbody, Td, Flex, IconButton, Spinner, Text, Link, Tooltip } from '@chakra-ui/react'
import { Table as TanstackTable, flexRender, Getter } from '@tanstack/react-table'
import { faAngleDoubleLeft, faAngleLeft, faAngleRight, faAngleDoubleRight, faInfoCircle } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

//
const dataServiceUrl = getDataServiceUrl()

/** @dev getValue should return a string, but since tanstack type detection on cell is buggy, force with "any" */
export const networkFormatted = <T, >(cell : { getValue: Getter<T>, row: { original: { chainId: number } } }) => {
  //
  const val = cell.getValue<string>()

  //
  return <Flex alignItems='center' flexWrap='wrap' justifyContent='end' gap='1'>
    {val
      ? <>
        <Text fontWeight='bold'>{formatEther(BigNumber.from(val))}</Text>
        <Text fontSize='.8rem'>{networksByChainId[cell.row.original.chainId]?.currencyName ?? 'ETH?'}</Text>
      </>
      : <Text>[ERROR]</Text>}
  </Flex>
}

//
export const withBlockExplorerLink = <T, >(cell : { getValue: Getter<T>, row: { original: { chainId: number } } }) => {
  const network = networksByChainId[cell.row.original.chainId]
  const block = cell.getValue<string>()

  //
  return 'explorer' in network
    ? <Link isExternal href={network.explorer + '/block/' + block + (network.explorerArgs)}>{block}</Link>
    : block
}

//
export const withAddressExplorer = <T, >(cell : { getValue: Getter<T>, row: { original: { chainId: number } } }) => {
  const network = networksByChainId[cell.row.original.chainId]
  const address = cell.getValue<string>()

  //
  return 'explorer' in network
    ? <Link isExternal href={network.explorer + '/address/' + address}>{address}</Link>
    : address
}

/** fetch with auto-bound bearer token */
export const fetchData = async <T= any>(path: string | URL) : Promise<T> => {
  //
  const url = typeof path === 'string' ? new URL(path, dataServiceUrl) : path

  //
  const response = await fetch(url, {
    headers: [
      ['Authorization', 'Bearer ' + process.env.ACCEPTED_BEARER_TOKEN]
    ]
  })

  // @dev throw to enable nextjs to show previously cached data
  if (!response.ok) {
    throw new Error(`Failed to fetch from [${url}] : ${response.statusText}, ${await response.text()}`)
  }

  //
  return response.json()
}

//
//
//

//
export function TooltipedHeader (props: {
  title: string,
  label: string
}) {
  return (
    <Tooltip hasArrow label={props.label}>
      <Flex gap='1' justifyContent='end' flexWrap='wrap'>
        <Text>{props.title}</Text>
        <FontAwesomeIcon icon={faInfoCircle}/>
      </Flex>
    </Tooltip>
  )
}

//
function NoData () {
  return (
    <Tr>
      <Td colSpan={99}>
        <Flex flex='1' gap='2' p='2' alignItems='center' justifyContent='center'>
          <Spinner size='xs' />
          <Text>No data available for now, please retry later.</Text>
        </Flex>
      </Td>
    </Tr>
  )
}

//
export function BasicTable<T> (props: {
  table: TanstackTable<T>,
  withPager?: boolean,
  title: any
}) {
  //
  const rowModel = props.table.getRowModel()

  //
  return (
    <TableContainer backgroundColor='#000B' color='#EEE' borderRadius='5px' pb='4' px='2'>
      <Flex my='4' flex='1' alignItems='center' justifyContent='center'>
        { props.title }
      </Flex>
      <Table variant='simple'>
        <Thead>
          {props.table.getHeaderGroups().map(headerGroup => (
            <Tr key={headerGroup.id}>
              {headerGroup.headers.map(header => {
                return (
                  <Th key={header.id} colSpan={header.colSpan}>
                    {header.isPlaceholder
                      ? null
                      : (
                        <div>
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                        </div>
                      )}
                  </Th>
                )
              })}
            </Tr>
          ))}
        </Thead>
        <Tbody>
          {(rowModel.rows.length && rowModel.rows.map(row =>
            <Tr key={row.id}>
              {row.getVisibleCells().map(cell => {
                return (
                  <Td key={cell.id}>
                    {flexRender(
                      cell.column.columnDef.cell,
                      cell.getContext()
                    )}
                  </Td>
                )
              })}
            </Tr>
          )) || <NoData />}
        </Tbody>
      </Table>
      { props.withPager && <Pager table={props.table} /> }
    </TableContainer>
  )
}

//
function Pager<T> (props: {
  table: TanstackTable<T>
}) {
  return (
    <Flex flex='1' alignItems='center' justifyContent='space-between' pt='5' px='2'>
      <Flex gap='2'>
        <IconButton aria-label='FIRST'
          icon={<FontAwesomeIcon icon={faAngleDoubleLeft} />}
          onClick={() => props.table.setPageIndex(0)}
          disabled={!props.table.getCanPreviousPage()}
        />
        <IconButton aria-label='PREVIOUS'
          icon={<FontAwesomeIcon icon={faAngleLeft} />}
          onClick={() => props.table.previousPage()}
          disabled={!props.table.getCanPreviousPage()}
        />
      </Flex>
      <Flex gap='2'>
        <IconButton aria-label='NEXT'
          icon={<FontAwesomeIcon icon={faAngleRight} />}
          onClick={() => props.table.nextPage()}
          disabled={!props.table.getCanNextPage()}
        />
        <IconButton aria-label='LAST'
          icon={<FontAwesomeIcon icon={faAngleDoubleRight} />}
          onClick={() => props.table.setPageIndex(props.table.getPageCount() - 1)}
          disabled={!props.table.getCanNextPage()}
        />
      </Flex>
    </Flex>
  )
}
