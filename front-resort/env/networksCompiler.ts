import networks from '../networks.json'
import more from '../networks.more'

//
export type AvailableNetwork = keyof typeof networks

//
export interface BasicNetworkMetadata {
  /** displayed network name */
  networkName: string
  /** name of the main value / current / token of the network (eg., AVAX, ETH...) */
  currencyName: string
  /** main color of the blockchain graphical identity (eg., #cb2222 ...) */
  color: string
  /** path / url to the blockchain logo */
  logo: string
}

//
export interface WithExplorer {
  /** url of the blockchain explorer */
  explorer: string
}

//
export interface LegitNetwork extends BasicNetworkMetadata, WithExplorer {}

//
export interface FaucetedNetwork {
  /** url of a service that can airdrop */
  faucet: string
}

//
export interface ForkedNetworkBase {
  /** name of an already handled  */
  forkOf: AvailableNetwork
}

//
export interface ForkedNetwork extends
  ForkedNetworkBase,
  Partial<FaucetedNetwork>,
  Partial<LegitNetwork> { }

export interface DebugNetwork extends BasicNetworkMetadata {
  /** if set to true, means it should be ignored in production environment */
  debugNetwork: true
}

export type NetworkDefinition = DebugNetwork | ForkedNetwork | LegitNetwork

//
export type HandledNetworksDefinition = {
  [networkName in AvailableNetwork]: NetworkDefinition
}

//
export function isForkedNetwork (object: NetworkDefinition): object is ForkedNetwork {
  return 'forkOf' in object
}

//
//
//

//
export interface BaseNetwork {
  url: string
  chainId: number
}

//
export type BaseNetworkConfig = {
  [networkName in AvailableNetwork]: BaseNetwork
}

const tbInfos: BaseNetworkConfig = networks

//
export interface WithForksNetwork {
  /** list of available networks that are dev / testnets */
  forks: AvailableNetwork[]
}

//
export type CompiledNetwork = NetworkDefinition & Partial<WithForksNetwork>

//
export type NetworksDefinition = {
  [networkName in AvailableNetwork]: CompiledNetwork
}

export type WithForkNetworks = {
  [networkName in AvailableNetwork]: AvailableNetwork[] | null
}

const getWithForkedNetworks = () =>
  Object.entries(more)
    // only get forked
    .filter(([, infos]) => isForkedNetwork(infos))
    // map AvailableNetwork (fork) => AvailableNetwork (main)
    .map(([contractName, infos]) =>
      ([contractName, (infos as ForkedNetwork).forkOf]) as [AvailableNetwork, AvailableNetwork]
    )
    // reduce to { main: fork[] }
    .reduce((p, [fork, main]) => {
      //
      if (!Array.isArray(p[main])) {
        p[main] = [fork]
      } else {
        p[main].push(fork)
      }
      //
      return p
    }, {} as WithForkNetworks)

//
export const getCompiledNetworkInfos = () => {
  //
  const wfn = getWithForkedNetworks()

  //
  const base = Object.fromEntries(
    Object.entries(tbInfos)
      //
      .map(([contractName, base]) => {
        // basic merge
        let compiled = Object.assign({}, base, more[contractName]) as CompiledNetwork

        // if is forked, duplicate informations from main network template, and overrides it
        if (isForkedNetwork(compiled)) {
          compiled = {
            ...more[compiled.forkOf],
            ...compiled
          }
        }

        // if any associated forks, bind them
        const associatedForks = wfn[contractName] as AvailableNetwork[]
        if (associatedForks) {
          compiled.forks = associatedForks
        }

        // then, merge with additionnal informations
        return [contractName, compiled]
      })
  ) as NetworksDefinition

  //
  return base
}
