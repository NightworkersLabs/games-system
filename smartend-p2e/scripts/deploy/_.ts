import { produceConsumerConfigurations } from './framework/env/EnvFilesGenerator'
import { NightworkersContext } from './framework/NWContext'
import { ContractContext, NightworkersContracts } from './framework/NWContracts'
import { IgniteParameters } from './framework/NWContractsFactory'

import { run } from 'hardhat'

interface DeploymentParameters extends IgniteParameters {
  /** allows to take advantage of "hardhat-exposed" versions of game contracts, which have internal functions exposed as public */
  useExposedContractVariations? : boolean
  /** to preserve gas and time, do not publish image data alongside NFTs metadata. Makes on-the-fly NFT metadata generation useless */
  onlyLightNFTs?: boolean
  /** */
  howManyWLToGenerate? : number
}

export async function deployNWP2E (params: DeploymentParameters) : Promise<NightworkersContracts> {
  //
  console.log('== Begin deploying Nightworkers P2E ! == ')
  const context = new NightworkersContext('./deployed.json', params.useExposedContractVariations)

  //
  await context.deployAndIgnite(params)

  //
  await context.uploadAllAssets(params.onlyLightNFTs)

  // no WL auto addresses generation if undefined
  if (params.howManyWLToGenerate !== undefined) {
    await context.generateWhitelistedAccounts(params.howManyWLToGenerate)
  }

  // READY !
  console.log('== Nightworkers P2E ready ! == ')
  console.log(` >> Contract ${context.lolly.contract.address} : $LOLLY`)
  console.log(` >> Contract ${context.nightworkersGame.contract.address} : Night Workers NFT Minting`)
  console.log(` >> Contract ${context.redLightDistrict.contract.address} : Red Light District ($LOLLY Staking)`)
  console.log(` >> Contract ${context.lottery.contract.address} : Lottery`)
  console.log(` >> Contract ${context.tableGames.contract.address} : Table Games (Coinflip + Roulette)`)
  console.log(` >> Contract ${context.backroom.contract.address} : Backroom (LOLLY > AVAX Yield Aggregator Vault)`)

  //
  produceConsumerConfigurations(context)

  //
  return context
}

//
export async function tryVerifyContracts (contractContexts: ContractContext[]) {
  console.log('== Trying to verify contracts... == ')

  //
  for (const { contract, deployArgs, contractName } of contractContexts) {
    //
    if (contract.address == null || deployArgs == null) {
      console.log(` >> [${contractName}] : invalid address or constructor args. Skipping.`)
      continue
    }

    //
    try {
      //
      console.log(` >> [${contractName}] : Verifying ...`)

      //
      await run('verify:verify', {
        address: contract.address,
        constructorArguments: deployArgs
      })

      //
      console.log(` >> [${contractName}] : Verification Completed !`)

    //
    } catch (e) {
      //
      console.log(` >> [${contractName}] : Failed... (${e})`)
    }
  }

  //
  console.log('== Done ! == ')
}
