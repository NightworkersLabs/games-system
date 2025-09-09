import type { StoreSlice } from '#/lib/store/_'
import { requestServerSecret, updateClientSeedFromPP } from '#/lib/store/slices/_/trustful'
import type { ICasinoBankSlice } from '#/lib/store/slices/casino-bank/user-context'
import type { IGameSlice } from '#/lib/store/slices/game'
import type {
  AnySecurePopupTx,
  IPopupTxSlice,
  IProtectedPopupTxSlice} from '#/lib/store/slices/popup-tx/handler';
import {
  isApiSecurePopupTx
} from '#/lib/store/slices/popup-tx/handler'
import { runAPISecurePopupTx } from '#/lib/store/slices/popup-tx/runners/api'
import { runOnChainSecurePopupTx } from '#/lib/store/slices/popup-tx/runners/onchain'

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
