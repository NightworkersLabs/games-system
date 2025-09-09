import { ethers } from "hardhat";

// eslint-disable-next-line @typescript-eslint/no-require-imports
import logUpdate = require("log-update");

import type { IgniteParameters } from "#/scripts/deploy/framework/NWContractsFactory";
import { NightworkersContractsFactory } from "#/scripts/deploy/framework/NWContractsFactory";

export class NightworkersContext extends NightworkersContractsFactory {
  //
  protected async _deploy(params: IgniteParameters) {
    //
    let i = -1;
    const getLog = (done: boolean = false) => {
      i++;
      return `- Deploying contracts... (${i} / ${done ? i : "..."})`;
    };
    logUpdate(getLog());

    //
    // checks for required parameters...
    //

    //
    if (
      params.trustedValidatorAddress == null ||
      params.trustedValidatorAddress.length === 0
    ) {
      if (params.isDebugMode === true) {
        const [deployer] = await ethers.getSigners();
        params.trustedValidatorAddress = deployer.address;
      } else {
        throw new Error(
          "Not supplying a trusted validator address in release mode is forbidden !",
        );
      }
    }

    //
    // Deploy all required contracts
    //

    //
    await this.casinoBank.deployW(
      params.trustedValidatorAddress,
      params.singleChipPrice,
    );
    logUpdate(getLog(true));
    logUpdate.done();
  }
}
