import type { BigNumber, Contract, Wallet } from "ethers";

import type { TraitsPack } from "@nightworkerslabs/nft-assets/utilities";
import type { SecretsStorage } from "@nightworkerslabs/offchain-resort/src/lib/provably-fair/secrets-provider";
import type { TrustedValidatorDaemon } from "@nightworkerslabs/offchain-resort/src/lib/tv-daemon";
import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

import type { NightworkersContext } from "#/scripts/deploy/framework/NWContext";
import type { MintOrderer } from "#/test/_helpers";

//
export type SignersStore = {
  owner: SignerWithAddress;
  wl: SignerWithAddress;
  broke: Wallet;
};

//
export type PayableMintPrices = {
  base: BigNumber;
  wl: BigNumber;
  scarce: BigNumber;
};

export type PackedNFTAssets = {
  hooker: TraitsPack[];
  pimp: TraitsPack[];
};

//
declare module "mocha" {
  export interface Context {
    //
    nwContext: NightworkersContext;

    //
    lolly: Contract;
    nightworkersGame: Contract;
    redLightDistrict: Contract;
    candyMachine: Contract;
    lottery: Contract;
    tableGames: Contract;
    backroom: Contract;

    //
    secretStorage: SecretsStorage;
    tvd: TrustedValidatorDaemon;
    tvdJob: Promise<void>;

    //
    mintOrderer: MintOrderer;

    //
    nftAssets: PackedNFTAssets;

    //
    payableMintPrice: PayableMintPrices;

    //
    users: SignersStore;
  }
}
