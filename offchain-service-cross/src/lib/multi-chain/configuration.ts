import { Contract, ethers, Wallet } from 'ethers'

import CasinoBankABI from '#abi/CasinoBank.json'
import { getWallet } from '#env/_base/template'
import { type IScraperEnvTemplate } from '#env/scraper/template'
import chalk from 'chalk'

/** CasinoBlockchainConfigurationBase */
interface CBCBase {
  /** unique id of the blockchain */
  chainId: number
  /** whenever this blockchain is not exposed to market */
  cheap?: true
  /** */
  searchEvents?: {
    /**  */
    pollDurationMs?: number
    /** maximum allowed blockheight for incremental search on associated RPC */
    maxBlockHeight?: number
  }
}

//
export interface CasinoBlockchainConfiguration extends CBCBase {
  /** address of the CasinoBank smart-contract on the blockchain */
  bankContract: string
  /** rpc url of blockchain endpoint */
  url: string
}

//
export interface CasinoBlockchainRuntime extends CBCBase {
  /** bound contract on the blockchain */
  contract: Contract
  /** wallet that is allowed to withdraw on contract */
  controller: Wallet
}

//
interface CasinoBlockchainRuntimes {
  [chainId: string]: CasinoBlockchainRuntime
}

/** store of all handled blockchain runtimes */
export class BlockchainsRuntimes {
  //
  private _store : CasinoBlockchainRuntimes = {}

  /** all working runtimes */
  public readonly allRuntimes : CasinoBlockchainRuntime[] = []

  //
  static async gather (env: IScraperEnvTemplate, configs: CasinoBlockchainConfiguration[]): Promise<BlockchainsRuntimes> {
    //
    const gatheredRuntimes = await Promise.allSettled(
      configs.map(conf =>
        BlockchainsRuntimes._checkAndGenerateRuntime(env, conf)
          .catch(e => {
            throw new Error(`Skipping BC n°${conf.chainId} runtime generation - ${e}`)
          })
      )
    )

    //
    gatheredRuntimes
      .filter(r => r.status === 'rejected')
      .forEach(r => {
        if (r.status === 'rejected') {
          console.log(chalk.red(r.reason))
        }
      })

    //
    const okRuntimes = gatheredRuntimes
      .filter(sr => sr.status === 'fulfilled')
      .map(sr => sr.status === 'fulfilled' ? sr.value : null) 
      .filter(r => r != null)

    //
    if (okRuntimes.length === 0) {
      throw new Error('No blockchain runtime could have been initialized... Aborting.')
    }

    //
    return new BlockchainsRuntimes(okRuntimes)
  }

  //
  private static async _checkAndGenerateRuntime (env: IScraperEnvTemplate, config: CasinoBlockchainConfiguration) : Promise<CasinoBlockchainRuntime> {
    //
    const provider = new ethers.providers.JsonRpcProvider(config.url, config.chainId)
    const controller = getWallet(env, provider)
    const contract = new Contract(config.bankContract, CasinoBankABI, controller)

    // CHECK : if can get network infos.
    // @dev Not beeing able to can mean that some kind of anti-spam protection is preventing us from reaching endpoint (Bitgert...)´
    await provider.getNetwork()

    // CHECK : is controller effectively a controller on contract
    const str = await contract.validator() as Promise<string>
    if ((await str).toLowerCase() !== controller.address.toLowerCase()) {
      throw new Error(`[${controller.address}] is expected to be a validator of contract [${contract.address}] on blockchain ID (${config.chainId})`)
    }

    //
    console.log(`${config.chainId} chain configuration OK.`)

    //
    return {
      contract,
      controller,
      ...(config.cheap ? { cheap: true } : null),
      ...(config.searchEvents ? { searchEvents: config.searchEvents } : null),
      chainId: config.chainId
    }
  }

  //
  private constructor (runtimes: CasinoBlockchainRuntime[]) {
    this.allRuntimes = runtimes
    this.allRuntimes.forEach(r => {
      this._store[r.chainId.toString()] = r
    })
  }

  /** safely gets runtime from store, throw if do not exist */
  public safeGetRuntime (chainId: number) : CasinoBlockchainRuntime {
    // gets runtime
    const runtime = this._store[chainId.toString()]

    // checks if exists
    if (runtime == null) {
      throw new Error('Could not find runtime configuration for chainId ' + chainId)
    }

    //
    return runtime
  }
}
