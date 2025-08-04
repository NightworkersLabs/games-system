import { ethers } from 'hardhat'
import { NightworkersContext } from 'scripts/deploy/framework/NWContext'
import { defaultTrustedValidatorPort } from '@offchain-service/env/defaults'
import { getCurrentRPCUrl, IEnvGenerator } from './IEnvGenerator'

export class IDAppEnv {
  NEXT_PUBLIC_RPC_URL: string
  NEXT_PUBLIC_CHAIN_ID: number
  NEXT_PUBLIC_CHAIN_NAME: string

  //
  NEXT_PUBLIC_NIGHTWORKERS_GAME: string
  NEXT_PUBLIC_RED_LIGHT_DISTRICT: string
  NEXT_PUBLIC_TABLE_GAMES: string
  NEXT_PUBLIC_LOTTERY: string
  NEXT_PUBLIC_LOLLY: string
  NEXT_PUBLIC_BACKROOM: string

  //
  NEXT_PUBLIC_SECRET_PROVIDER_URL: string
}

export class DAppEnvGenerator extends IEnvGenerator<IDAppEnv> {
  private static _getChainName (chainId: number) {
    //
    switch (chainId) {
    case 31337:
    case 1337:
      return 'Local Hardhat'
    case 43112:
      return 'Local Avalanche'
    case 43113:
      return 'FUJI Avalanche'
    case 43114:
      return 'Mainnet Avalanche'
    }

    //
    return 'Unknown'
  }

  override generate (context: NightworkersContext) {
    return {
      NEXT_PUBLIC_RPC_URL: getCurrentRPCUrl(),
      NEXT_PUBLIC_CHAIN_ID: ethers.provider.network.chainId,
      NEXT_PUBLIC_CHAIN_NAME: DAppEnvGenerator._getChainName(ethers.provider.network.chainId),

      //
      NEXT_PUBLIC_NIGHTWORKERS_GAME: context.nightworkersGame.contract.address,
      NEXT_PUBLIC_RED_LIGHT_DISTRICT: context.redLightDistrict.contract.address,
      NEXT_PUBLIC_TABLE_GAMES: context.tableGames.contract.address,
      NEXT_PUBLIC_LOTTERY: context.lottery.contract.address,
      NEXT_PUBLIC_LOLLY: context.lolly.contract.address,
      NEXT_PUBLIC_BACKROOM: context.backroom.contract.address,

      //
      NEXT_PUBLIC_SECRET_PROVIDER_URL: `http://127.0.0.1:${defaultTrustedValidatorPort}`
    }
  }
}
