import { produceConsumerConfigurations } from './framework/env/EnvFilesGenerator'
import { NightworkersContext } from './framework/NWContext'
import { ContractContext, NightworkersContracts } from './framework/NWContracts'
import { IgniteParameters } from './framework/NWContractsFactory'

import { run } from 'hardhat'

export async function deployNWCasinoLite (params: IgniteParameters) : Promise<NightworkersContracts> {
  //
  console.log('== Begin deploying Nightworkers Casino Lite ! == ')
  const context = new NightworkersContext('./deployed.json')

  //
  await context.deployAndIgnite(params)

  // READY !
  console.log('== Nightworkers Casino Lite ready ! == ')
  console.log(` >> Contract ${await context.casinoBank.contract?.getAddress()} : Casino Bank`)

  //
  produceConsumerConfigurations()

  //
  return context
}

//
export async function tryVerifyContracts (contractContexts: ContractContext[]) {
  console.log('== Trying to verify contracts... == ')

  //
  for (const { contract, deployArgs, contractName } of contractContexts) {
    //
    if ((await contract?.getAddress()) == null || deployArgs == null) {
      console.log(` >> [${contractName}] : invalid address or constructor args. Skipping.`)
      continue
    }

    //
    try {
      //
      console.log(` >> [${contractName}] : Waiting confirmation blocks ...`)

      //
      await contract?.deploymentTransaction()?.wait(5)

      //
      console.log(` >> [${contractName}] : Verifying ...`)

      //
      await run('verify:verify', {
        address: await contract?.getAddress(),
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
