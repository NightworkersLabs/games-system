import { isProdEnv } from '#env/defaults'
import chalk from 'chalk'
import fs from 'fs-extra'
import { resolve } from 'path'
import { type CasinoBlockchainConfiguration } from './configuration'

//
export const NETWORKS_CONFIGURATION_FILE_PATH = './networks.json'
const DEPLOYED_CONTRACTS_CONFIGURATION_FILE_PATH = './deployed.json'

//
const FILTERED_NETWORK_FOR_DEV = 'hardhat'

//
export const getCasinoBlockchainConfigurations = () : CasinoBlockchainConfiguration[] => {
  //
  const resolvedNetworks = resolve(NETWORKS_CONFIGURATION_FILE_PATH)
  const resolvedDeployed = resolve(DEPLOYED_CONTRACTS_CONFIGURATION_FILE_PATH)

  //
  const networks = fs.readJSONSync(resolvedNetworks) as { [networkName: string]: { url: string, chainId: number }}
  const deployed = fs.readJSONSync(resolvedDeployed)

  //
  const networksEntries = Object.entries(networks)

  // CHECK : has networks defined
  if (networksEntries.length === 0) {
    throw new Error(`No network was defined into [${resolvedNetworks}]. Please regenerate this file using the "smartend" project.`)
  }

  //
  const isProductionEnv = isProdEnv()
  if (!isProductionEnv) {
    console.log(chalk.yellow(`Since we are not in a production environment, only "${FILTERED_NETWORK_FOR_DEV}" network will be mounted.`))
  } else {
    console.log(chalk.bgGrey(`Since we are in a production environment, "${FILTERED_NETWORK_FOR_DEV}" network will be ignored.`))
  }

  //
  return networksEntries
    .filter(([networkName]) => {
      if (isProductionEnv) return networkName !== FILTERED_NETWORK_FOR_DEV
      else return networkName === FILTERED_NETWORK_FOR_DEV
    })
    .map(([networkName, network]) => {
      // take first in list contract
      const bankContract = (deployed?.CasinoBank?.[networkName][0] as string)

      //
      if (bankContract == null) {
        throw new Error(`Could not find a [CasinoBank] contract for "${networkName}" network in [${resolvedDeployed}].`)
      }

      //
      if (network.chainId == null || typeof network.chainId !== 'number') {
        throw new Error(`Invalid chainId for "${networkName}" network, number expected.`)
      }

      //
      if (network.url == null) {
        throw new Error(`Invalid url for "${networkName}" network, string expected.`)
      }

      //
      console.log(`== Setting up [CasinoBank] on "${networkName}" =>`, network)

      //
      return {
        bankContract,
        ...network
      }
    })
}
