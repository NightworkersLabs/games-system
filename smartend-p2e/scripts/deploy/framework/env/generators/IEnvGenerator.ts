import { ethers } from 'hardhat'
import { NightworkersContext } from 'scripts/deploy/framework/NWContext'
import HHConfig from 'hardhat.config'

export abstract class IEnvGenerator<BaseEnv> {
  public abstract generate (context: NightworkersContext) : BaseEnv
}

export function getCurrentRPCUrl () {
  switch (ethers.provider.network.chainId) {
  case HHConfig.networks.avalanche.chainId:
    return HHConfig.networks.avalanche.url
  case HHConfig.networks.fuji.chainId:
    return HHConfig.networks.fuji.url
  case HHConfig.networks.local.chainId:
  default:
    return ethers.provider.connection.url
  }
}
