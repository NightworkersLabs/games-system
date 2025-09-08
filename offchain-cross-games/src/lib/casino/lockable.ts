import { BigNumber } from 'ethers'
import { PrismaClient } from '#prisma/client/index.js'
import { type CasinoBlockchainRuntime, BlockchainsRuntimes } from '#lib/multi-chain/configuration'
import { UserError } from '#lib/helpers'

//
export type LockExecEnv<T> = (
  client: PrismaClient,
  balance: {
    withdrawable: number
    sluggish: number
    playsWithoutWD: number
    tAirdropped: number
    tBought: number
    tWithdrawed: number
  },
  runtime: CasinoBlockchainRuntime
) => Promise<T>

//
export class CasinoLockable {
  //
  private _locks = new Map<string, boolean>()
  private _client: PrismaClient
  private _runtimes: BlockchainsRuntimes

  constructor (runtimes: BlockchainsRuntimes, client: PrismaClient) {
    this._runtimes = runtimes
    this._client = client
  }

  public async discardConnection () {
    return this._client.$disconnect()
  }

  /** */
  private async _runExecutor<T> (runtime: CasinoBlockchainRuntime, playerWalletID: BigNumber, chainId: number, executor: LockExecEnv<T>) : Promise<T> {
    // get account balance
    const balance = await this._client.chipsBalance.findUnique({
      where: {
        chainId_address: {
          chainId,
          address: playerWalletID.toHexString()
        }
      },
      select: {
        withdrawable: true,
        sluggish: true,
        playsWithoutWD: true,
        tAirdropped: true,
        tBought: true,
        tWithdrawed: true
      }
    })

    if (balance === null) {
      throw new UserError('user account not found')
    }

    // allow configured executor to update database
    return executor(
      this._client,
      balance,
      runtime
    )
  }

  /** */
  protected async _accessDatabase<T> (playerWalletID: BigNumber, chainId: number, executor: LockExecEnv<T>): Promise<T> {
    // check if account is being modified
    const pwIDHex = playerWalletID.toHexString()
    const isLocked = this._locks.get(pwIDHex)
    if (isLocked) {
      throw new UserError('your balance is moving, please retry later')
    }

    //
    const runtime = this._runtimes.safeGetRuntime(chainId)

    // lock for modifications
    this._locks.set(pwIDHex, true)

    //
    return this._runExecutor(
      runtime,
      playerWalletID,
      chainId,
      executor
    ).finally(() => {
      // unlock modifications on account
      this._locks.set(pwIDHex, false)
    })
  }
}
