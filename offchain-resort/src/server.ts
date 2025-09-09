import ON_DEATH from "death";
import { ethers } from "ethers";
import fastify from "fastify";
import { readFileSync } from "fs";

import CorsPlugin from "@fastify/cors";
import RateLimitPlugin from "@fastify/rate-limit";

import { defaultTrustedValidatorPort } from "#/src/env/defaults";
import { TrustedValidatorEnv } from "#/src/env/TrustedValidatorEnv";
import { SecretsStorage } from "#/src/lib/provably-fair/secrets-provider";
import { TrustedValidatorDaemon } from "#/src/lib/tv-daemon";
import { bindTVDToWebServer } from "#/src/web-bindings/tv-daemon";

//
const main = async () => {
  //
  const env = TrustedValidatorEnv.build();

  //
  const provider = new ethers.providers.JsonRpcProvider(
    env.RPC_URL,
    env.CHAIN_ID,
  );
  const wallet = TrustedValidatorEnv.getWalletFromEnv(
    env.MNEMO_OR_PRIV_KEY,
    provider,
  );

  //
  const secretsStorage = new SecretsStorage();

  //
  const webServer = fastify({
    logger: {
      level: "warn",
    },
    https:
      env.HTTPS_HOST != null && env.HTTPS_HOST.length !== 0
        ? {
            key: readFileSync(
              `/etc/letsencrypt/live/${env.HTTPS_HOST}/privkey.pem`,
            ),
            cert: readFileSync(
              `/etc/letsencrypt/live/${env.HTTPS_HOST}/fullchain.pem`,
            ),
          }
        : null,
  });

  //
  // Trustful Validator
  //

  //
  const tvd = new TrustedValidatorDaemon(
    {
      lotteryContractAddress: env.LOTTERY,
      nwContractAddress: env.NIGHTWORKERS_GAME,
      rldContractAddress: env.RED_LIGHT_DISTRICT,
      tgContractAddress: env.TABLE_GAMES,
      trustedValidator: wallet,
    },
    secretsStorage,
    await provider.getBlockNumber(),
  );

  //
  bindTVDToWebServer(webServer, tvd, secretsStorage);

  //
  // MIDDLEWARES
  //

  // rate-limit Middleware
  webServer.register(RateLimitPlugin, {
    max: 50,
    timeWindow: 60 * 1_000, // 1 minute
    ban: 20, // ban the IP after spamming 20 times while being rate-limited
    cache: 10_000,
  });

  // CORS Middleware
  webServer.register(CorsPlugin, {
    origin: TrustedValidatorEnv.getCORSParamsFromEnv(env.CORS_ALLOWED_URL),
  });

  //
  // RUN
  //

  //
  ON_DEATH(() => {
    webServer.close();
    tvd.stop();
  });

  //
  webServer.listen(
    { port: defaultTrustedValidatorPort, host: "0.0.0.0" },
    (err, address) => {
      //
      if (err) {
        console.error(err);
        process.exit(1);
      }

      //
      console.log(`[TrustedValidator] ready at ${address}`);
    },
  );

  //
  await tvd.exec();
};

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
