import fse from 'fs-extra'
import { produceNamesArrayFrom, readNFTAssetsRepositoryPacker } from '../smartend/nft-assets/read'

const dAppOutputEnvFileName = '.env.local'
const dAppEnvSourceFolder = './smartend/artifacts/'
const dAppEnvAutoReplaceFileName = '.env.autoReplace'
const dAppEnvDefaultFileName = '.env.dApp'

const delay = (ms: number) => new Promise(resolve => setInterval(resolve, ms))

/**
 * Watches for a fresh deployment of contracts to update depending resources, from smartend to frontend
 * @dev copy resources necessary for the frontend to work, without smartend subdirectory to be pulled alongside
 * @dev supposed to be ran in parallel to the deployment script
 */
async function watchAndConfigure () {
  //
  //
  //

  // copies NFT assets files
  fse.copySync('./smartend/nft-assets/hooker', './public/resources/nft-assets/hooker')
  fse.copySync('./smartend/nft-assets/pimp', './public/resources/nft-assets/pimp')
  console.log('Updated public NFT assets.')

  // generate NFT assets names DB
  const tPacks = readNFTAssetsRepositoryPacker('./public/resources/nft-assets')
  const names = produceNamesArrayFrom(tPacks)
  fse.writeJSONSync('./public/resources/nft-assets/name.json', names)
  console.log('Updated public NFT assets names database.')

  //
  //
  //

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
    } catch (e) {}

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
  fse.copyFileSync(`${dAppEnvSourceFolder}/networks.json`, './networks.json')
  console.log('dApp local .env file updated.')

  // copies ABI files
  fse.copySync('./smartend/abi', './public/abi')
  fse.copySync('./smartend/abi', './smartend/offchain-service/abi')
  console.log('Updated publicly exposed ABI files.')

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
