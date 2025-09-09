import "dotenv/config";

import env from "env-var";

import { type IServerEnvTemplate } from "#/src/env/server/template";
import { EnvGenerator } from "#env/_base/generator";

//
export class ServerEnvGenerator extends EnvGenerator<IServerEnvTemplate> {
  //
  override build(): IServerEnvTemplate {
    return super.build({
      MNEMO_OR_PRIV_KEY: env.get("MNEMO_OR_PRIV_KEY").required().asString(),
      CORS_ALLOWED_URL: env.get("CORS_ALLOWED_URL").asString(),
      HTTPS_HOST: env.get("HTTPS_HOST").asString(),
      DATABASE_URL: env.get("DATABASE_URL").required().asString(),
    });
  }
}
