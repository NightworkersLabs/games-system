// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `pnpm exec hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { parseEther } from 'ethers/lib/utils'
import { deployNWP2E } from './_'

async function main () {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  //
  await deployNWP2E({
    /** OPTIMIZATION & DEBUG */
    onlyLightNFTs: true,
    useExposedContractVariations: true,
    /* GAME CONFIGURATION */
    allowWorkingAndSneaking: true,
    publicLaunch: true,
    maxMints: 100,
    ERC20WiningsPerDayStaking: parseEther((20_000_000).toString()),
    minimumVestingPeriodInSecs: 1, // 2 * 60
    /* DOMAIN & URLs */
    tokenURIBase: 'http://127.0.0.1:3000/api/ERC721?md='
  })
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
