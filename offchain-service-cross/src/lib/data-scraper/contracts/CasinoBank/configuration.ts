 
import { type CasinoBank__sync, PrismaClient } from '#prisma/client/index.js'
import { EDC_ChipsBought } from './events/ChipsBought'
import { EDC_TaxRevenueTransfered } from './events/TaxRevenueTransfered'
import { type EventRuntime, EventsScraper } from '#data-scraper/engine/eventsScraper'
import { BigNumber } from 'ethers'

import type { CasinoBlockchainRuntime } from '#lib/multi-chain/configuration'
import { EDC_ChipsConverted } from './events/ChipsConverted'

//
export class CasinoBankEventsScraper extends EventsScraper<CasinoBank__sync> {
  //
  constructor (
    bcRuntime: CasinoBlockchainRuntime,
    client: PrismaClient
  ) {
    //
    super(bcRuntime, 'CasinoBank', client,
      (contract, chainId) => [
        new EDC_ChipsBought(contract, client, chainId),
        new EDC_TaxRevenueTransfered(contract, client, chainId),
        new EDC_ChipsConverted(contract, client, chainId)
      ]
    )
  }

  //
  //
  //

  //
  override async _getSyncData (eventName: string) {
    const findingRq = this._client.casinoBank__sync.findUnique({
      where: {
        chainId_eventName: {
          chainId: this.chainId,
          eventName
        }
      }
    })
    return findingRq;
  }

  //
  override async _createSyncData (creationBlock: BigNumber, eventName: string) {
    // is realistically safely castable into number
    const cbNum = creationBlock.toNumber()

    //
    return this._client.casinoBank__sync.create({
      data: {
        chainId: this.chainId,
        eventName,
        blockCreated: cbNum,
        blockSync: cbNum
      }
    })
  }

  //
  override async _updateSyncBlock (blockSync: number, runtime: EventRuntime<CasinoBank__sync>) {
    //
    await this._client.casinoBank__sync.update({
      data: {
        blockSync
      },
      where: {
        chainId_eventName: {
          chainId: this.chainId,
          eventName: runtime.syncContext.eventName
        }
      },
      select: null
    })

    //
    runtime.syncContext.blockSync = blockSync

    //
    return runtime
  }
}
