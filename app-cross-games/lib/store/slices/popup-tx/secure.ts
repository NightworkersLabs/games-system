import { StoreSlice } from 'lib/store/_'
import {
  AnySecurePopupTx,
  IPopupTxSlice,
  IProtectedPopupTxSlice,
  isApiSecurePopupTx
} from './handler'
import { IGameSlice } from 'lib/store/slices/game'
import { requestServerSecret, updateClientSeedFromPP } from 'lib/store/slices/_/trustful'
import { ICasinoBankSlice } from 'lib/store/slices/casino-bank/user-context'
import { runOnChainSecurePopupTx } from './runners/onchain'
import { runAPISecurePopupTx } from './runners/api'

//
//
//

export interface ISecurePopupTxSlice {
    updateClientSeedFromPP: (passPhrase: string, toUpdate: AnySecurePopupTx, txId: number) => void
    requestServerSecret: (toUpdate: AnySecurePopupTx, txId: number) => void
    runSecurePopupTx: (toUpdate: AnySecurePopupTx, txId: number) => void
}

const slice: StoreSlice<ISecurePopupTxSlice, IProtectedPopupTxSlice & IPopupTxSlice & IGameSlice & ICasinoBankSlice> = (set, get) => ({
  updateClientSeedFromPP: (passPhrase, toUpdate, txId) =>
    updateClientSeedFromPP(
      passPhrase,
      toUpdate,
      c => get()._mayUpdatePopupTxAndContinue(txId, { ...toUpdate, ...c })
    ),
  requestServerSecret: (toUpdate, txId) =>
    requestServerSecret(
      toUpdate,
      c => get()._mayUpdatePopupTxAndContinue(txId, { ...toUpdate, ...c })
    ),
  runSecurePopupTx: (toUpdate, txId) => {
    //
    if (isApiSecurePopupTx(toUpdate)) {
      return runAPISecurePopupTx({
        popupTx: toUpdate,
        popupTxId: txId,
        updater: () => get()._mayUpdatePopupTxAndContinue(txId, toUpdate),
        modalMinimizer: () => get().minimizePopupTx(),
        balanceRefresher: newBalance => get().updateChipsBalance(newBalance)
      })
    }

    //
    runOnChainSecurePopupTx({
      popupTx: toUpdate,
      popupTxId: txId,
      updater: () => get()._mayUpdatePopupTxAndContinue(txId, toUpdate),
      modalMinimizer: () => get().minimizePopupTx(),
      balanceRefresher: () => null
    })
  }
})

export default slice
