/** Smart contracts that are handled by the server */
type IHandledContracts = {
  LOTTERY: string
  NIGHTWORKERS_GAME: string
  RED_LIGHT_DISTRICT: string
  TABLE_GAMES: string
}

export type ITrustedValidatorEnv = IHandledContracts & {
  RPC_URL: string
  CHAIN_ID: number
  /** used as controller / validator account */
  MNEMO_OR_PRIV_KEY: string
  /**
   * @dev No CORS restrictions by defaut, should be overriden in a production environment
   * @dev understands multiple domains with a comma separated list
   */
  CORS_ALLOWED_URL?: string
  /**
   * @dev Mounts an HTTP server if undefined, should be overriden in a production environment
   */
  HTTPS_HOST?: string
}
