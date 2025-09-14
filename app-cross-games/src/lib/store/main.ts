import type { GetState, SetState } from 'zustand';
import { create } from 'zustand'

import type { ICasinoAPISlice } from '#/src/lib/store/slices/casino-api/user-context';
import casinoAPISlice from '#/src/lib/store/slices/casino-api/user-context'
import type { ICasinoBankRulesSlice } from '#/src/lib/store/slices/casino-bank/rules';
import casinoBankRulesSlice from '#/src/lib/store/slices/casino-bank/rules'
import type { ICasinoBankSlice } from '#/src/lib/store/slices/casino-bank/user-context';
import casinoBankSlice from '#/src/lib/store/slices/casino-bank/user-context'
import type { IGameSlice } from '#/src/lib/store/slices/game';
import gameSlice from '#/src/lib/store/slices/game'
import type { IPopupTxSlice } from '#/src/lib/store/slices/popup-tx/handler';
import popupTxSlice from '#/src/lib/store/slices/popup-tx/handler'
import type { ISecurePopupTxSlice } from '#/src/lib/store/slices/popup-tx/secure';
import securePopupTxSlice from '#/src/lib/store/slices/popup-tx/secure'
import type { IWeb3Slice } from '#/src/lib/store/slices/web3';
import web3Slice from '#/src/lib/store/slices/web3'

type AllSlices =
    IWeb3Slice & IGameSlice
    & IPopupTxSlice & ISecurePopupTxSlice
    & ICasinoBankRulesSlice & ICasinoBankSlice
    & ICasinoAPISlice

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createRootSlice = (set: SetState<any>, get: GetState<any>) => ({
  ...web3Slice(set, get),
  ...gameSlice(set, get),
  //
  ...popupTxSlice(set, get),
  ...securePopupTxSlice(set, get),
  //
  ...casinoBankSlice(set, get),
  ...casinoBankRulesSlice(set, get),
  //
  ...casinoAPISlice(set, get)
})

export const useNWStore = create<AllSlices>(createRootSlice)
