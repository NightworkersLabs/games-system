//
export type IBaseEnvTemplate = {
  /** used as controller / validator account */
  MNEMO_OR_PRIV_KEY: string;
};

//
export interface IWebServerEnvTemplate {
  /**
   * @dev No CORS restrictions by defaut, should be overriden in a production environment
   * @dev understands multiple domains with a comma separated list
   */
  CORS_ALLOWED_URL?: string;
  /**
   * @dev Mounts an HTTP server if undefined, should be overriden in a production environment
   */
  HTTPS_HOST?: string;
}

//
//
export interface IDatabaseEnvTemplate {
  /** @dev Database connection string used by Prisma */
  DATABASE_URL: string;
}
