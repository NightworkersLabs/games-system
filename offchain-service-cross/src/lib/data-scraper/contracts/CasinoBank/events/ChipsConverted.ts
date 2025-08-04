 
import { type CasinoBank_ChipsConverted, PrismaClient } from '#prisma/client/index.js'
import { type EventsDatabaseFiller, EventsScraperConfiguration, type EventsFormatter, decimalParser } from '#data-scraper/engine/eventsScraperConfiguration'
import { Contract } from 'ethers'

export class EDC_ChipsConverted extends EventsScraperConfiguration<CasinoBank_ChipsConverted> {
  //
  constructor (contract: Contract, client: PrismaClient, chainId: number) {
    super(contract, client, 'ChipsConverted', chainId)
  }

  //
  override inserter: EventsDatabaseFiller<CasinoBank_ChipsConverted> = toInsert =>
    this._client.casinoBank_ChipsConverted.createMany({
      data: toInsert,
      skipDuplicates: true // whenever sync block is not correctly updated, we might try to insert events that already are in DB
    })

  //
  override formatter: EventsFormatter<CasinoBank_ChipsConverted> = async ({ blockNumber, args, getBlock }) =>
    ({
      coinsAmount: args?.coinsAmount as number,
      block: blockNumber,
      chainId: this._chainId,
      convertedAmount: decimalParser(args?.convertedAmount),
      grantedTo: args?.grantedTo as string,
      bts: await getBlock().then(b => new Date(b.timestamp * 1000))
    })
}
