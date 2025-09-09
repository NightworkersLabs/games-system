import { run } from "hardhat";

import { produceConsumerConfigurations } from "#/scripts/deploy/framework/env/EnvFilesGenerator";
import { NightworkersContext } from "#/scripts/deploy/framework/NWContext";
import type {
  ContractContext,
  NightworkersContracts,
} from "#/scripts/deploy/framework/NWContracts";
import type { IgniteParameters } from "#/scripts/deploy/framework/NWContractsFactory";

export const deployNWCasinoLite = async (
  params: IgniteParameters,
): Promise<NightworkersContracts> => {
  //
  console.log("== Begin deploying Nightworkers Casino Lite ! == ");
  const context = new NightworkersContext("./deployed.json");

  //
  await context.deployAndIgnite(params);

  // READY !
  console.log("== Nightworkers Casino Lite ready ! == ");
  console.log(
    ` >> Contract ${await context.casinoBank.contract?.getAddress()} : Casino Bank`,
  );

  //
  produceConsumerConfigurations();

  //
  return context;
};

//
export const tryVerifyContracts = async (
  contractContexts: ContractContext[],
) => {
  console.log("== Trying to verify contracts... == ");

  //
  for (const { contract, deployArgs, contractName } of contractContexts) {
    //
    if ((await contract?.getAddress()) == null || deployArgs == null) {
      console.log(
        ` >> [${contractName}] : invalid address or constructor args. Skipping.`,
      );
      continue;
    }

    //
    try {
      //
      console.log(` >> [${contractName}] : Waiting confirmation blocks ...`);

      //
      await contract?.deploymentTransaction()?.wait(5);

      //
      console.log(` >> [${contractName}] : Verifying ...`);

      //
      await run("verify:verify", {
        address: await contract?.getAddress(),
        constructorArguments: deployArgs,
      });

      //
      console.log(` >> [${contractName}] : Verification Completed !`);

      //
    } catch (e) {
      //
      console.log(` >> [${contractName}] : Failed... (${e})`);
    }
  }

  //
  console.log("== Done ! == ");
};
