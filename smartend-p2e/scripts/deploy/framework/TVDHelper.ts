import { SecretsStorage } from '@offchain-service/lib/provably-fair/secrets-provider'
import { TrustedValidatorDaemon } from '@offchain-service/lib/tv-daemon'
import { NightworkersContracts } from './NWContracts'

export default class TVDInstance extends TrustedValidatorDaemon {
  static fromContracts (contracts: NightworkersContracts, secretsStorage: SecretsStorage, recoverBlockNumber: number) : TrustedValidatorDaemon {
    return new TrustedValidatorDaemon({
      // use default signer of LOLLY contract, most probably is the owner
      trustedValidator: contracts.lolly.contract.signer,
      lotteryContractAddress: contracts.lottery.contract.address,
      nwContractAddress: contracts.nightworkersGame.contract.address,
      rldContractAddress: contracts.redLightDistrict.contract.address,
      tgContractAddress: contracts.tableGames.contract.address
    }, secretsStorage, recoverBlockNumber)
  }
}
