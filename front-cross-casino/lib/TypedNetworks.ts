import _networks from 'networks.compiled.json'

import _deployed from 'deployed.json'

import { AvailableNetwork, CompiledNetwork } from 'env/networksCompiler'
import { getNWExecutionContextFromEnv } from 'env/defaults'

//
// TYPED NETWORKS
//

//
export type ExtraCompiledNetwork = {name : AvailableNetwork} & CompiledNetwork

//
export type ExtraNetworksDefinition = {
  [networkName in AvailableNetwork]: ExtraCompiledNetwork
}

/** @dev forced matching with ExtraNetworksDefinition */
export const allNetworks = Object.fromEntries(
  Object.entries(_networks)
    .map(([n, p]) => [n, { ...p, name: n }])
) as ExtraNetworksDefinition

/** @dev forced matching with ExtraNetworksDefinition */
export const handledNetworks = Object.fromEntries(
  Object.entries(allNetworks)
    .filter(([, network]) => {
      //
      const cEnv = getNWExecutionContextFromEnv()

      // if dev env. ...
      if (cEnv === 'dev?') {
        // ... only allows debug networks
        return 'debugNetwork' in network

        // ...allow all configured networks
        // return true
      }

      //
      const hasFaucet = 'faucet' in network

      //
      return (
        // if PRODUCTION env...
        cEnv === 'prod'
          ? !hasFaucet // requires network WITH NO faucet
          : hasFaucet// if NOT PRODUCTION env, requires network WITH faucet
      ) && !('debugNetwork' in network) // either ways, skips debugNetworks
    })
) as ExtraNetworksDefinition

//
export const handledChainIds = Object.entries(handledNetworks).map(([, network]) => network.chainId)

/** @returns handled network with a specific chainId */
export const networksByChainId =
Object.fromEntries(
  Object.entries(allNetworks)
    .map(([, network]) => ([network.chainId, network] as const))
)

/** @returns handled network with a specific chainId (w/ hex-repesentation) */
export const getCompiledNetworkHex = (chainId: string) => Object.entries(handledNetworks)
  .map(([, data]) => data)
  .find(data => data.chainIdHex === chainId)

//
// TYPED DEPLOYED CONTRACTS
//

//
export type AvailableContracts = keyof typeof _deployed

export type HandledNetworksByContract = {
  [networkName in AvailableNetwork]: string[]
}

//
export type DeployedContracts = {
  [contractName in AvailableContracts]: HandledNetworksByContract
}

export const deployed: DeployedContracts = _deployed
