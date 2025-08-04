 
import { type FastifyInstance } from 'fastify'

import { type FromSchema } from 'json-schema-to-ts'
import { PrismaClient } from '#prisma/client/index.js'
import { getPaginationConfiguration, getNetworkFilter } from './_'
import { mandatory, paged } from './_schemas'

//
//
//

//
const getTrackerFilter = ({ trackerId } : FromSchema<typeof mandatory>) : { trackerId: number } | null => {
  return trackerId !== 0
    ? {
      trackerId
    }
    : null
}

//
const getSponsorFilter = ({ trackerId } : FromSchema<typeof mandatory>) : { sponsorId: number } | null => {
  return trackerId !== 0
    ? {
      sponsorId: trackerId
    }
    : null
}

//
//
//

//
export function bindTrackersStatsToWebServer (webServer: FastifyInstance, client: PrismaClient) {
  //
  //
  //

  /** */
  webServer.get<{ Querystring: FromSchema<typeof paged> }>(
    '/payments',
    {
      schema: {
        querystring: paged
      }
    },
    ({ query }) =>
      client.casinoBank_TaxRevenueTransfered.findMany({
        select: {
          chainId: true,
          amount: true,
          block: true,
          receiver: true,
          bts: true
        },
        orderBy: {
          bts: 'desc'
        },
        where: {
          ...getSponsorFilter(query),
          ...getNetworkFilter(query)
        },
        ...getPaginationConfiguration(query)
      })
  )

  /** */
  webServer.get<{ Querystring: FromSchema<typeof mandatory> }>(
    '/paymentsTotal',
    {
      schema: {
        querystring: mandatory
      }
    },
    ({ query }) =>
      client.casinoBank_TaxRevenueTransfered.groupBy({
        by: ['chainId'],
        _sum: {
          amount: true
        },
        _count: {
          _all: true
        },
        where: {
          ...getSponsorFilter(query),
          ...getNetworkFilter(query)
        }
      })
  )

  //
  //
  //

  /** */
  webServer.get<{ Querystring: FromSchema<typeof paged> }>(
    '/buys',
    {
      schema: {
        querystring: paged
      }
    },
    ({ query }) =>
      client.casinoBank_ChipsBought.findMany({
        select: {
          chainId: true,
          amount: true,
          block: true,
          buyer: true,
          taxes: true,
          bts: true
        },
        orderBy: {
          bts: 'desc'
        },
        where: {
          ...getTrackerFilter(query),
          ...getNetworkFilter(query)
        },
        ...getPaginationConfiguration(query)
      })
  )

  /** */
  webServer.get<{ Querystring: FromSchema<typeof mandatory> }>(
    '/buysTotal',
    {
      schema: {
        querystring: mandatory
      }
    },
    ({ query }) =>
      client.casinoBank_ChipsBought.groupBy({
        by: ['chainId'],
        _sum: {
          amount: true,
          taxes: true
        },
        _count: {
          _all: true
        },
        where: {
          ...getTrackerFilter(query),
          ...getNetworkFilter(query)
        }
      })
  )
}
