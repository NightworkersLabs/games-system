import chalk from 'chalk'
import { BigNumber, type ContractTransaction } from 'ethers'
import { getGasCostOfTx, UserError } from '#lib/helpers'
import { ProvablyFairResolver, RandomGenerator, type TrustfulOrderPayloadWithNonce } from '#provably-fair/compliance'
import { SecretsStorage } from '#provably-fair/secrets-provider'
import type { BetRegisterer } from './db'
import { type BetExecutor, type CoinFlipOutcome, type FairlyComputedRandom, type RandomOutcome, type RouletteOutcome } from './rand'
import { BlockchainsRuntimes } from '#lib/multi-chain/configuration'
import { CasinoLockable } from './lockable'
import { PrismaClient } from '#prisma/client/index.js'

//
interface ChipsBalance {
    withdrawable: number
    /** available airdropped chips */
    sluggish: number
}

//
interface ConvertResult {
  balance: ChipsBalance
  /** current state of net balance (total bought - total withdrawed) */
  netEvol: number
}

//
interface BalanceAccountability {
    bought: number
    airdropped: number
}

//
interface BetResult<T> extends RandomOutcome<T> {
  updatedBalance: ChipsBalance
}

//
export interface BetConfiguration<T = RouletteOutcome | CoinFlipOutcome> {
    playerWalletID: BigNumber
    chainId: number
    howMuchCoinsToBet: number
    wantedOutcome: T
    payload: TrustfulOrderPayloadWithNonce
}

//
export class Casino extends CasinoLockable {
  //
  private _secretsStorage: SecretsStorage

  /** how much, if possible, times that a player must use its chips on the casino before being able to withdraw */
  private _minimumPlaysBeforeWithdraw = 2

  //
  constructor (client: PrismaClient, runtimes: BlockchainsRuntimes, secretsStorage: SecretsStorage) {
    super(runtimes, client)
    this._secretsStorage = secretsStorage
    console.log('[CasinoDB] Ignited.')
  }

  //
  //
  //

  //
  private __getLog (playerWalletID: BigNumber, chainId: number, more: string) {
    return `[CasinoDB] - ${chainId} - ${playerWalletID.toHexString()} - ${more}`
  }

  //
  private __blDsp (balance: ChipsBalance) {
    return this.__blDspBase(balance.withdrawable, balance.sluggish)
  }

  //
  private __blDspBase (realChips: number, slugChips: number) {
    return `[${realChips}|${slugChips}]`
  }

  private __blDspBaseIncr (realChips: number, slugChips: number) {
    return `[+${realChips}|+${slugChips}]`
  }

  //
  //
  //

  /**  */
  private _hasPlayedEnoughtForWithdraw (balance: ChipsBalance & { playsWithoutWD: number }) : number | true {
    // if already played enough, can withdraw
    if (balance.playsWithoutWD >= this._minimumPlaysBeforeWithdraw) return true

    //
    const remainingGamesToPlay = this._minimumPlaysBeforeWithdraw - balance.playsWithoutWD
    const howManyGamesMaxPlayable = balance.sluggish + balance.withdrawable

    // if we cannot play the required amount of plays required, based on the maximum attempts we can gamble, use that value instead
    if (howManyGamesMaxPlayable <= remainingGamesToPlay) return howManyGamesMaxPlayable

    //
    return remainingGamesToPlay
  }

  /**
   * updates current balance relative to a bet result
   */
  private _evolveBalance (
    bet: { played: number, won: number },
    balance: ChipsBalance
  ) : ChipsBalance {
    //
    const out: ChipsBalance = {
      sluggish: balance.sluggish,
      withdrawable: balance.withdrawable
    }

    // first, remove from balance
    if (bet.played >= balance.sluggish) {
      // if we played more than sluggish, reset it
      out.sluggish = 0
      // remove remaining from withdrawable
      out.withdrawable -= bet.played - balance.sluggish
    } else {
      // ... else, remove from sluggish
      out.sluggish -= bet.played
    }

    // then, distribute
    out.withdrawable += bet.won

    // return balance
    return out
  }

  //
  //
  //

  //
  public async convertChips (playerWalletID: BigNumber, chainId: number, amount: number) : Promise<ConvertResult> {
    // checks for correct amount
    if (amount == null || amount < 0) {
      throw new UserError('invalid chips amount to withdraw')
    }

    // access DB values...
    return this._accessDatabase(playerWalletID, chainId, async (client, balance, { contract }) => {
      // checks that owns more that 0 chips
      if (balance == null || balance.withdrawable <= 0) {
        throw new UserError('no withdrawable chips, make sure that your balance is up to date')
      }

      //
      const hasPlayedEnough = this._hasPlayedEnoughtForWithdraw(balance)
      if (typeof hasPlayedEnough === 'number') {
        throw new UserError(`you need to play x${hasPlayedEnough} more before being able to withdraw`)
      }

      // if amount eq. 0, means that we want to withdraw all
      if (amount === 0) {
        amount = balance.withdrawable
      }

      // checks that available chips are enough to play the user's bet
      if (balance.withdrawable - amount < 0) {
        throw new UserError('not enough chips to withdraw')
      }

      // check if contracts can give you what you want
      if (await contract.isWithdrawPossible(amount) === false) {
        throw new UserError('bank do no have the funds to give you what is owed, please retry later')
      }

      // ask for chips to be converted then user balance updated accordingly
      const tx = (await contract.convertChips(playerWalletID.toHexString(), amount)) as ContractTransaction
      const rcp = await tx.wait()

      // update DB with new balance
      await client.chipsBalance.update({
        data: {
          withdrawable: {
            decrement: amount
          },
          tWithdrawed: {
            increment: amount
          },
          playsWithoutWD: 0
        },
        where: {
          chainId_address: {
            chainId,
            address: playerWalletID.toHexString()
          }
        },
        select: null
      })

      //
      console.log(this.__getLog(playerWalletID, chainId, `${amount} $CHIPS converted back to owner, ${getGasCostOfTx(rcp)}`))

      //
      return {
        // returns available chips left
        balance: {
          withdrawable: balance.withdrawable - amount,
          sluggish: balance.sluggish
        },
        netEvol: (balance.tWithdrawed + amount) - balance.tBought
      }
    })
  }

  //
  public async interrogateBalance (playerWalletID: BigNumber, chainId: number) : Promise<ChipsBalance> {
    // access DB values...
    return this._accessDatabase<ChipsBalance>(playerWalletID, chainId, async (client, balance, { contract }) => {
      // get total number of chips bought / airdropped by the account
      const { bought, airdropped } = await contract.account(playerWalletID.toHexString()) as BalanceAccountability

      //
      // if no trace of current balance in DB for this account...
      //

      //
      if (balance === null) {
        // set all current values to contract's user bought chips count
        // both available and total
        await client.chipsBalance.create({
          data: {
            chainId,
            address: playerWalletID.toHexString(),
            tBought: bought,
            tAirdropped: airdropped,
            withdrawable: bought,
            sluggish: airdropped
          },
          select: null
        })

        //
        const newBalance : ChipsBalance = {
          withdrawable: bought,
          sluggish: airdropped
        }

        //
        console.log(this.__getLog(playerWalletID, chainId, `Initial ${this.__blDsp(newBalance)} $CHIPS balance initialized`))

        //
        return newBalance
      }

      //
      // Check movements...
      //

      const boughtMovement = bought - balance.tBought
      const airdroppedMovement = airdropped - balance.tAirdropped

      //
      // if no movement...
      //

      // return current balance
      if (boughtMovement === 0 && airdroppedMovement === 0) {
        return {
          sluggish: balance.sluggish,
          withdrawable: balance.withdrawable
        }
      }

      //
      const boughtInvalidState = boughtMovement < 0
      const airdroppedInvalidState = airdroppedMovement < 0

      //
      // if unexpected movement (should not go down)
      //

      // log...
      if (boughtInvalidState || airdroppedInvalidState) {
        console.log(
          chalk.yellow(
            this.__getLog(playerWalletID, chainId,
              `Unexpected $CHIPS balance state (DB: ${
                this.__blDspBase(balance.tBought, balance.tAirdropped)
              } <> BC: ${
                this.__blDspBase(bought, airdropped)
              }). Forcing Sync with BC state.`
            )
          )
        )
      } else {
        console.log(
          this.__getLog(playerWalletID, chainId,
            `Manually updated balance with additional ${this.__blDspBaseIncr(boughtMovement, airdroppedMovement)} $CHIPS`
          )
        )
      }

      // compute new balance
      const newBalance : ChipsBalance = {
        withdrawable: boughtInvalidState
          ? bought
          : balance.withdrawable + boughtMovement,
        //
        sluggish: airdroppedInvalidState
          ? airdropped
          : balance.sluggish + airdroppedMovement
      }

      // update
      await client.chipsBalance.update({
        data: {
          withdrawable: newBalance.withdrawable,
          sluggish: newBalance.sluggish,
          tBought: bought,
          tAirdropped: airdropped
        },
        where: {
          chainId_address: {
            chainId,
            address: playerWalletID.toHexString()
          }
        },
        select: null
      })

      //
      return newBalance
    })
  }

  //
  //
  //

  //
  public async playWithChips<T = RouletteOutcome | CoinFlipOutcome> (
    play: BetExecutor<T>,
    register: BetRegisterer<T>,
    bet: BetConfiguration<T>
  ): Promise<BetResult<T>> {
    // checks that wanted outcome is set
    if (bet.wantedOutcome == null) {
      throw new UserError('wanted outcome is invalid')
    }

    // checks that coins to bet are set
    if (bet.howMuchCoinsToBet == null || bet.howMuchCoinsToBet <= 0) {
      throw new UserError('not betting enough')
    }

    // access DB values...
    return this._accessDatabase<BetResult<T>>(bet.playerWalletID, bet.chainId, async (client, balance) => {
      //
      const maxBet = balance.withdrawable + balance.sluggish

      // checks that the user has enough coins to bet
      if (balance == null || bet.howMuchCoinsToBet > maxBet) {
        throw new UserError('you do not have enough coins to bet')
      }

      // play !
      const outcomeResult = await play(
        bet.wantedOutcome,
        bet.howMuchCoinsToBet,
        this._getRandomFromPayload(bet.payload)
      )

      // update the available chips on the account
      const updatedBalance = this._evolveBalance(
        { played: bet.howMuchCoinsToBet, won: outcomeResult.howMuchChipsWon },
        balance
      )

      //
      console.log(
        this.__getLog(bet.playerWalletID, bet.chainId,
          `played ${bet.howMuchCoinsToBet} $CHIPS, balance went from ${this.__blDsp(balance)} to ${this.__blDsp(updatedBalance)}`
        )
      )

      // sync balance with DB
      const balanceUpdateP = client.chipsBalance.update({
        data: {
          sluggish: updatedBalance.sluggish,
          withdrawable: updatedBalance.withdrawable,
          playsWithoutWD: {
            increment: 1
          }
        },
        where: {
          chainId_address: {
            chainId: bet.chainId,
            address: bet.playerWalletID.toHexString()
          }
        },
        select: null
      })

      //
      await Promise.all([
        balanceUpdateP,
        register(client, bet, outcomeResult)
      ])

      // adds the updated balance to the result
      return {
        ...outcomeResult,
        updatedBalance
      }
    })
  }

  //
  private _getRandomFromPayload (payload: TrustfulOrderPayloadWithNonce): FairlyComputedRandom {
    //
    let secretAsHexString = this._secretsStorage.tryExtractSecretFromHash(payload.hashedSecret)

    //
    const isProvable = secretAsHexString != null

    //
    if (secretAsHexString == undefined || secretAsHexString == null) {
      secretAsHexString = RandomGenerator.asHexNumber()
    }

    //
    return {
      isProvable,
      revealedSecret: secretAsHexString,
      randomNumberProduced: ProvablyFairResolver.asHexString(
        payload.clientSeed.toHexString(),
        secretAsHexString
      )
    }
  }
}
