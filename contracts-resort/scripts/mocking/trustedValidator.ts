// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `pnpm exec hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { parseEther } from "ethers/lib/utils";

import { SecretsStorage } from "@nightworkerslabs/offchain-resort/src/lib/provably-fair/secrets-provider";

import { deployNWP2E } from "#/scripts/deploy/_";
import TVDInstance from "#/scripts/deploy/framework/TVDHelper";
import { MintOrderer } from "#/test/_helpers";

const main = async () => {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // deploy contracts
  const contracts = await deployNWP2E({ allowWorkingAndSneaking: true });
  const payableMintPrice = parseEther("1.5");

  // order mints BEFORE trusted validator is ON
  await contracts.nightworkersGame.contract
    .declarePublicLaunch()
    .then((e) => e.wait());
  await MintOrderer.waitedS(
    contracts.nightworkersGame.contract,
    payableMintPrice,
  );
  await MintOrderer.waitedS(
    contracts.nightworkersGame.contract,
    payableMintPrice,
  );

  // start the trusted validator daemon
  // TVLogger.mustLog = false;
  const secretsStorage = new SecretsStorage();
  const daemonInstance = TVDInstance.fromContracts(
    contracts,
    secretsStorage,
    await contracts.nightworkersGame.contract.provider.getBlockNumber(),
  );
  const payload = await daemonInstance.generateTrustfullOrderPayload();

  // order
  await MintOrderer.waitedS(
    contracts.nightworkersGame.contract,
    payableMintPrice,
    { payload },
  );
  await MintOrderer.waitedS(
    contracts.nightworkersGame.contract,
    payableMintPrice,
    { payload },
  );

  const job = daemonInstance.exec();

  // order mints AFTER trusted validator started
  await MintOrderer.waitedS(
    contracts.nightworkersGame.contract,
    payableMintPrice,
  );
  await MintOrderer.waitedS(
    contracts.nightworkersGame.contract,
    payableMintPrice,
  );

  // may stop
  daemonInstance.stop();

  // await for daemon to stop handling events
  await job;
};

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
