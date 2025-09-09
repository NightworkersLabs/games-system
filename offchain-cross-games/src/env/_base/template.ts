import { Wallet } from 'ethers'

import { Provider } from '@ethersproject/abstract-provider'

import { type IBaseEnvTemplate } from './template.types'

//
//
//

//
export const getWallet = (env: IBaseEnvTemplate, provider: Provider) => {
  // is mnemo
  if (env.MNEMO_OR_PRIV_KEY.includes(' ')) {
    const wallet = Wallet.fromMnemonic(env.MNEMO_OR_PRIV_KEY)
    return wallet.connect(provider)
  }

  // is private key
  return new Wallet(env.MNEMO_OR_PRIV_KEY, provider)
}
