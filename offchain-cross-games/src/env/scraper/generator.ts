import "dotenv/config";

import env from "env-var";

import { type IScraperEnvTemplate } from "#/src/env/scraper/template";
import { EnvGenerator } from "#env/_base/generator";

//
export class ScraperEnvGenerator extends EnvGenerator<IScraperEnvTemplate> {
  //
  override build(): IScraperEnvTemplate {
    //
    const out: IScraperEnvTemplate = {
      MNEMO_OR_PRIV_KEY: env.get("MNEMO_OR_PRIV_KEY").required().asString(),
      DATABASE_URL: env.get("DATABASE_URL").required().asString(),
    };

    //
    return super.build(out);
  }
}
