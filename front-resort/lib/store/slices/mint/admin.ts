import { StoreSlice } from 'lib/store/_'
import { IPopupTxSlice } from '../popup-tx/handler'
import { IWeb3Slice } from '../web3'
import { IMintSlice } from './user-context'

export interface IMintAdminSlice {
  grantWhitelistTickets: (howMany: number, addr?: string) => void
  grantFreeMints: (howMany: number, addr?: string) => void
  activatePublicLaunch: () => void
  activateWhitelistLaunch: () => void
  toggleGamePaused: () => void
}

const slice: StoreSlice<IMintAdminSlice, IWeb3Slice & IMintSlice & IPopupTxSlice> = (set, get) => ({
  toggleGamePaused: () => get().setupStandardPopupTx({
    description: 'Minting: Toggle pause state',
    txFunc: () => get().mintingContract.setPaused(!get().mintingPaused),
    onSuccess: get().checkMintingPaused
  }),
  grantWhitelistTickets: (howMany, addr) => get().setupStandardPopupTx({
    description: 'Minting: add whitelist tickets',
    txFunc: () => get().mintingContract.grantManyWhitelistTickets([addr ?? get().currentEOAAddress], howMany),
    onSuccess: get().updateUserMintingContext$
  }),
  grantFreeMints: (howMany, addr) => get().setupStandardPopupTx({
    description: 'Minting: add free mints',
    txFunc: () => get().mintingContract.giveFreeMintsForMany([addr ?? get().currentEOAAddress], howMany),
    onSuccess: get().updateUserMintingContext$
  }),
  //
  activateWhitelistLaunch: () => get().setupStandardPopupTx({
    description: 'Minting: allow whitelisted',
    txFunc: get().mintingContract.declareWhitelistPeriod,
    onSuccess: get().checkWhitelistLaunch
  }),
  activatePublicLaunch: () => get().setupStandardPopupTx({
    description: 'Minting: Set public launch',
    txFunc: get().mintingContract.declarePublicLaunch,
    onSuccess: get().checkPublicLaunch
  })

})

export default slice
