import { ScraperEnvGenerator } from '#env/scraper/generator'
import { BlockchainsRuntimes } from '#lib/multi-chain/configuration'
import { getCasinoBlockchainConfigurations } from '#lib/multi-chain/configuration.builder'
import { PrismaClient } from '#prisma/client/index.js'

//
async function main () {
  //
  const env = (new ScraperEnvGenerator()).build()

  //
  const client = new PrismaClient()

  //
  const runtimes = await BlockchainsRuntimes.gather(env, getCasinoBlockchainConfigurations())

  // get data to update
  const updateContextes = await Promise.all(
    runtimes.allRuntimes.map(async r => ([
      r,
      await client.casinoBank_ChipsConverted.findMany({
        select: {
          block: true,
          grantedTo: true
        },
        where: {
          bts: undefined,
          chainId: r.chainId
        }
      })
    ] as const)
    )
  )

  // remove empty + flatten
  const flattened = updateContextes
    .filter(([, l]) => l.length > 0)
    .flatMap(([r, l]) => l.map(o => Object.assign({ r }, o)))

  // bring block timestamp
  const enrichedCtx = await Promise.all(
    flattened.map(async ctx => ({
      ...ctx,
      bts: await ctx.r.controller.provider.getBlock(ctx.block).then(b => new Date(b.timestamp * 1000))
    })
    )
  )

  // exec...
  await Promise.all(
    enrichedCtx.map(({ block, bts, grantedTo, r: { chainId } }) =>
      client.casinoBank_ChipsConverted.update({
        data: {
          bts
        },
        select: null,
        where: {
          chainId_block_grantedTo: {
            block,
            grantedTo,
            chainId
          }
        }
      })
    )
  )
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
