import { StoreSlice } from 'lib/store/_'
import { IPopupTxSlice } from '../popup-tx/handler'
import { IWeb3Slice } from '../web3'
import { IGameSlice } from '../game'
import { IVaultSlice } from './user-context'
import { parseEther } from 'ethers/lib/utils'
import { BigNumber } from 'ethers'
import { NWERC20_NAME } from 'env/defaults'

export interface IVaultAdminSlice {
  scheduleBRRound: (scheduleInSecs: number) => void
  mintNWERC20: (howMany: BigNumber) => void
}

const slice: StoreSlice<IVaultAdminSlice, IWeb3Slice & IVaultSlice & IPopupTxSlice & IGameSlice> = (set, get) => ({
  scheduleBRRound: scheduleInSecs => get().setupStandardPopupTx({
    description: 'Vault: Schedule new round',
    txFunc: () => get().backroomContract.scheduleRound(
      parseEther('0.1'),
      scheduleInSecs,
      60 * 10,
      {
        value: parseEther('6')
      }),
    onSuccess: get().updateBackroomContext$
  }),
  mintNWERC20: howMany => get().setupStandardPopupTx({
    description: 'Mint ' + NWERC20_NAME,
    txFunc: () => get().NWERC20Contract.$_mint(
      get().currentEOAAddress,
      howMany
    ),
    onSuccess: get().getNWERC20Balance$
  })
})

export default slice
