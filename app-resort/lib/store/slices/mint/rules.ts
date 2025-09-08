import { StoreSlice } from 'lib/store/_'
import { IWeb3Slice } from 'lib/store/slices/web3'
import { BigNumber, Contract } from 'ethers'

export interface IMintRulesSlice {
  //
  mintRulesFetched: boolean
  mayUpdateMintRules: () => Promise<void>

  //
  //
  //
  maxNFTMintAtOnce?: number

  //
  basePayableMintPrice? : BigNumber
  wlPayableMintPrice?: BigNumber
  scarcePayableMintPrice? : BigNumber

  //
  maxMintableNFTs?: number
  payableNFTScarceAt?: number
  payableNFTUntil?: number
  pricierNFTAt?: number
  evenPricierNFTAt?: number

  //
  baseNWERC20MintPrice?: BigNumber
  pricerNWERC20MintPrice?: BigNumber
  evenPricierNWERC20MintPrice?: BigNumber
}

interface IPrivateSlice {
    _getMintRules: (mc: Contract) => Promise<void>
    _getPayableMintPrices: (mc: Contract) => Promise<void>
    _getMintPriceThresholds: (mc: Contract) => Promise<void>
    _getNWERC20MintPrices: (mc: Contract) => Promise<void>
}

const slice: StoreSlice<IMintRulesSlice & IPrivateSlice, IWeb3Slice> = (set, get) => ({
  //
  mintRulesFetched: false,
  //
  mayUpdateMintRules: async () => {
    // no need to refetch rules
    if (get().mintRulesFetched) return

    //
    const mintingContract = get().mintingContract

    //
    return Promise.all([
      get()._getPayableMintPrices(mintingContract),
      get()._getMintPriceThresholds(mintingContract),
      get()._getNWERC20MintPrices(mintingContract),
      get()._getMintRules(mintingContract)
    ]).then(() => set({ mintRulesFetched: true }))
  },
  _getNWERC20MintPrices: async mc => {
    //
    const [
      baseNWERC20MintPrice,
      pricerNWERC20MintPrice,
      evenPricierNWERC20MintPrice
    ] = await Promise.all([
      mc.MINT_BASE_PRICE() as Promise<BigNumber>,
      mc.PRICIER_TOKEN_PRICE() as Promise<BigNumber>,
      mc.EVEN_PRICIER_TOKEN_PRICE() as Promise<BigNumber>
    ])

    //
    set({
      baseNWERC20MintPrice,
      pricerNWERC20MintPrice,
      evenPricierNWERC20MintPrice
    })
  },
  _getMintPriceThresholds: async mc => {
    //
    const [
      maxMintableNFTs,
      payableNFTScarceAt,
      payableNFTUntil,
      pricierNFTAt,
      evenPricierNFTAt
    ] = await Promise.all([
      mc.MAX_TOKENS() as Promise<number>,
      mc.PAYABLE_TOKENS_SCARCE_AT() as Promise<number>,
      mc.PAYABLE_TOKENS_UNTIL() as Promise<number>,
      mc.PRICIER_TOKEN_AT() as Promise<number>,
      mc.EVEN_PRICIER_TOKEN_AT() as Promise<number>
    ])

    //
    set({
      maxMintableNFTs,
      payableNFTScarceAt,
      payableNFTUntil,
      pricierNFTAt,
      evenPricierNFTAt
    })
  },
  _getPayableMintPrices: async mc => {
    //
    const [
      basePayableMintPrice,
      scarcePayableMintPrice,
      wlPayableMintPrice
    ] = await Promise.all([
      mc.getBasePayableMintPrice() as Promise<BigNumber>,
      mc.getScarcePayableMintPrice() as Promise<BigNumber>,
      mc.getWhitelistedPayableMintPrice() as Promise<BigNumber>
    ])

    //
    set({
      basePayableMintPrice,
      scarcePayableMintPrice,
      wlPayableMintPrice
    })
  },
  _getMintRules: async mc => set({
    maxNFTMintAtOnce: await mc.MAX_MINT()
  })
})

export default slice
