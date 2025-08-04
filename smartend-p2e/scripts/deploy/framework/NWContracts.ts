import { BigNumber, Contract, ContractFactory, ContractTransaction, Wallet } from 'ethers'
import { formatEther } from 'ethers/lib/utils'
import { mkdirSync, writeFileSync } from 'fs'
import { ethers, network } from 'hardhat'
import { readJSONSync, existsSync, outputFileSync, writeJSONSync } from 'fs-extra'
import { resolve } from 'path'

/** standardized network name. Since 'hardhat' configuration is used when deploying on 'localhost' network, rename detected network for linearity */
const sNetworkName = network.name === 'localhost' ? 'hardhat' : network.name

//
class NightworkersContractsBase {
  //
  public readonly deploymentHistoryPath: string

  //
  constructor (deploymentHistoryPath: string) {
    //
    console.log(`== Deploying on [${sNetworkName}] ! ==`)

    //
    const fullpath = resolve(deploymentHistoryPath)

    //
    if (!existsSync(deploymentHistoryPath)) {
      console.log(`== Creating file [${fullpath}] ==`)
      outputFileSync(deploymentHistoryPath, '{}', { flag: 'w' })
    } else {
      console.log(`== Using file [${fullpath}] ==`)
    }

    //
    this.deploymentHistoryPath = deploymentHistoryPath
  }
}

export const HISTORIZED_NETWORKS_IGNORED = [
  'local',
  // 'hardhat'
  'localhost'
]

//
export class ContractContext {
  readonly contractName: string
  builder?: ContractFactory
  contract?: Contract
  /** @dev if filled, means that a succesful deployment occured during this context lifespan */
  deployArgs?: any[]

  //
  private readonly _superContext: NightworkersContractsBase

  //
  constructor (contractName: string, superContext: NightworkersContractsBase) {
    this.contractName = contractName
    this._superContext = superContext
  }

  //
  private _logIntoHistory (historyPath: string, contractAddress: string) {
    //
    const history = readJSONSync(historyPath)

    // create Contract name space if does not exist
    if (history[this.contractName] == null) {
      history[this.contractName] = {}
    }

    // create network name space if does not exist / if was not an array...
    if (!Array.isArray(history[this.contractName][sNetworkName])) {
      // turn into one
      history[this.contractName][sNetworkName] = []
    }

    // checks that address already exists
    const cAlreadyExists =
      (history[this.contractName][sNetworkName] as any[])
        .indexOf(contractAddress)

    // if exists...
    if (cAlreadyExists !== -1) {
      // remove element
      (history[this.contractName][sNetworkName] as any[])
        .splice(cAlreadyExists, 1)
    }

    // make deployed address as first
    (history[this.contractName][sNetworkName] as any[])
      .unshift(contractAddress)

    // rewrite file
    writeJSONSync(historyPath, history, { flag: 'w', spaces: 2 })
  }

  /** @dev Deploy wrapper, can store deploy args which can be used to verify contracts later */
  async deployW (...deployArgs: any[]) {
    //
    this.contract = await this.builder.deploy(...deployArgs)

    //
    await this.contract.deployed()

    // if current network is NOT to be ignored
    if (!HISTORIZED_NETWORKS_IGNORED.includes(sNetworkName)) {
      // log into history file
      this._logIntoHistory(
        this._superContext.deploymentHistoryPath,
        this.contract.address
      )
    }

    //
    this.deployArgs = deployArgs ?? []
  }
}

//
export class NightworkersContracts extends NightworkersContractsBase {
  //
  private _createContext = (name: string) => new ContractContext(name, this)

  //
  lolly = this._createContext('LOLLY')
  nightworkersGame = this._createContext('NightworkersGame')
  redLightDistrict = this._createContext('RedLightDistrict')
  candyMachine = this._createContext('CandyMachine')
  lottery = this._createContext('Lottery')
  tableGames = this._createContext('TableGames')
  backroom = this._createContext('Backroom')

  //
  ALL_CONTEXTS = [
    this.candyMachine,
    this.lolly,
    this.nightworkersGame,
    this.redLightDistrict,
    this.lottery,
    this.tableGames,
    this.backroom
  ]

  //
  //
  //

  //
  async massMint (howManyToMint : number, maxByIteration : number, price : BigNumber, stake : boolean) {
    //
    const mustMint = howManyToMint
    let failedMint = 0
    console.log(`Minting ${howManyToMint}, ${maxByIteration} by ${maxByIteration} !`)

    const _log = (btl : boolean) => {
      if (btl) {
        process.stdout.clearLine(0)
        process.stdout.cursorTo(0)
      }
      process.stdout.write(`[${mustMint - howManyToMint} / ${mustMint}] (Failed : ${failedMint}) mints remaining...`)
    }

    //
    _log(false)

    //
    while (howManyToMint > 0) {
      //
      const howMuchToMint = maxByIteration > howManyToMint ? howManyToMint : maxByIteration

      //
      await this.nightworkersGame.contract.mint(howMuchToMint, stake, {
        value: price.mul(howMuchToMint)
      })
        .then(e => e.wait())
        .catch(e => { failedMint += howMuchToMint })

      //
      howManyToMint -= howMuchToMint

      //
      _log(true)
    }

    //
    console.log(`${howManyToMint} successfully minted !`)
  }

  //
  async massMintGen0 () {
    await this.massMint(
      await this.nightworkersGame.contract.PAYABLE_TOKENS_SCARCE_AT() - 1,
      await this.nightworkersGame.contract.MAX_MINT(),
      await this.nightworkersGame.contract.getBasePayableMintPrice(),
      true
    )
  }

  //
  async warpMint (minted : number) {
    await this.nightworkersGame.contract.$_setMinted(minted).then(e => e.wait())
  }

  //
  private async _transferOwnership (expectedNewOwner: string, contractContexts: ContractContext[]) {
    //
    console.log(`- May transfer ownership of ${contractContexts.length} contracts to ${expectedNewOwner}...`)

    //
    for (const { contract, contractName } of contractContexts) {
      //
      if (contract == null) {
        console.log(` > Contract "${contractName}" : skipped because undefined`)
        continue
      }

      //
      // eslint-disable-next-line no-prototype-builtins
      if (!contract.functions.hasOwnProperty('owner')) {
        console.log(` > Contract "${contractName}" : skipped because un-ownable`)
        continue
      }

      try {
        //
        const previousOwner = (await contract.owner()) as string
        if (expectedNewOwner.toLowerCase() === previousOwner.toLowerCase()) {
          console.log(` > Contract "${contractName}" : skipped because "${expectedNewOwner}" already owns it`)
          continue
        }

        //
        const tx = await (contract.transferOwnership(expectedNewOwner) as Promise<ContractTransaction>)
        await tx.wait()
      //
      } catch (e) {
        console.log(` > Contract "${contractName}" : error-ed while transfering ownership >> ${e}`)
        continue
      }

      //
      const newOwner = (await contract.owner()) as string
      if (expectedNewOwner.toLowerCase() !== newOwner.toLowerCase()) {
        console.log(` > Contract "${contractName}" error while checking new owner (expected: "${expectedNewOwner}", got: "${newOwner}")`)
        continue
      }

      //
      console.log(` > Contract "${contractName}" : Successfully transfered to "${expectedNewOwner}"`)
    }
  }

  //
  async transferOwnershipTo (newOwnerAddress: string) {
    // get deployer signer
    const [deployer] = await ethers.getSigners()
    const balanceBeforeDeploy = await deployer.getBalance()

    //
    if (newOwnerAddress.length === 0) throw new Error('New owner address not supplied !')

    //
    await this._transferOwnership(newOwnerAddress, this.ALL_CONTEXTS)

    // calculate price
    const balanceAfterDeploy = await deployer.getBalance()
    const deploymentCost = formatEther(balanceBeforeDeploy.sub(balanceAfterDeploy))
    console.log(`>> Ownership transfer cost : ${deploymentCost} ETH <<`)
  }

  //
  async generateWhitelistedAccounts (howManyToGenerate : number) {
    //
    console.log('- Generating whitelisted addresses...')

    // if of negative value
    if (howManyToGenerate < 0) { throw new Error('cannot generate whitelisted accounts') }

    // generate wallets
    const generatedWallets = this._generateWalletAccounts(howManyToGenerate)

    // pack them into batches of 100
    const packBy = 100
    const batches = this._splitWalletAddressesIntoBatches(generatedWallets, packBy)

    // execute into batches to prevent overflowing blockchain nodes
    for (const batch of batches) {
      await this.nightworkersGame.contract.grantManyWhitelistTickets(batch, 3).then(e => e.wait())
    }

    //
    console.log(`   > Confirmed ${howManyToGenerate} whitelisted addresses registered to contract`)

    //
    this._createWalletsCSV(generatedWallets)
  }

  //
  private _splitWalletAddressesIntoBatches (wallets: Wallet[], packBy: number) : Array<Array<string>> {
    const packsIndicies = Array.from({ length: Math.ceil(wallets.length / packBy) }, (_e, i) => i)
    const addresses = wallets.map(e => e.address)
    return packsIndicies.map(i => {
      const start = i * packBy
      const end = ((i + 1) * packBy)
      return addresses.slice(start, end)
    })
  }

  //
  private _generateWalletAccounts (howMany: number) : Wallet[] {
    return Array.from({ length: howMany }).map(e => ethers.Wallet.createRandom())
  }

  //
  private _createWalletsCSV (wallets : Wallet[]) {
    let csv = ''

    // headers
    csv += 'Public Address;Private Key;\n'

    // lines...
    wallets.forEach(w => {
      csv += `${w.address};${w.privateKey};\n`
    })

    // remove last newline
    csv = csv.substring(0, csv.length - 1)

    // create folder
    mkdirSync('./output', { recursive: true })

    // write file
    const fileOutputPath = './output/generatedWallets.csv'
    writeFileSync(fileOutputPath, csv)

    //
    console.log(`   > Generated ${wallets.length} wallet addresses into ${fileOutputPath}`)
  }
}
