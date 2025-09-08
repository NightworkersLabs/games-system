import create, { GetState, SetState } from 'zustand'

import web3Slice, { IWeb3Slice } from './slices/web3'
import gameSlice, { IGameSlice } from './slices/game'

import popupTxSlice, { IPopupTxSlice } from './slices/popup-tx/handler'
import securePopupTxSlice, { ISecurePopupTxSlice } from './slices/popup-tx/secure'

import casinoBankRulesSlice, { ICasinoBankRulesSlice } from './slices/casino-bank/rules'
import casinoBankSlice, { ICasinoBankSlice } from './slices/casino-bank/user-context'

import casinoAPISlice, { ICasinoAPISlice } from './slices/casino-api/user-context'

type AllSlices =
    IWeb3Slice & IGameSlice
    & IPopupTxSlice & ISecurePopupTxSlice
    & ICasinoBankRulesSlice & ICasinoBankSlice
    & ICasinoAPISlice

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
