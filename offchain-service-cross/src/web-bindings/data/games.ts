 
import type { FastifyInstance } from 'fastify'

import type { FromSchema } from 'json-schema-to-ts'
import { PrismaClient } from '#prisma/client/index.js'
import { generateWhereChainFilter, type HANDLED_GAMES, HANDLED_GAMES_TABLES } from './_'
import { typedByGame, withId } from './_schemas'

//
//
//

//
const filterBetId = ({ historyId }: FromSchema<typeof withId>) : { id?: { gt: bigint } } => {
  return historyId
    ? {
      id: {
        gt: BigInt(historyId)
      }
    }
    : {}
}

//
//
//

//
const getLeaderboardQuery = (tableName: string, onlyCheap?: boolean) =>
  `SELECT 
    address, 
    CAST(COUNT(*) AS DECIMAL(10,0)) "gamesPlayed",
    SUM(won) / SUM(betted) "gainRatio", 
    SUM(won) - SUM(betted)  balance 
  FROM "nw-chips-bank"."${tableName}"
  WHERE ${generateWhereChainFilter(onlyCheap)}
  GROUP BY address
  HAVING SUM(won) - SUM(betted) > 0
  ORDER BY balance DESC`

/** @dev onlyCheap not used on purpose */
const getWinrateQuery = (tableName: string, onlyCheap?: boolean) =>
  `
  WITH tmp AS (
    SELECT
      id,
      "bettedOn", 
      case when won = 0 then 0 else 1 end "didWon" 
    FROM "nw-chips-bank"."${tableName}" 
    ORDER BY id DESC 
    LIMIT 100
  )
  SELECT 
    "bettedOn", 
    CAST(COUNT(*) AS DECIMAL(10,0)) plays, 
    SUM("didWon") wons 
  FROM tmp 
  GROUP BY "bettedOn"`

//
export function bindGamesDataToWebServer (webServer: FastifyInstance, client: PrismaClient) {
  //
  // WINRATES
  //

  webServer.get<{ Querystring: FromSchema<typeof typedByGame> }>(
    '/winrates',
    {
      schema: {
        querystring: typedByGame
      }
    },
    ({ query }, reply) => {
      if (query.game == null) {
        return reply.code(500).send({
          message: 'Game must be specified.'
        })
      }

      //
      const table = HANDLED_GAMES_TABLES[query.game]

      //
      if (table == null) {
        return reply.code(500).send({
          message: 'Game [' + query.game + '] has no associated table.'
        })
      }

      //
      return client.$queryRawUnsafe(
        getWinrateQuery(
          table,
          query.onlyCheap
        )
      )
    }
  )

  //
  // LEADERBOARD
  //

  webServer.get<{ Querystring: FromSchema<typeof typedByGame> }>(
    '/leaderboard',
    {
      schema: {
        querystring: typedByGame
      }
    },
    ({ query }, reply) => {
      if (query.game == null) {
        return reply.code(500).send({
          message: 'Game must be specified.'
        })
      }

      //
      const table = HANDLED_GAMES_TABLES[query.game]

      //
      if (table == null) {
        return reply.code(500).send({
          message: 'Game [' + query.game + '] has no associated table.'
        })
      }

      //
      return client.$queryRawUnsafe(
        getLeaderboardQuery(
          table,
          query.onlyCheap
        )
      )
    }
  )

  //
  // LATEST
  //

  //
  const getLatestFromCoinflip = (query: FromSchema<typeof withId>) =>
    client.coinflipPlays.findMany({
      select: {
        address: true,
        ts: true,
        betted: true,
        bettedOn: true,
        won: true
      },
      where: {
        ...filterBetId(query)
      },
      orderBy: {
        id: 'desc'
      },
      take: 20
    })

  //
  const getLatestFromRoulette = (query: FromSchema<typeof withId>) =>
    client.roulettePlays.findMany({
      select: {
        address: true,
        ts: true,
        betted: true,
        bettedOn: true,
        won: true,
        /** */
        gotNumber: true
      },
      where: {
        ...filterBetId(query)
      },
      orderBy: {
        id: 'desc'
      },
      take: 20
    })

  //
  //
  //

  /** @dev promise generators by games */
  const HANDLED_LATEST : {
    [gameType: HANDLED_GAMES] : (query: FromSchema<typeof withId>) => Promise<any>
  } = {
    coinflip: getLatestFromCoinflip,
    roulette: getLatestFromRoulette
  }

  /** */
  webServer.get<{ Querystring: FromSchema<typeof withId> }>(
    '/latest',
    {
      schema: {
        querystring: withId
      }
    },
    ({ query }, reply) => {
      if (query.game == null) {
        return reply.code(500).send({
          message: 'Game must be specified.'
        })
      }

      //
      const execP = HANDLED_LATEST[query.game]

      //
      if (execP == null) {
        return reply.code(500).send({
          message: 'Game [' + query.game + '] is not handled.'
        })
      }

      //
      return execP(query)
    }
  )
}
