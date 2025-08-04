import { StoreSlice } from 'lib/store/_'
import { SingleExecPromise } from 'lib/SingleExecPromise'
import { IWeb3Slice } from '../web3'
import { BigNumber, Contract } from 'ethers'
import { NWERC721GameMetadata } from 'pages/api/ERC721'

import produce from 'immer'
import { IStakeSlice } from './user-context'

export type TokenID = number

export type NFTStakingState = 'staked' | 'idle'
export type NFTSelectionState = 'mutating' | 'selected' | 'unselected'

export interface OwnedNFT extends NWERC721GameMetadata {
    /** defines who own / at which contract is hold this NFT
     * @dev "idle" means it is owed by its legitimate holder, "staked" means RLD contract owns it for $LOLLY
     */
    stakingState: NFTStakingState
    /** NFT that state is under mutation, eg. updated / moving... */
    selectionState: NFTSelectionState
    pimp_unclamedRevenue?: BigNumber
    hooker_lastClaim?: Date
}

export type OwnedNFTStore = {
    [tokenId: number]: OwnedNFT;
}

interface OwnedTokenIDs {
    staked: TokenID[]
    idle: TokenID[]
    all: TokenID[]
}

function getIdsByStakingState (store: OwnedNFTStore) : OwnedTokenIDs {
  return {
    staked: Object.values(store).filter(nft => nft.stakingState === 'staked').map(nft => nft.tokenId),
    idle: Object.values(store).filter(nft => nft.stakingState === 'idle').map(nft => nft.tokenId),
    all: Object.values(store).map(nft => nft.tokenId)
  }
}

export interface INFTCollectionSlice {
  ownedNFTs: OwnedNFTStore
  syncOwnedNFTs$: SingleExecPromise<void>
}

interface IPrivateSlice {
    _getOwnedTokenIdsOf: (contract: Contract) => Promise<TokenID[]>
    _diffUpdateOwnedTokens : (previous: OwnedTokenIDs, current: OwnedTokenIDs) => Promise<void>
    _getOwnedTokenIds: () => Promise<OwnedTokenIDs>
    _getNFTMetadata: (tokenId: TokenID) => Promise<NWERC721GameMetadata>
    _syncOwnedNFTs: () => Promise<void>
}

const slice: StoreSlice<INFTCollectionSlice & IPrivateSlice, IWeb3Slice & IStakeSlice> = (set, get) => ({
  ownedNFTs: {},
  //
  _getOwnedTokenIdsOf: async contract => {
    //
    const currentAddress = get().currentEOAAddress

    // can realistically cast to number
    const howManyNFTOwned = (await contract.balanceOf(currentAddress) as BigNumber).toNumber()

    //
    const allOwnedIds =
            Array.from({ length: howManyNFTOwned })
              .map(async (_, i) => {
                const bn: BigNumber = await contract.tokenOfOwnerByIndex(currentAddress, i)
                return bn.toNumber()
              })

    //
    return Promise.all(allOwnedIds)
  },
  _getOwnedTokenIds: async () => {
    //
    const [idle, staked] = await Promise.all([
      get()._getOwnedTokenIdsOf(get().mintingContract),
      get()._getOwnedTokenIdsOf(get().stakingContract)
    ])

    //
    const all = mergeUnique(idle, staked)

    //
    return { idle, staked, all }
  },
  _getNFTMetadata: async tokenId => {
    return (get().mintingContract.tokenURI(tokenId) as Promise<string>)
      .then(url => fetch(url + '&g'))
      .then(r => r.json())
  },
  _diffUpdateOwnedTokens: async (previous, current) => {
    // get all NFTs to remove from store
    const removedIds = previous.all.filter(x => !current.all.includes(x))

    // get all NFTs metadata to add to store
    const newIds = current.all.filter(x => !previous.all.includes(x))
    const newNFTPromises = newIds.map<Promise<OwnedNFT>>(async id => {
      //
      const metadata = await get()._getNFTMetadata(id)

      //
      return {
        ...metadata,
        selectionState: 'unselected',
        stakingState: current.idle.includes(id) ? 'idle' : 'staked'
      }
    })

    //
    const newNFTs = await Promise.all(newNFTPromises)

    // get all NFTs that toggled
    const fromIdleToStaked = previous.idle.filter(x => current.staked.includes(x))
    const fromStakedToIdle = previous.staked.filter(x => current.idle.includes(x))
    const idsToToggle = mergeUnique(fromIdleToStaked, fromStakedToIdle)

    // remove / add to store + toggle
    set(produce<INFTCollectionSlice>(state => {
      removedIds.forEach(i => { delete state.ownedNFTs[i] })
      newNFTs.forEach(nft => { state.ownedNFTs[nft.tokenId] = nft })
      idsToToggle.forEach(i => {
        state.ownedNFTs[i].stakingState =
                    state.ownedNFTs[i].stakingState === 'idle'
                      ? 'staked'
                      : 'idle'
      })
      fromStakedToIdle.forEach(i => {
        state.ownedNFTs[i].hooker_lastClaim = null
        state.ownedNFTs[i].pimp_unclamedRevenue = null
      })
    }))
  },
  syncOwnedNFTs$: SingleExecPromise.from(() => get()._syncOwnedNFTs()),
  _syncOwnedNFTs: async () => {
    //
    const previous = getIdsByStakingState(get().ownedNFTs)
    const current = await get()._getOwnedTokenIds()

    //
    await get()._diffUpdateOwnedTokens(previous, current)

    //
    const newlyStakedIds = current.staked.filter(x => !previous.staked.includes(x))
    await get().refreshRSD$.raise(newlyStakedIds)
  }
})

export default slice

//
//
//

export function mergeUnique (source: number[], toMerge: number[]) : number[] {
  return [
    ...source.filter(x => !toMerge.includes(x)),
    ...toMerge
  ].sort((a, b) => a - b)
}
