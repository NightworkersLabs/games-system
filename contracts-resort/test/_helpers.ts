import { expect } from 'chai'
import { BigNumber, Contract, ContractReceipt, ContractTransaction, Signer } from 'ethers'
import { parseEther } from 'ethers/lib/utils'
import { ethers } from 'hardhat'
import { TrustedValidatorDaemon } from '@offchain-service/lib/tv-daemon'
import { TrustfulOrderPayload } from '@offchain-service/lib/validator/watcher'
import { PayableMintPrices } from './_context'

export interface CheckedMintOrderRecap {
  orderedAtTokenId: number
  lastExpectedTokenId: number
  txR: ContractReceipt
}

export type PayablePrices = 'base' | 'wl' | 'scarce' | 'free'

export class BasicOrderArgs {
  howMany?: number
  payload?: TrustfulOrderPayload

  //
  public static fromDefault (args?: BasicOrderArgs) : BasicOrderArgs {
    return {
      howMany: args.howMany ?? 1,
      payload: args.payload ?? TrustfulOrderPayload.empty()
    }
  }
}

export class OrderArgs extends BasicOrderArgs {
  /** amount to pay the order, in currency (eg. "value") */
  amount?: PayablePrices | BigNumber
  signer?: Signer

  //
  public static fromDefault (args?: OrderArgs) : OrderArgs {
    return {
      ...super.fromDefault(args),
      amount: args.amount ?? 'base',
      signer: args.signer
    }
  }
}

export class MintOrderer {
  //
  private _contract: Contract
  private _daemon: TrustedValidatorDaemon
  private _defaultSigner: Signer
  private _prices: PayableMintPrices

  //
  constructor (defaultSigner: Signer, gameContract: Contract, daemon: TrustedValidatorDaemon, prices: PayableMintPrices) {
    this._contract = gameContract
    this._daemon = daemon
    this._defaultSigner = defaultSigner
    this._prices = prices
  }

  private async _getMinted () {
    return await this._contract.minted() as number
  }

  /** */
  async checked (args?: OrderArgs): Promise<CheckedMintOrderRecap> {
    //
    args = OrderArgs.fromDefault(args)

    //
    const before = await this._getMinted()
    const txR = await this.unchecked(args)
    const after = await this._getMinted()

    //
    expect(after).to.equals(before + args.howMany)

    //
    return {
      orderedAtTokenId: before,
      lastExpectedTokenId: after,
      txR
    }
  }

  /** */
  async unchecked (args?: OrderArgs) {
    //
    args = OrderArgs.fromDefault(args)

    //
    const tx = await this.raw(args)
    const rcpt = await tx.wait()
    await this._daemon.injectAndWait(rcpt)
    return rcpt
  }

  /** */
  async raw (args?: OrderArgs) {
    //
    const { amount, howMany, payload, signer } = OrderArgs.fromDefault(args)

    //
    let price: BigNumber
    if (amount instanceof BigNumber) {
      price = amount
    } else {
      switch (amount) {
      case 'base':
        price = this._prices.base
        break
      case 'free':
        price = parseEther('0')
        break
      case 'scarce':
        price = this._prices.scarce
        break
      case 'wl':
        price = this._prices.wl
        break
      default:
        throw new Error('unhandled enum price')
      }
    }

    //
    return MintOrderer.rawS(
      this._contract.connect(signer ?? this._defaultSigner),
      price,
      { howMany, payload }
    )
  }

  //
  //
  //

  static async waitedS (contract: Contract, price: BigNumber, args?: BasicOrderArgs) {
    //
    args = BasicOrderArgs.fromDefault(args)

    //
    const tx = await this.rawS(contract, price, args)
    return await tx.wait()
  }

  static async rawS (contract: Contract, price: BigNumber, args?: BasicOrderArgs) {
    //
    const { howMany, payload } = BasicOrderArgs.fromDefault(args)

    //
    return contract.orderMint(howMany, payload, {
      value: price.mul(howMany)
    }) as Promise<ContractTransaction>
  }
}

export const mineTimeWarpSecs = async (seconds: number) => {
  //
  if (seconds < 1) throw new Error('Must be warping more that 1 second')

  //
  const blockNumBefore = await ethers.provider.getBlockNumber()
  const blockBefore = await ethers.provider.getBlock(blockNumBefore)

  //
  const to = blockBefore.timestamp + seconds - 1 // remove 1 for the next TX to be exactly within X seconds

  //
  await ethers.provider.send('evm_mine', [to])

  //
  return to
}
