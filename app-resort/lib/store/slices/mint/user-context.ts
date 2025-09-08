import { SingleExecPromise } from 'lib/SingleExecPromise'
import { StoreSlice } from 'lib/store/_'
import { IWeb3Slice } from '../web3'
import { BigNumber, ContractTransaction } from 'ethers'
import { IPopupTxSlice, TrustfulHandler } from '../popup-tx/handler'
import { INFTCollectionSlice } from '../stake/nft-collection'
import { IGameSlice } from '../game'
import { IMintRulesSlice } from './rules'

export interface CompositeMintPrice {
    price: BigNumber
    currency: 'BLOCKCHAIN_CURRENCY' | 'NWERC20'
}

export interface IMintSlice {
    //
    mintingPaused?: boolean
    checkMintingPaused: () => Promise<void>
    publicLaunch?: boolean
    checkPublicLaunch: () => Promise<void>
    whitelistLaunch?: boolean
    checkWhitelistLaunch: () => Promise<void>

    //
    howManyMinted?: number
    howManyRevealed?: BigNumber
    currentUserMintPrice?: CompositeMintPrice
    updateUserMintingContext$: SingleExecPromise

    //
    discountedMintsLeft: number
    freeMintsLeft: number

    //
    latestMintResults?: {
        ownedCount: number
        stolenCount: number
    }
    clearLatestMintResults: () => void

    //
    howManyToMint: number
    setHowManyToMint: (howMany: number) => void

    //
    secureMint: () => void
}

interface IPrivateSlice {
    _updateHowManyMinted: () => Promise<void>
    _orderMint: TrustfulHandler<ContractTransaction>
    _updateCurrentUserMintPrice: () => Promise<CompositeMintPrice | null>
    _updateSpecialMintPrices: () => Promise<void>
    _updateUserMintingContext: () => Promise<void>
    _getMaximumUserMintsAtOnce: () => number
}

const slice: StoreSlice<IMintSlice & IPrivateSlice, IWeb3Slice & IPopupTxSlice & INFTCollectionSlice & IGameSlice & IMintRulesSlice> = (set, get) => ({
  //
  howManyToMint: 1,
  discountedMintsLeft: 0,
  freeMintsLeft: 0,

  updateUserMintingContext$: SingleExecPromise.from(() => get()._updateUserMintingContext()),
  _updateUserMintingContext: async () => {
    // handle independent value fetching promises first
    await Promise.all([
      get().checkMintingPaused(),
      get().checkPublicLaunch(),
      get().checkWhitelistLaunch(),
      get()._updateSpecialMintPrices(),
      get()._updateHowManyMinted()
    ])

    // handle value-dendent promise then
    await get()._updateCurrentUserMintPrice()

    // update how much the user can mint at once
    const howManyToMint = get().howManyToMint
    const maxUserMAO = get()._getMaximumUserMintsAtOnce()
    if (howManyToMint > maxUserMAO) {
      set({ howManyToMint: maxUserMAO })
    }
  },
  _updateHowManyMinted: async () => {
    const [howManyRevealed, howManyMinted] = await Promise.all([
      get().mintingContract.totalSupply() as Promise<BigNumber>,
      get().mintingContract.minted() as Promise<number>
    ])

    //
    set({ howManyMinted, howManyRevealed })
  },
  checkMintingPaused: async () => set({ mintingPaused: await get().mintingContract.paused() }),

  //
  setHowManyToMint: howMany => {
    //
    if (howMany < 1) return
    else if (howMany > get()._getMaximumUserMintsAtOnce()) return

    //
    set({ howManyToMint: howMany })
  },

  //
  _getMaximumUserMintsAtOnce: () => {
    const maxNFTMintAtOnce = get().maxNFTMintAtOnce
    const mintableRemaining = (get().maxMintableNFTs - get().howManyMinted)
    return get().freeMintsLeft || get().discountedMintsLeft || (
      mintableRemaining > maxNFTMintAtOnce ? maxNFTMintAtOnce : mintableRemaining
    )
  },

  //
  clearLatestMintResults: () => set({ latestMintResults: null }),

  //
  secureMint: () => get().setupEndToEndPopupTx({
    description: 'Mint NFT(s)',
    submit: get()._orderMint,
    contractToListen: get().mintingContract,
    purposeId: 0,
    eventsFilter: (contract, nonce) => contract.filters.MintOrderProcessed(nonce),
    onSuccess: ev => {
      //
      const { ownedCount, stolenCount } = ev.args

      //
      set({
        latestMintResults: {
          ownedCount,
          stolenCount
        }
      })

      //
      get().syncOwnedNFTs$.raise()
      get().updateUserMintingContext$.raise()
    }
  }),

  //
  _orderMint: ({ seed, secretHash }) => {
    //
    const howMany = get().howManyToMint
    const mintPrice = get().currentUserMintPrice
    const freeMintsLeft = get().freeMintsLeft

    let bcCurrencyPrice : BigNumber | number = 0
    if (mintPrice.currency === 'BLOCKCHAIN_CURRENCY' && freeMintsLeft === 0) {
      bcCurrencyPrice = mintPrice.price.mul(howMany)
    }

    //
    set({ howManyToMint: 1 })

    //
    return get().mintingContract.orderMint(howMany, [seed ?? 0, secretHash ?? 0], { value: bcCurrencyPrice })
  },
  _updateSpecialMintPrices: async () => {
    //
    const minting = get().mintingContract

    //
    const [
      discountedMintsLeft,
      freeMintsLeft
    ] = await Promise.all([
      minting.usableWhitelistTicketsLeft() as Promise<number>,
      minting.freeMintsRemaining() as Promise<number>
    ])

    //
    set({
      discountedMintsLeft,
      freeMintsLeft
    })
  },
  checkPublicLaunch: async () => set({ publicLaunch: await get().mintingContract.isPubliclyLaunched() }),
  checkWhitelistLaunch: async () => set({ whitelistLaunch: await get().mintingContract.isInWhitelistPeriod() }),
  _updateCurrentUserMintPrice: async () => {
    // if not mintable...
    const howManyMinted = get().howManyMinted
    if (howManyMinted >= get().maxMintableNFTs) {
      set({ currentUserMintPrice: null })
      return null
    }

    let currentUserMintPrice : CompositeMintPrice

    // if not payable with blockchain current
    if (howManyMinted >= get().payableNFTUntil) {
      currentUserMintPrice = {
        price: await get().mintingContract.lollyMintCost(),
        currency: 'NWERC20'
      }
    } else {
      currentUserMintPrice = {
        price: await get().mintingContract.estimatePayableMintPrice(),
        currency: 'BLOCKCHAIN_CURRENCY'
      }
    }

    // update and return
    set({ currentUserMintPrice })
    return currentUserMintPrice
  }
})

export default slice
