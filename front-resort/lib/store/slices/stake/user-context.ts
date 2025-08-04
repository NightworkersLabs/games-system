import { StoreSlice } from 'lib/store/_'
import { SingleExecPromise } from 'lib/SingleExecPromise'
import { IWeb3Slice } from '../web3'
import { INFTCollectionSlice, NFTStakingState, OwnedNFT, TokenID } from './nft-collection'
import { BigNumber, ContractTransaction, Event } from 'ethers'
import { IStakeRulesSlice } from './rules'
import { IPopupTxSlice, TrustfulRequest } from '../popup-tx/handler'
import { IGameSlice } from '../game'
import { NWERC20_NAME } from 'env/defaults'

import produce from 'immer'

// define all bailout options available
export enum SneakOption {
    MoneyOut = 0,
    MoneyAndTokenOut = 1,
    TokenOut = 2
}

export type RawStakeData = BigNumber

export interface IStakeSlice {
  //
  getHookerUnclaimedRevenue: (nft: OwnedNFT) => BigNumber
  getHookerUnstakableDate: (nft: OwnedNFT) => Date
  refreshUnclaimedRevenue$: SingleExecPromise<void>
  updatePimpsUnclaimedRevenue$: SingleExecPromise<void>
  allUnclaimedRevenue?: BigNumber

  //
  updateRLDContext$: SingleExecPromise<void>
  refreshRSD$: SingleExecPromise<TokenID[]>

  //
  totalLollyEarned?: BigNumber
  totalHookersStaked?: number
  totalPimpsStaked?: number
  refreshStakingTotals: () => Promise<void>

  //
  refreshStakingState: () => Promise<void>
  isStakingAllowed?: boolean
  isSneakingPrevented?: boolean
  LOLLYLimitReachedAt?: Date

  refreshLOLLYPerNotoriety: () => Promise<void>
  LOLLYPerNotoriety?: BigNumber

  //
  mayToggleTokenSelection: (id: TokenID) => void

  //
  rescueMode: boolean
  toogleRescueMode: () => void
  putManyToWork: () => void
  sneakOutMany: (option: SneakOption) => void

  //
  latestHookersUnstakeResults?: {
    totalStolen: BigNumber
    totalGiven: BigNumber
    howManyStolen: number
    howManyGiven: number
  }
  clearHookersUnstakeResults: () => void
}

interface IPrivateSlice {
    //
    _refreshStakeData: (ids: TokenID[]) => Promise<void>
    _getRawStakeData: (tokenId: TokenID) => Promise<RawStakeData>

    //
    _getPimpUnclaimedRevenue: (nft: OwnedNFT, latestPimpLPN: RawStakeData) => BigNumber

    //
    _sneakOutMany: (ids: TokenID[], option: SneakOption, trustfulRequest: TrustfulRequest) => Promise<ContractTransaction>
    _unstakeMany: (ids: TokenID[], trustfulRequest: TrustfulRequest) => Promise<ContractTransaction>

    //
    _mutateSelectedTokens: (stakeState: NFTStakingState) => [TokenID[], boolean]
    _unmutateTokens: (tokenIds: TokenID[]) => void

    //
    _updatePimpsUnclaimedRevenue: () => Promise<void>

    //
    _refreshUnclaimedRevenue: () => void
}

const slice: StoreSlice<IStakeSlice & IPrivateSlice, IWeb3Slice & INFTCollectionSlice & IStakeRulesSlice & IPopupTxSlice & IGameSlice> = (set, get) => ({
  rescueMode: false,
  toogleRescueMode: () => set({ rescueMode: !get().rescueMode }),
  refreshRSD$: SingleExecPromise.from(ids => get()._refreshStakeData(ids)),
  updatePimpsUnclaimedRevenue$: SingleExecPromise.from(() => get()._updatePimpsUnclaimedRevenue()),
  refreshUnclaimedRevenue$: SingleExecPromise.of(() => get()._refreshUnclaimedRevenue()),
  updateRLDContext$: SingleExecPromise.from(() =>
    Promise.all([
      get().refreshStakingState(),
      get().refreshStakingTotals()
    ]).then()
  ),

  //
  clearHookersUnstakeResults: () => set({ latestHookersUnstakeResults: null }),

  //
  refreshStakingState: async () => {
    //
    const [
      secs,
      isStakingAllowed,
      isSneakingPrevented
    ] = await Promise.all([
      get().stakingContract.LOLLYLimitReachedAt() as Promise<number>,
      get().stakingContract.isStakingAllowed() as Promise<boolean>,
      get().stakingContract.paused() as Promise<boolean>
    ])

    //
    set({
      isStakingAllowed,
      isSneakingPrevented,
      LOLLYLimitReachedAt: secs ? new Date(secs * 1000) : null
    })
  },
  refreshLOLLYPerNotoriety: async () => set({
    LOLLYPerNotoriety: await get().stakingContract.LOLLYPerNotoriety()
  }),
  refreshStakingTotals: async () => {
    //
    const stakingContract = get().stakingContract

    //
    const [
      totalLollyEarned,
      totalHookersStaked,
      totalPimpsStaked
    ] = await Promise.all([
      stakingContract.totalLollyEarned() as Promise<BigNumber>,
      stakingContract.totalHookersStaked() as Promise<number>,
      stakingContract.totalPimpsStaked() as Promise<number>
    ])

    //
    set({
      totalLollyEarned,
      totalHookersStaked,
      totalPimpsStaked
    })
  },
  //
  //
  //
  putManyToWork: () => {
    //
    const [selected] = get()._mutateSelectedTokens('idle')

    //
    get().setupStandardPopupTx({
      description: 'Stake Night worker(s)',
      txFunc: () => get().stakingContract.putManyToWork(selected),
      onSuccess: () => {
        get().getNWERC20Balance$.raise()
        get().syncOwnedNFTs$.raise()
      },
      onFinally: () => get()._unmutateTokens(selected)
    })
  },
  sneakOutMany: option => {
    // check if selected ids contains hookers
    const [selected, containsHookers] = get()._mutateSelectedTokens('staked')

    //
    const onFinally = () => get()._unmutateTokens(selected)
    const onSuccess = (ev?: Event) => {
      //
      if (ev != null) {
        //
        const givenAmounts = ev.args.givenAmounts as BigNumber[]

        //
        const initiallyOwed = ev.args.initiallyOwed as BigNumber
        const totalGiven = givenAmounts.reduce((prev, curr) => prev.add(curr), BigNumber.from(0))
        const totalStolen = initiallyOwed.sub(totalGiven)

        //
        const howManyStolen = givenAmounts.reduce((prev, curr) => curr.isZero() ? ++prev : prev, 0)
        const howManyGiven = givenAmounts.length - howManyStolen

        //
        set({
          latestHookersUnstakeResults: {
            howManyGiven,
            howManyStolen,
            totalStolen,
            totalGiven
          }
        })
      }

      //
      if (option !== SneakOption.TokenOut) get().getNWERC20Balance$.raise()
      if (option !== SneakOption.MoneyOut) get().syncOwnedNFTs$.raise()
      if (option === SneakOption.MoneyOut) get().refreshRSD$.raise(selected)
    }

    // if contains hookers and unstaking with gains...
    if (containsHookers && option === SneakOption.MoneyAndTokenOut) {
      // ...use an end-to-end secure tx to ensure gains on hookers
      return get().setupEndToEndPopupTx({
        description: 'Unstake Night worker(s), including hooker(s)',
        contractToListen: get().stakingContract,
        eventsFilter: (c, nonce) => c.filters.UnstakedHookersRewards(nonce),
        submit: payload => get()._unstakeMany(selected, payload),
        purposeId: 1,
        onSuccess,
        onFinally
      })
    } else {
      //
      let description = 'Unstake Night worker(s)'
      if (option === SneakOption.MoneyOut) description = 'Claiming ' + NWERC20_NAME
      else if (option === SneakOption.TokenOut) description = 'Rescue Night worker(s)'

      // if not, use defaulting unprovable
      get().setupStandardPopupTx({
        description,
        txFunc: () => get()._sneakOutMany(selected, option, {}),
        onSuccess,
        onFinally
      })
    }
  },
  //
  //
  //
  _refreshUnclaimedRevenue: () => {
    const allUnclaimedRevenue = Object.values(get().ownedNFTs)
      .filter(ntf => ntf.stakingState === 'staked')
      .map(nft => {
        if (nft.isHooker) {
          return get().getHookerUnclaimedRevenue(nft)
        } else {
          return nft.pimp_unclamedRevenue ?? BigNumber.from(0)
        }
      })
      .reduce((prev, curr) => prev.add(curr), BigNumber.from(0))

    //
    set({ allUnclaimedRevenue })
  },
  getHookerUnclaimedRevenue: nft => {
    // get last claim date
    if (nft.hooker_lastClaim == null) return BigNumber.from(0)

    // if the blockchain timestamp is ahead of current time, just do not compute
    const nowMs = new Date().getTime()
    const thenMs = (get().LOLLYLimitReachedAt ?? nft.hooker_lastClaim).getTime()
    if (thenMs > nowMs) return BigNumber.from(0)

    // ceiled seconds elapsed
    const secs = Math.ceil((nowMs - thenMs) / 1_000)
    return get().LOLLYPerSecondMintableThroughStaking.mul(secs)
  },
  getHookerUnstakableDate: nft => {
    //
    const vestingPeriodInSecs = get().secsToWaitAfterLastClaim
    const lastClaimDate = nft.hooker_lastClaim ?? new Date()

    // adds vesting period to latest claim date
    const unstakableIn = new Date(
      lastClaimDate.getTime() + (vestingPeriodInSecs * 1_000)
    )

    //
    return unstakableIn
  },
  _getPimpUnclaimedRevenue: (nft, latestPimpLPN) => get().LOLLYPerNotoriety
    .sub(latestPimpLPN)
    .mul(nft.nScore),
  //
  //
  //
  _updatePimpsUnclaimedRevenue: async () => {
    //
    await get().refreshLOLLYPerNotoriety()

    // filter and get data
    const pimpsToUpdateWith =
            Object.values(get().ownedNFTs)
              .filter(nft => nft.isHooker === false && nft.stakingState === 'staked')
              .map(async nft => {
                //
                const rsd = await get()._getRawStakeData(nft.tokenId)

                //
                return {
                  id: nft.tokenId,
                  unclaimedRevenue: get()._getPimpUnclaimedRevenue(nft, rsd)
                }
              })

    // wait for results to pop
    const updateValues = await Promise.all(pimpsToUpdateWith)

    // update
    set(produce<INFTCollectionSlice>(state => {
      updateValues.forEach(({ id, unclaimedRevenue }) => {
        state.ownedNFTs[id].pimp_unclamedRevenue = unclaimedRevenue
      })
    }))
  },
  //
  //
  //
  _refreshStakeData: async ids => {
    //
    await get().refreshLOLLYPerNotoriety()

    // get all raw data
    const promises = ids.map(async id => ({
      id,
      rsd: await get()._getRawStakeData(id)
    }))

    // wait for them
    const rsds = await Promise.all(promises)

    // update
    set(produce<INFTCollectionSlice>(state => {
      rsds.forEach(({ id, rsd }) => {
        if (state.ownedNFTs[id].isHooker) {
          state.ownedNFTs[id].hooker_lastClaim = new Date(rsd.toNumber() * 1_000)
        } else {
          state.ownedNFTs[id].pimp_unclamedRevenue = get()._getPimpUnclaimedRevenue(state.ownedNFTs[id], rsd)
        }
      })
    }))
  },
  _getRawStakeData: tokenId => get().stakingContract.stakeDataOf(tokenId) as Promise<RawStakeData>,
  //
  //
  //
  mayToggleTokenSelection: tokenIdToToggle => {
    //
    const ownedNFTs = get().ownedNFTs
    const selectionState = ownedNFTs[tokenIdToToggle].selectionState

    // prevent selecting mutating NFT
    if (selectionState === 'mutating') {
      return
      // if trying to select 1 more NFT
    } else if (selectionState === 'unselected') {
      // get current stake state of toggling token
      const stakeState = ownedNFTs[tokenIdToToggle].stakingState

      // find how many NFTs are selected with the same stake state
      const howManySelectedWithSameSS =
                Object.values(ownedNFTs)
                  .filter(nft => nft.stakingState === stakeState && nft.selectionState === 'selected')
                  .length

      // find the associated stake state limit
      const limit = stakeState === 'idle' ? get().maximumEmployableAtOnce : get().maximumClaimAtOnce

      // if selecting this NFT bypass the limit, skip
      if (howManySelectedWithSameSS + 1 > limit) {
        return
      }
    }

    // update
    set(produce<INFTCollectionSlice>(state => {
      state.ownedNFTs[tokenIdToToggle].selectionState = selectionState === 'selected' ? 'unselected' : 'selected'
    }))
  },
  //
  //
  //
  _unmutateTokens: tokenIdsToRemove => set(produce<INFTCollectionSlice>(state => {
    tokenIdsToRemove.forEach(id => { state.ownedNFTs[id].selectionState = 'unselected' })
  })),
  _mutateSelectedTokens: stakeState => {
    // get all token that are selected
    const selectedNFTs = Object.values(get().ownedNFTs)
      .filter(nft => nft.selectionState === 'selected' && nft.stakingState === stakeState)

    //
    const hasHookersSelected = selectedNFTs.some(nft => nft.isHooker)

    //
    const selectedIds = selectedNFTs.map(nft => nft.tokenId)

    // change selected to mutating
    set(produce<INFTCollectionSlice>(state => {
      selectedIds.forEach(id => { state.ownedNFTs[id].selectionState = 'mutating' })
    }))

    //
    return [selectedIds, hasHookersSelected]
  },
  //
  //
  //
  _sneakOutMany: async (tokenIds, option, { seed, secretHash }) => {
    //
    const claimTax = option === SneakOption.TokenOut ? 0 : await get().stakingContract.getClaimTax(tokenIds.length)

    //
    return get().stakingContract.sneakOutMany(tokenIds, option, [seed ?? 0, secretHash ?? 0], {
      value: claimTax
    })
  },
  _unstakeMany: async (tokenIds, trustfulRequest) => {
    //
    const option = get().rescueMode ? SneakOption.TokenOut : SneakOption.MoneyAndTokenOut
    //
    return get()._sneakOutMany(tokenIds, option, trustfulRequest)
  }
})

export default slice
