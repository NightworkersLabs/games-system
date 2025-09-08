// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `pnpm exec hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { parseEther } from 'ethers'
import { deployNWCasinoLite, tryVerifyContracts } from './_'

async function main () {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  //
  // const mintMultisigAddress = '0xde7b15A2139c2FD7911071C9A79C04669FF79399' // TO FILL

  //
  const contracts = await deployNWCasinoLite({
    singleChipPrice: parseEther('0.00001'), // TO FILL
    /* ADDRESSES */
    trustedValidatorAddress: '0x544a3AC7FF74F1f7AD6e41FcAc4CF98d657675B2' // TO FILL
  })

  //
  // await contracts.transferOwnershipTo(mintMultisigAddress)

  //
  await tryVerifyContracts(contracts.ALL_CONTEXTS)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
