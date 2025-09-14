import fse from 'fs-extra'
import waitPort from 'wait-port'

const dAppOutputEnvFileName = '.env.local'
const dAppEnvSourceFolder = './smartend/artifacts/'
const offchainServiceSourceFolder = './smartend/offchain-service/'
const dAppEnvAutoReplaceFileName = '.env.autoReplace'
const dAppEnvDefaultFileName = '.env.dApp'

const delay = (ms: number) => new Promise(resolve => setInterval(resolve, ms))

/**
 * Watches for a fresh deployment of contracts to update depending resources, from smartend to frontend
 * @dev copy resources necessary for the frontend to work, without smartend subdirectory to be pulled alongside
 * @dev supposed to be ran in parallel to the deployment script
 */
const watchAndConfigure = async () => {
  // defaults to auto-replace file template
  const autoReplaceFullPath = dAppEnvSourceFolder + dAppEnvAutoReplaceFileName
  let dAppEnvSourceFilePath = autoReplaceFullPath

  // if auto-replacer do not exist
  if (fse.existsSync(autoReplaceFullPath) === false) {
    // search for default env file...
    dAppEnvSourceFilePath = dAppEnvSourceFolder + dAppEnvDefaultFileName

    // Attemps to remove any .env files generated, hints of a previous contract deployment alongside its frontend configuration
    try {
      fse.rmSync(dAppEnvSourceFilePath)
      console.log(`Removed .env file ${dAppEnvSourceFilePath}`)
    } catch (_) {}

    // waits for the expected deployment script ran in parallel to produce said .env file...
    console.log(`Waiting for new .env file at ${dAppEnvSourceFilePath}...`)
    while (true) {
      // poll every .5 seconds, checks endlessly its existence
      await delay(500)
      if (fse.existsSync(dAppEnvSourceFilePath)) { break }
    }
  }

  // copies .env file
  console.log('New .env file found !')
  fse.copySync(dAppEnvSourceFilePath, `./${dAppOutputEnvFileName}`)
  console.log('dApp local .env file updated.')

  // copies deployed.json / networks.json
  fse.copyFileSync(`${dAppEnvSourceFolder}networks.json`, './networks.json')
  fse.copyFileSync(`${dAppEnvSourceFolder}networks.json`, `${offchainServiceSourceFolder}networks.json`)

  fse.copyFileSync('./smartend/deployed.json', './deployed.json')
  fse.copyFileSync('./smartend/deployed.json', `${offchainServiceSourceFolder}deployed.json`)

  // copies ABI files
  fse.copySync('./smartend/abi', './public/abi')
  fse.copySync('./smartend/abi', `${offchainServiceSourceFolder}abi`)
  console.log('Updated publicly exposed ABI files.')

  //
  // Now, let's handle offchain service
  //

  //
  console.log('Wait for database to be available...')
  const isDbAvailable = await waitPort({ port: 26257, timeout: 10_000 })
  if (!isDbAvailable) {
    throw new Error('Database not available or timed-out. Make sure that Docker is correctly installed locally and database image correctly installed.')
  }

  //
  // ALL SET AND DONE, let's debug !
  //
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
watchAndConfigure()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
