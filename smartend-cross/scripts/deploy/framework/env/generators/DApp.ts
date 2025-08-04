import { defaultTrustedValidatorPort, defaultDataProviderServicePort } from '@offchain-service/env/defaults'
import { IEnvGenerator } from './IEnvGenerator'

export interface IDAppEnv {
  NEXT_PUBLIC_SECRET_PROVIDER_URL: string
  NEXT_PUBLIC_DATA_PROVIDER_URL: string
}

export class DAppEnvGenerator extends IEnvGenerator<IDAppEnv> {
  override generate () : IDAppEnv {
    return {
      NEXT_PUBLIC_SECRET_PROVIDER_URL: `http://127.0.0.1:${defaultTrustedValidatorPort}`,
      NEXT_PUBLIC_DATA_PROVIDER_URL: `http://127.0.0.1:${defaultDataProviderServicePort}`
    }
  }
}
