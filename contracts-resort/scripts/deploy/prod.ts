// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `pnpm exec hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { parseEther } from "ethers/lib/utils";

import { deployNWP2E, tryVerifyContracts } from "#/scripts/deploy/_";

const main = async () => {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  //
  const mintMultisigAddress = "0xde7b15A2139c2FD7911071C9A79C04669FF79399"; // TO FILL

  //
  const contracts = await deployNWP2E({
    /* OPTIMIZATION & DEBUG */
    onlyLightNFTs: true, // TO REMOVE ONCE MAINNET ?
    /* GAME CONFIGURATION */
    maxMints: 300, // TO REMOVE ONCE MAINNET
    ERC20WiningsPerDayStaking: parseEther((20_000_000).toString()), // TO REMOVE ONCE MAINNET
    minimumVestingPeriodInSecs: 2 * 60, // TO REMOVE ONCE MAINNET
    defaultPayableMintPrice: parseEther("0.15"), // TO REMOVE ONCE MAINNET
    allowWorkingAndSneaking: true, // TO REMOVE ONCE MAINNET
    publicLaunch: true, // TO REMOVE ONCE MAINNET
    /* ADDRESSES */
    taxesAndRevenueRecipientAddress: mintMultisigAddress,
    trustedValidatorAddress: "0x544a3AC7FF74F1f7AD6e41FcAc4CF98d657675B2", // TO FILL
    ERC20TokenContractAddress: "0x06215f669e44b82922A58D786Ea1C53627386a76", // TO FILL (optional)
    /* DOMAIN & URLs */
    tokenURIBase: "https://nightworkers.vercel.app/api/ERC721?md=", // TO FILL
  });

  //
  await contracts.transferOwnershipTo(mintMultisigAddress);

  //
  await tryVerifyContracts(contracts.ALL_CONTEXTS);
};

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
