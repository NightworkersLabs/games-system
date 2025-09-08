import { ITrustedValidatorEnv } from '@offchain-service/env/ITrustedValidatorEnv'
import { ethers } from 'hardhat'
import HHConfig from 'hardhat.config'
import { getCurrentRPCUrl, IEnvGenerator } from './IEnvGenerator'
import { NightworkersContext } from 'scripts/deploy/framework/NWContext'

export class TrustedValidatorEnvGenerator extends IEnvGenerator<ITrustedValidatorEnv> {
  private static _getTrustedValidatorPrivateKeyOrMnemo () {
    switch (ethers.provider.network.chainId) {
    case HHConfig.networks.local.chainId:
      return HHConfig.networks.local.accounts[0]
    case HHConfig.networks.avalanche.chainId:
      return HHConfig.networks.avalanche.accounts.mnemonic
    case HHConfig.networks.fuji.chainId:
      return HHConfig.networks.fuji.accounts.mnemonic
    default:
      // default hardhat 1st account
      return '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
    }
  }

  override generate (context: NightworkersContext) {
    return {
      CHAIN_ID: ethers.provider.network.chainId,
      MNEMO_OR_PRIV_KEY: TrustedValidatorEnvGenerator._getTrustedValidatorPrivateKeyOrMnemo(),
      RPC_URL: getCurrentRPCUrl(),
      LOTTERY: context.lottery.contract.address,
      NIGHTWORKERS_GAME: context.nightworkersGame.contract.address,
      RED_LIGHT_DISTRICT: context.redLightDistrict.contract.address,
      TABLE_GAMES: context.tableGames.contract.address
    }
  }
}
