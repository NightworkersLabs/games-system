 
import { type FastifyInstance } from 'fastify'

import { type FromSchema } from 'json-schema-to-ts'
import { PrismaClient } from '#prisma/client/index.js'
import { resolve } from 'path'
import fs from 'fs-extra'
import { NETWORKS_CONFIGURATION_FILE_PATH } from '#lib/multi-chain/configuration.builder'
import { isProdEnv } from '#env/defaults'
import { bindBalancesStatsToWebServer } from './stats-balances'
import { bindGamesStatsToWebServer } from './stats-games'
import { bindGamesDataToWebServer } from './games'
import { bindTrackersStatsToWebServer } from './stats-trackers'
import { cheapable, paged } from './_schemas'

//
//
//

type HandledGames = {
  [gameType: string] : string
}

/** @dev to fill with every new game to handle */
export const HANDLED_GAMES_TABLES : HandledGames = {
  coinflip: 'CoinflipPlays',
  roulette: 'RoulettePlays'
} as const

export type HANDLED_GAMES = keyof typeof HANDLED_GAMES_TABLES

//
const getCheapNetworkIds = () => {
  const resolvedNetworks = resolve(NETWORKS_CONFIGURATION_FILE_PATH)
  const networks = fs.readJSONSync(resolvedNetworks) as { [networkName: string]: { url: string, chainId: number, cheap?: true }}
  const cheapNetworksIds = Object.entries(networks)
    .filter(([, infos]) => infos.cheap)
    .map(([, infos]) => infos.chainId)
  return cheapNetworksIds
}

/** @dev no cheap Ids in dev. environments */
export const cheapNetworkIds = isProdEnv() ? getCheapNetworkIds() : []

//
export const generateWhereChainFilter = (onlyCheap?: boolean) => {
  // no need to filter in these cases
  if (cheapNetworkIds.length === 0 || onlyCheap === false) {
    return '1 = 1'
  }

  // 'null' means ONLY MAINNETS, 'true' means ONLY TESTNETS
  return `"chainId"${onlyCheap == null ? ' NOT ' : ' '}IN (${cheapNetworkIds.join(', ')})`
}

//
//
//

//
export const getPaginationConfiguration = (query: FromSchema<typeof paged>) : { skip: number, take: number } => {
  //
  const defPage = query.page ?? 0
  const take = query.length == null || query.length > 50
    ? 50
    : query.length

  //
  return {
    skip: defPage * take,
    take
  }
}

//
export const getNetworkFilter = ({ onlyCheap } : FromSchema<typeof cheapable>) : { chainId: { notIn?: number[], in?: number[] } } | null => {
  // no need to filter in these cases
  if (cheapNetworkIds.length === 0 || onlyCheap === false) {
    return null
  }

  return {
    chainId: {
      // 'null' means ONLY MAINNETS, 'true' means ONLY TESTNETS
      ...(onlyCheap == null
        ? { notIn: cheapNetworkIds }
        : { in: cheapNetworkIds }
      )
    }
  }
}

//
//
//

/** @dev add to this every handler */
export function bindDataAPIsToWebServer (webServer: FastifyInstance, client: PrismaClient) {
  [
    /** */
    bindBalancesStatsToWebServer,
    bindGamesStatsToWebServer,
    /** */
    bindTrackersStatsToWebServer,
    /** */
    bindGamesDataToWebServer
  //
  ].forEach(binder => binder(webServer, client))
}
