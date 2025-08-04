import { IBaseEnvTemplate } from '@offchain-service/env/_base/template'
import { network } from 'hardhat'
import { IEnvGenerator } from './IEnvGenerator'
import { HardhatNetworkHDAccountsConfig } from 'hardhat/types'

export class OffchainServiceEnvGenerator extends IEnvGenerator<IBaseEnvTemplate> {
  static _getTrustedValidatorPrivateKeyOrMnemo () : string {
    //
    if (Array.isArray(network.config.accounts) && network.config.accounts.length > 0) {
      if (typeof network.config.accounts[0] === 'string') {
        return network.config.accounts[0]
      } else {
        return network.config.accounts[0].privateKey
      }
    }

    //
    if (['hardhat', 'localhost'].includes(network.name)) {
      // default hardhat 1st account
      return '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
    }

    //
    return (network.config.accounts as HardhatNetworkHDAccountsConfig)?.mnemonic ?? '[UNKNOWN]'
  }

  override generate () {
    return {
      MNEMO_OR_PRIV_KEY: OffchainServiceEnvGenerator._getTrustedValidatorPrivateKeyOrMnemo()
    }
  }
}
