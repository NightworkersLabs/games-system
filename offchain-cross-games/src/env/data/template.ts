import {
  type IDatabaseEnvTemplate,
  type IWebServerEnvTemplate,
} from "#env/_base/template.types";

//
export interface IDataEnvTemplate
  extends IWebServerEnvTemplate,
    IDatabaseEnvTemplate {
  /**
   * @dev required token (on prod environment) to allow access to API (notably, for SSG / testing)
   */
  ACCEPTED_BEARER_TOKEN?: string;
}
