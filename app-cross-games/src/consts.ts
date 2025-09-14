//
export const CASINO_COIN_NAME = '$CHIP(s)'

/** @dev points to the server with all data API functions (stats, dashboards...) */
export const getDataServiceUrl = () : string => {
  return process.env.NEXT_PUBLIC_DATA_PROVIDER_URL ?? process.env.NEXT_PUBLIC_SECRET_PROVIDER_URL
}
