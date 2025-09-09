// This function gets called at build time on server-side.
// It may be called again, on a serverless function, if

import type { GetServerSideProps } from 'next'
import { useMemo } from 'react'

import { Flex,Link, Text } from '@chakra-ui/react'
import { faLink, faPersonArrowDownToLine } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import type { ColumnDef} from '@tanstack/react-table';
import { getCoreRowModel, getPaginationRowModel,useReactTable } from '@tanstack/react-table'

import { NetworkTag } from '#/components/App/NetworkPicker'
import { CollabImage, NWNakedTitleContent } from '#/components/App/NWTitle'
import { BasicTable } from '#/components/Data/_'
import type { AvailableNetwork } from '#/env/networksCompiler'
import type { BacklinkReference } from '#/lib/Backlinking';
import blStorage from '#/lib/Backlinking'
import { allNetworks } from '#/lib/TypedNetworks'
import { NWHead } from '#/pages/_app'
import { mainProduct } from '#/pages/_document'

//
const TITLE_TEXT = 'Trackers & Partners'

// revalidation is enabled and a new request comes in
export const getStaticProps : GetServerSideProps = async () => {
  //
  return {
    props: {
      backlinks: Object.entries(blStorage).map(([, d]) => d)
    }
  }
}

//
const PartersPage = (props: {
  backlinks: BacklinkReference[]
}) => {
  return (
    <Flex direction='column' flex='1' alignItems='center' justifyContent='center'>
      <NWHead
        title={TITLE_TEXT + ' - ' + mainProduct}
        description={'Blockchain marketing trackers list and hyperlinks'}
      />
      <Flex flex='1' />
      <Flex direction='column' p='5'>
        <NWNakedTitleContent />
      </Flex>
      <PartnersTable backlinks={props.backlinks} />
      <Flex flex='1' />
    </Flex>
  )
}

//
const PartnersTable = (props: {
  backlinks: BacklinkReference[]
}) => {
  //
  const columns = useMemo<ColumnDef<BacklinkReference>[]>(
    () => [
      {
        header: 'Blockchain',
        columns: [
          {
            accessorKey: 'trackerId',
            header: 'ID'
          },
          {
            accessorKey: 'preferredNetwork',
            header: 'Preferred ?',
            cell: data => {
              //
              const network = allNetworks[data.getValue<AvailableNetwork>()]

              //
              return network && <Flex alignItems='center' justifyContent='center'>
                <NetworkTag network={network} />
              </Flex>
            }
          }
        ]
      },
      {
        header: 'Infos',
        columns: [
          {
            accessorKey: 'sponsorIsComprehensive',
            header: 'Logo',
            cell: data => {
              const isComprehensive = data.getValue<boolean>()

              return isComprehensive &&
                <CollabImage backlink={data.row.original} />
            }
          },
          {
            accessorKey: 'dashboardDescription',
            header: 'Description',
            cell: data => {
              return <Text
                filter={data.row.original.sponsorIsComprehensive != null && 'drop-shadow(0 0 0.25rem crimson)'}
              >{data.getValue<string>()}</Text>
            }
          }
        ]
      },
      {
        header: 'Links',
        columns: [
          {
            accessorKey: 'hyperlink',
            cell: data => {
              const val = data.getValue<string>()
              return val &&
                <Link isExternal href={val}>
                  <FontAwesomeIcon icon={faLink} />
                </Link>
            },
            header: 'Social'
          },
          {
            accessorFn: row => row.uniqueDashboardName,
            id: 'backlink',
            header: 'Backlink',
            cell: data => {
              const val = data.getValue<string>()
              return val &&
              <Flex flexWrap='nowrap'>
                <Link isExternal href={`/presentedBy/${val}`}>
                  <FontAwesomeIcon icon={faLink} />
                </Link>
              </Flex>
            }
          },
          {
            accessorFn: row => row.uniqueDashboardName,
            id: 'sales',
            cell: data => {
              const val = data.getValue<string>()
              return val &&
                <Link isExternal href={`/sales/${val}`}>
                  <FontAwesomeIcon icon={faLink} />
                </Link>
            },
            header: 'Sales'
          }
        ]
      }
    ],
    []
  )

  //
  const table = useReactTable({
    data: props.backlinks,
    columns,
    initialState: {
      pagination: {
        pageSize: 5
      }
    },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel()
  })

  //
  return (
    <BasicTable
      table={table}
      withPager={true}
      title={<Flex direction='column' gap='1'>
        <FontAwesomeIcon size='3x' icon={faPersonArrowDownToLine} />
        <Text fontSize='.75rem'>[{TITLE_TEXT}]</Text>
      </Flex>}
    />
  )
}

export default PartersPage;