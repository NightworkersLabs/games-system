import { writeFileSync, writeJSONSync } from 'fs-extra'
import { resolve } from 'path'
import { NightworkersContext } from 'scripts/deploy/framework/NWContext'

import { DAppEnvGenerator } from './generators/DApp'
import { getHandledNetworks } from './generators/Networks'
import { TrustedValidatorEnvGenerator } from './generators/TrustedValidator'

function buildEnvFileAsString (envObj: any) : string {
  const entries = Object.entries(envObj)
  let buf = ''
  for (const [key, value] of entries) {
    buf += `\n${key}="${value}"`
  }
  return buf.substring(1)
}

//
function produceConsumerConfiguration (toProduce: object, atFilePath: string) {
  writeFileSync(atFilePath, buildEnvFileAsString(toProduce))
  _logGenerated(atFilePath)
}

//
function produceConsumerJSONConfig (toProduce: object, atFilePaths: string[]) {
  for (const path of atFilePaths) {
    writeJSONSync(path, toProduce, { spaces: 2 })
    _logGenerated(path)
  }
}

//
function _logGenerated (atFilePath: string) {
  console.log(`==> "${resolve(atFilePath)}" successfully generated !`)
}

/**
 * generate configuration files to be used in dApp and Trusted Validator Bot
 */
export function produceConsumerConfigurations (context: NightworkersContext) {
  //
  const dAppEnv = new DAppEnvGenerator().generate(context)
  produceConsumerConfiguration(dAppEnv, 'artifacts/.env.dApp')

  //
  const tvEnvFile = new TrustedValidatorEnvGenerator().generate(context)
  produceConsumerConfiguration(tvEnvFile, 'offchain-service/.env')

  //
  const handledNetworks = getHandledNetworks()
  produceConsumerJSONConfig(handledNetworks, ['artifacts/networks.json'])
}
