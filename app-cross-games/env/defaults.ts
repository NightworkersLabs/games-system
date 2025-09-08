//
export const CASINO_COIN_NAME = '$CHIP(s)'

//
export const getNWExecutionContextFromEnv = () => {
  if (process.env.NEXT_PUBLIC_IS_PROD == null) return 'dev?'
  return process.env.NEXT_PUBLIC_IS_PROD === '1' ? 'prod' : 'test'
}

/** @dev points to the server with all game API functions (provably-fair, coinflip, balance...) */
export function getGameServiceUrl () : string {
  return process.env.NEXT_PUBLIC_SECRET_PROVIDER_URL
}

/**  @dev points to the server with all data API functions (stats, dashboards...) */
export function getDataServiceUrl () : string {
  return process.env.NEXT_PUBLIC_DATA_PROVIDER_URL ?? getGameServiceUrl()
}

/** all expected env variables from hosting server */

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NEXT_PUBLIC_DATA_PROVIDER_URL?: string
      NEXT_PUBLIC_SECRET_PROVIDER_URL: string
      NEXT_PUBLIC_IS_PROD: string
      NEXT_PUBLIC_DOMAIN: string
      /** */
      ACCEPTED_BEARER_TOKEN?: string
    }
  }
}

export {}
