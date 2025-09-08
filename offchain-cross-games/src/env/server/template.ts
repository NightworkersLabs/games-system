import { type IBaseEnvTemplate, type IDatabaseEnvTemplate, type IWebServerEnvTemplate } from '#env/_base/template'

//
export interface IServerEnvTemplate extends IBaseEnvTemplate, IDatabaseEnvTemplate, IWebServerEnvTemplate {}

//
export const getAllowedDomains = (env: IWebServerEnvTemplate) : null | string[] => {
  //
  if (env.CORS_ALLOWED_URL == null || env.CORS_ALLOWED_URL.length !== 0) return null

  //
  if (env.CORS_ALLOWED_URL.includes(',')) {
    return env.CORS_ALLOWED_URL.split(',')
  }

  //
  return [env.CORS_ALLOWED_URL]
}

//
export const getCORSParams = (env: IWebServerEnvTemplate) => {
  //
  const raw = getAllowedDomains(env)

  //
  if (raw == null) return '*'

  return raw
}
