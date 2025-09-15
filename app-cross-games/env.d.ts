/** all expected env variables from hosting server */

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NEXT_PUBLIC_DATA_PROVIDER_URL?: string

      /** @dev points to the server with all game API functions (provably-fair, coinflip, balance...) */
      NEXT_PUBLIC_SECRET_PROVIDER_URL: string

      /** SEO exposed domain of the app */
      NEXT_PUBLIC_DOMAIN_URL: string

      /** `package.json` version of the app */
      NEXT_PUBLIC_VERSION: string

      /**
       * Determines which blockchains the app is supposed to work with. Assumes `dev` if not set, eg. Hardhat's emulated EVM.
       */
      NEXT_PUBLIC_BC_FILTER?: 'dev' | 'testnet' | 'mainnet'

      /** */
      ACCEPTED_BEARER_TOKEN?: string
    }
  }
}

export {}
