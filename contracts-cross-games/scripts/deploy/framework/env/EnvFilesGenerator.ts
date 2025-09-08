import { writeFileSync, writeJSONSync } from 'fs-extra'
import { resolve } from 'path'

import { DAppEnvGenerator } from './generators/DApp'
import { getHandledNetworks } from './generators/Networks'
import { OffchainServiceEnvGenerator } from './generators/OffchainService'

import { EOL } from 'os'

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
    writeJSONSync(path, toProduce, { flag: 'w', spaces: 2, EOL })
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
export function produceConsumerConfigurations () {
  //
  const dAppEnv = new DAppEnvGenerator().generate()
  produceConsumerConfiguration(dAppEnv, 'artifacts/.env.dApp')

  //
  const tvEnvFile = new OffchainServiceEnvGenerator().generate()
  produceConsumerConfiguration(tvEnvFile, 'offchain-service/.env')

  //
  const handledNetworks = getHandledNetworks()
  produceConsumerJSONConfig(handledNetworks, ['artifacts/networks.json'])
}
