import { formatEther } from "ethers";
import { ethers } from "hardhat";

import { NightworkersContracts } from "#/scripts/deploy/framework/NWContracts";

export interface IgniteParameters {
  /** price of a single chip of the casino bank */
  singleChipPrice: bigint;
  /** less safe, less automated mode */
  isDebugMode?: boolean;
  /** address used by an authorized trustful bot, which will handle secure transactions */
  trustedValidatorAddress?: string;
}

export abstract class NightworkersContractsFactory extends NightworkersContracts {
  //
  protected abstract _deploy(params: IgniteParameters): Promise<void>;

  private async _init() {
    //
    console.log("- Preparing deployment...");

    // We get the contract to deploy
    this.casinoBank.builder = await ethers.getContractFactory("CasinoBank");
  }

  async deployAndIgnite(params: IgniteParameters) {
    // get deployer signer
    const [deployer] = await ethers.getSigners();
    const balanceBeforeDeploy = await ethers.provider.getBalance(
      deployer.address,
    );

    // init...
    await this._init();

    // deploy !
    await this._deploy(params);

    // calculate deployment price
    const balanceAfterDeploy = await ethers.provider.getBalance(
      deployer.address,
    );
    const deploymentCost = formatEther(
      balanceBeforeDeploy.sub(balanceAfterDeploy).toBigInt(),
    );
    console.log(`>> Deployment cost : ${deploymentCost} ETH <<`);
  }
}
