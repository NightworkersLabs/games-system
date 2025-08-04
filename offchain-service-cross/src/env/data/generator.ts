import { isProdEnv } from '#env/defaults'
import { EnvGenerator } from '#env/_base/generator'
import 'dotenv/config'
import env from 'env-var'
import { type IDataEnvTemplate } from './template'

//
export const isBearerAuthBypassAllowed = isProdEnv

//
export class DataEnvGenerator extends EnvGenerator<IDataEnvTemplate> {
  //
  static ABT_ENV_VAR_NAME = 'ACCEPTED_BEARER_TOKEN'

  //
  override build () : IDataEnvTemplate {
    //
    const ACCEPTED_BEARER_TOKEN = env.get(DataEnvGenerator.ABT_ENV_VAR_NAME)

    // requires a Bearer Auth token in production env to enable calling webfront server to use SSG
    if (isBearerAuthBypassAllowed()) {
      ACCEPTED_BEARER_TOKEN.required()
    }

    //
    const out : IDataEnvTemplate = {
      ACCEPTED_BEARER_TOKEN: ACCEPTED_BEARER_TOKEN.asString(),
      CORS_ALLOWED_URL: env.get('CORS_ALLOWED_URL').asString(),
      HTTPS_HOST: env.get('HTTPS_HOST').asString(),
      DATABASE_URL: env.get('DATABASE_URL').required().asString()
    }

    //
    return super.build(out, [DataEnvGenerator.ABT_ENV_VAR_NAME])
  }
}
