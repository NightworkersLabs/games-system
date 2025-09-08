 
import type { FastifyInstance } from 'fastify'

import type { FromSchema } from 'json-schema-to-ts'
import { PrismaClient } from '#prisma/client/index.js'
import { generateWhereChainFilter, HANDLED_GAMES_TABLES } from './_'
import { cheapable } from './_schemas'

type GameEvol = {
  then: number,
  evol: [tsEpoch: number, count: number][]
}

//
type GamesEvol = {
  [game: string] : GameEvol
}

//
//
//

//
const generateWhereDateFilter = (date: Date, arrow: 'until' | 'after') =>
  `ts ${arrow === 'until' ? '<=' : '>'} TIMESTAMPTZ '${date.toISOString()}'`

//
const getStatsQuery = (tableName: string, onlyCheap?: boolean) =>
  `WITH sub AS (
    SELECT "bettedOn", betted, won
    FROM "nw-chips-bank"."${tableName}"
    WHERE ${generateWhereChainFilter(onlyCheap)}
  ) 
  SELECT 
    "bettedOn", 
    CAST(COUNT(*) AS DECIMAL(10,0)) plays, 
    SUM(case when won = 0 then 0 else 1 end) wons, 
    AVG(betted) "avgBet",
    AVG(won) "avgWins", 
    CAST(MAX(won) AS DECIMAL(10,0)) "maxWin" 
  FROM sub 
  GROUP BY "bettedOn"`

//
const getGamePlayedByDayQuery = (tableName: string, date: Date, onlyCheap?: boolean) =>
  `SELECT 
    DATE_TRUNC ('day', ts) AS ts, 
    CAST(COUNT(*) as DECIMAL(10, 0)) AS count 
   FROM "nw-chips-bank"."${tableName}"
   WHERE 
    ${generateWhereChainFilter(onlyCheap)} 
    AND ${generateWhereDateFilter(date, 'after')}
   GROUP BY 
    DATE_TRUNC('day', ts)`

//
const gamesPlayedBeforeDateQuery = (tableName: string, date: Date, onlyCheap?: boolean) =>
  `SELECT 
    CAST(COUNT(*) as DECIMAL(10, 0)) AS count 
  FROM "nw-chips-bank"."${tableName}"
  WHERE 
    ${generateWhereChainFilter(onlyCheap)} 
    AND ${generateWhereDateFilter(date, 'until')}`

//
//
//

//
export function bindGamesStatsToWebServer (webServer: FastifyInstance, client: PrismaClient) {
  //
  //
  //

  //
  const getStatsOnGame = (tableName: string, onlyCheap?: boolean) => client.$queryRawUnsafe(getStatsQuery(tableName, onlyCheap))

  //
  const getStatsOnGames = async (onlyCheap?: boolean) => {
    //
    const entriedPromises = Object.entries(HANDLED_GAMES_TABLES)
      .map(async ([gameType, tableName]) => [
        gameType,
        await getStatsOnGame(tableName, onlyCheap)
      ] as const)

    //
    return Object.fromEntries(
      await Promise.all(entriedPromises)
    )
  }

  //
  const getGamesPlayedEvol = async (from: Date, onlyCheap?: boolean) : Promise<GamesEvol> => {
    //
    const results = await Promise.all(
      Object.entries(HANDLED_GAMES_TABLES)
        .map(async ([gameType, tableName]) => {
          //
          const queries = [
            gamesPlayedBeforeDateQuery(tableName, from, onlyCheap),
            getGamePlayedByDayQuery(tableName, from, onlyCheap)
          ].map(query => client.$queryRawUnsafe<Record<string, any>>(query))

          //
          const [then, evol] = await Promise.all(queries)

          //
          const out: Record<string, GameEvol> = {}

          //
          out[gameType] = {
            then: parseInt(then?.[0]?.count ?? 0),
            evol: evol?.map((e: Record<string, any>) => [(e.ts as Date).getTime(), parseInt(e.count)]) ?? 0
          }

          //
          return out
        })
    )

    //
    return results.reduce((out, c) => ({
      ...c,
      ...out
    }), {})
  }

  //
  //
  //

  /** */
  webServer.get<{ Querystring: FromSchema<typeof cheapable> }>(
    '/games-stats',
    {
      schema: {
        querystring: cheapable
      }
    },
    ({ query }) => getStatsOnGames(
      query.onlyCheap
    )
  )

  /** */
  webServer.get<{ Querystring: FromSchema<typeof cheapable> }>(
    '/games-evol',
    {
      schema: {
        querystring: cheapable
      }
    },
    async ({ query }) => {
      //
      // get current date - 30 days
      const now = new Date()
      const thirtyDaysBack = new Date(now.getTime())
      thirtyDaysBack.setDate(thirtyDaysBack.getDate() - 30)

      //
      const data = await getGamesPlayedEvol(
        thirtyDaysBack,
        query.onlyCheap
      )

      //
      return Object.fromEntries(
        Object.entries(data)
          .map(([gameType, data]) => {
            //
            const array : [epoch: number, evol: number][] = []

            // insert initial state
            let initialCount = data.then
            array.push([thirtyDaysBack.getTime(), initialCount])

            //
            // sort by date asc
            data.evol?.sort((a, b) => a[0] - b[0])

            // evolve balance during time
            data.evol?.forEach(([date, mov]) => {
              // alter balance
              initialCount += mov

              // push state
              array.push([
                date,
                initialCount
              ])
            })

            const last = array[array.length - 1];
            
            //
            if (last == null || last.length < 2) {
              throw new Error('Invalid data')
            }

            // latest value as actual value
            array.push([
              now.getTime(),
              last[1]
            ])

            //
            return [gameType, array] as const
          })
      )
    }
  )
}
