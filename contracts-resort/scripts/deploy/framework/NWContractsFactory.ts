import type { BigNumber } from "ethers";
import { formatEther } from "ethers/lib/utils";
import { ethers } from "hardhat";

import { NightworkersContracts } from "#/scripts/deploy/framework/NWContracts";

export interface IgniteParameters {
  /** address which will receive any generated income or taxes */
  taxesAndRevenueRecipientAddress?: string;
  /** address used by an authorized trustful bot, which will handle secure transactions */
  trustedValidatorAddress?: string;
  /** URL which will be used as a base to parse NFT metadata. Produced URL based on this one should lead to the image representation of the NFT (PNG / SVG) */
  tokenURIBase?: string;
  /** if already existing, use said contract as official ERC20 contract of the game. if null, create a brand new one and use this one instead */
  ERC20TokenContractAddress?: string;
  /** do public launch asap */
  publicLaunch?: boolean;
  /** should we allow staking / unstaking NFTs off the bat once deployed */
  allowWorkingAndSneaking?: boolean;
  /** overrides default maximum mints allowed */
  maxMints?: number;
  /** overrides default vesting period as a hooker when unstaking */
  minimumVestingPeriodInSecs?: number;
  /** overrides default amount of $LOLLY won per day staking as a hooker */
  ERC20WiningsPerDayStaking?: BigNumber;
  /** default base payable price for minting gen 0 tokens */
  defaultPayableMintPrice?: BigNumber;
}

export abstract class NightworkersContractsFactory extends NightworkersContracts {
  /** allows to take advantage of "hardhat-exposed" versions of game contracts, which have internal functions exposed as public */
  protected _useExposedContractVariations: boolean;

  //
  protected abstract _deploy(params: IgniteParameters): Promise<void>;

  //
  constructor(
    deploymentHistoryPath: string,
    useExposedContractVariations: boolean,
  ) {
    //
    super(deploymentHistoryPath);

    //
    this._useExposedContractVariations = useExposedContractVariations;
  }

  private async _init() {
    //
    console.log("- Preparing deployment...");

    //
    const debugPrefix = this._useExposedContractVariations ? "$" : "";

    // We get the contract to deploy
    this.lolly.builder = await ethers.getContractFactory(debugPrefix + "LOLLY");
    this.nightworkersGame.builder = await ethers.getContractFactory(
      debugPrefix + "NightworkersGame",
    );
    this.redLightDistrict.builder = await ethers.getContractFactory(
      debugPrefix + "RedLightDistrict",
    );
    this.candyMachine.builder = await ethers.getContractFactory(
      debugPrefix + "CandyMachine",
    );
    this.lottery.builder = await ethers.getContractFactory(
      debugPrefix + "Lottery",
    );
    this.tableGames.builder = await ethers.getContractFactory(
      debugPrefix + "TableGames",
    );
    this.backroom.builder = await ethers.getContractFactory(
      debugPrefix + "Backroom",
    );
  }

  async deployAndIgnite(params: IgniteParameters) {
    // get deployer signer
    const [deployer] = await ethers.getSigners();
    const balanceBeforeDeploy = await deployer.getBalance();

    // init...
    await this._init();

    // deploy !
    await this._deploy(params);

    // calculate deployment price
    const balanceAfterDeploy = await deployer.getBalance();
    const deploymentCost = formatEther(
      balanceBeforeDeploy.sub(balanceAfterDeploy),
    );
    console.log(`>> Deployment cost : ${deploymentCost} ETH <<`);
  }
}
