import { BigNumber, Contract, Wallet } from 'ethers'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'

import { NightworkersContext } from 'scripts/deploy/framework/NWContext'
import { TraitsPack } from 'nft-assets/read'
import { TrustedValidatorDaemon } from '@offchain-service/lib/tv-daemon'
import { SecretsStorage } from '@offchain-service/lib/provably-fair/secrets-provider'
import { MintOrderer } from './_helpers'

//
export type SignersStore = {
  owner: SignerWithAddress
  wl: SignerWithAddress
  broke: Wallet
}

//
export type PayableMintPrices = {
  base: BigNumber
  wl: BigNumber
  scarce: BigNumber
}

export type PackedNFTAssets = {
  hooker: TraitsPack[]
  pimp: TraitsPack[]
}

//
declare module 'mocha' {
  export interface Context {
    //
    nwContext: NightworkersContext;

    //
    lolly: Contract
    nightworkersGame: Contract
    redLightDistrict: Contract
    candyMachine: Contract
    lottery: Contract
    tableGames: Contract
    backroom: Contract

    //
    secretStorage: SecretsStorage
    tvd: TrustedValidatorDaemon
    tvdJob: Promise<void>

    //
    mintOrderer: MintOrderer

    //
    nftAssets: PackedNFTAssets

    //
    payableMintPrice: PayableMintPrices

    //
    users: SignersStore
  }
}
