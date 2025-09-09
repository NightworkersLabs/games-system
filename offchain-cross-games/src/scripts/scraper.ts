import chalk from "chalk";
import ON_DEATH from "death";
import { lastValueFrom, merge } from "rxjs";

import { CasinoBankEventsScraper } from "#data-scraper/contracts/CasinoBank/configuration";
import { ScraperEnvGenerator } from "#env/scraper/generator";
import { BlockchainsRuntimes } from "#lib/multi-chain/configuration";
import { getCasinoBlockchainConfigurations } from "#lib/multi-chain/configuration.builder";
import { PrismaClient } from "#prisma/client/index.js";

const main = async () => {
  //
  const env = new ScraperEnvGenerator().build();

  //
  const client = new PrismaClient();

  //
  const runtimes = await BlockchainsRuntimes.gather(
    env,
    getCasinoBlockchainConfigurations(),
  );
  const scrapers = runtimes.allRuntimes.map(
    (runtime) => new CasinoBankEventsScraper(runtime, client),
  );

  //
  // RUN
  //

  //
  ON_DEATH(() => {
    // shutdown all scrapers
    scrapers.forEach((scr) => scr.stop());
  });

  // startup and run all scrapers. If any fail, ignore them
  const scrapersInit = await Promise.allSettled(
    scrapers.map((scr) =>
      scr.run().catch((e) => {
        throw new Error(`Scrapper for BC n°${scr.chainId} - ${e}`);
      }),
    ),
  );

  // log failing scrapers
  scrapersInit
    .filter((r) => r.status === "rejected")
    .forEach((r) => {
      if (r.status === "rejected") {
        console.log(chalk.red(r.reason));
      }
    });

  // gather ready scrapers
  const scrapersReady = scrapersInit
    .filter((r) => r.status === "fulfilled")
    .map((r) => (r.status === "fulfilled" ? r.value : null))
    .filter((scr) => scr != null);

  // throw if no scraper is ready
  if (scrapersReady.length === 0) {
    throw new Error("No scraper could have been initialized. Aborting.");
  }

  // wait for the last scraper to complete
  await lastValueFrom(
    merge(...scrapersReady),
    { defaultValue: null }, // if not even a result was emitted, returns null and do not throw
  );

  // disconnect from database
  await client.$disconnect();

  //
  console.log("=> Scraper ended <=");
};

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exit(1);
});
