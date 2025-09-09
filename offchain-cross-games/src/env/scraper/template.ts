import {
  type IBaseEnvTemplate,
  type IDatabaseEnvTemplate,
} from "#env/_base/template.types";

//
export interface IScraperEnvTemplate
  extends IBaseEnvTemplate,
    IDatabaseEnvTemplate {}
