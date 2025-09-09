import { writeFileSync, writeJSONSync } from "fs-extra";
import { EOL } from "os";
import { resolve } from "path";

import { DAppEnvGenerator } from "#/scripts/deploy/framework/env/generators/DApp";
import { getHandledNetworks } from "#/scripts/deploy/framework/env/generators/Networks";
import { OffchainServiceEnvGenerator } from "#/scripts/deploy/framework/env/generators/OffchainService";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const buildEnvFileAsString = (envObj: any): string => {
  const entries = Object.entries(envObj);
  let buf = "";
  for (const [key, value] of entries) {
    buf += `\n${key}="${value}"`;
  }
  return buf.substring(1);
};

//
const produceConsumerConfiguration = (
  toProduce: object,
  atFilePath: string,
) => {
  writeFileSync(atFilePath, buildEnvFileAsString(toProduce));
  _logGenerated(atFilePath);
};

//
const produceConsumerJSONConfig = (
  toProduce: object,
  atFilePaths: string[],
) => {
  for (const path of atFilePaths) {
    writeJSONSync(path, toProduce, { flag: "w", spaces: 2, EOL });
    _logGenerated(path);
  }
};

//
const _logGenerated = (atFilePath: string) => {
  console.log(`==> "${resolve(atFilePath)}" successfully generated !`);
};

/**
 * generate configuration files to be used in dApp and Trusted Validator Bot
 */
export const produceConsumerConfigurations = () => {
  //
  const dAppEnv = new DAppEnvGenerator().generate();
  produceConsumerConfiguration(dAppEnv, "artifacts/.env.dApp");

  //
  const tvEnvFile = new OffchainServiceEnvGenerator().generate();
  produceConsumerConfiguration(tvEnvFile, "offchain-service/.env");

  //
  const handledNetworks = getHandledNetworks();
  produceConsumerJSONConfig(handledNetworks, ["artifacts/networks.json"]);
};
