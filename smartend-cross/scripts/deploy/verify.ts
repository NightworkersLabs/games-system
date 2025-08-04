// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `pnpm exec hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { parseEther } from 'ethers'
import { run } from 'hardhat'

async function main () {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  /** DEV-ONLY, if previous failed */
  await run('verify:verify', {
    address: '0x727571F63E760235397D3d4E76d2De3e3Cb7ac8A', // TO FILL
    constructorArguments: [
      '0x544a3AC7FF74F1f7AD6e41FcAc4CF98d657675B2', // trustedValidatorAddress, TO FILL,
      parseEther('0.00001') // singleChipPrice, TO FILL
    ]
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
