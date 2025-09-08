import create, { GetState, SetState } from 'zustand'

import web3Slice, { IWeb3Slice } from './slices/web3'
import gameSlice, { IGameSlice } from './slices/game'

import mintAdminSlice, { IMintAdminSlice } from './slices/mint/admin'
import mintRulesSlice, { IMintRulesSlice } from './slices/mint/rules'
import mintSlice, { IMintSlice } from './slices/mint/user-context'

import stakeAdminSlice, { IStakeAdminSlice } from './slices/stake/admin'
import stakeRulesSlice, { IStakeRulesSlice } from './slices/stake/rules'
import stakeSlice, { IStakeSlice } from './slices/stake/user-context'
import nftCollectionSlice, { INFTCollectionSlice } from './slices/stake/nft-collection'

import lotteryRulesSlice, { ILotteryRulesSlice } from './slices/lottery/rules'
import lotterySlice, { ILotterySlice } from './slices/lottery/user-context'

import tableGamesRulesSlice, { ITableGamesRulesSlice } from './slices/table-games/rules'
import tableGamesSlice, { ITableGamesSlice } from './slices/table-games/user-context'

import vaultAdminSlice, { IVaultAdminSlice } from './slices/vault/admin'
import vaultSlice, { IVaultSlice } from './slices/vault/user-context'

import popupTxSlice, { IPopupTxSlice } from './slices/popup-tx/handler'
import securePopupTxSlice, { ISecurePopupTxSlice } from './slices/popup-tx/secure'

type AllSlices =
    IWeb3Slice & IGameSlice
    & IMintAdminSlice & IMintRulesSlice & IMintSlice
    & IStakeAdminSlice & IStakeRulesSlice & IStakeSlice & INFTCollectionSlice
    & ILotteryRulesSlice & ILotterySlice
    & ITableGamesRulesSlice & ITableGamesSlice
    & IVaultAdminSlice & IVaultSlice
    & IPopupTxSlice & ISecurePopupTxSlice

const createRootSlice = (set: SetState<any>, get: GetState<any>) => ({
  ...web3Slice(set, get),
  ...gameSlice(set, get),
  //
  ...popupTxSlice(set, get),
  ...securePopupTxSlice(set, get),
  //
  ...mintRulesSlice(set, get),
  ...mintSlice(set, get),
  ...mintAdminSlice(set, get),
  //
  ...stakeRulesSlice(set, get),
  ...stakeSlice(set, get),
  ...nftCollectionSlice(set, get),
  ...stakeAdminSlice(set, get),
  //
  ...lotteryRulesSlice(set, get),
  ...lotterySlice(set, get),
  //
  ...tableGamesRulesSlice(set, get),
  ...tableGamesSlice(set, get),
  //
  ...vaultAdminSlice(set, get),
  ...vaultSlice(set, get)
})

export const useNWStore = create<AllSlices>(createRootSlice)
