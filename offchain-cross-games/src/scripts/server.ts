import ON_DEATH from "death";
import fastify from "fastify";
import { readFileSync } from "fs";

import CorsPlugin from "@fastify/cors";
import RateLimitPlugin from "@fastify/rate-limit";

import { Casino } from "#casino/rooms";
import { defaultTrustedValidatorPort } from "#env/defaults";
import { ServerEnvGenerator } from "#env/server/generator";
import { getCORSParams } from "#env/server/template";
import { BlockchainsRuntimes } from "#lib/multi-chain/configuration";
import { getCasinoBlockchainConfigurations } from "#lib/multi-chain/configuration.builder";
import { PrismaClient } from "#prisma/client/index.js";
import { SecretsStorage } from "#provably-fair/secrets-provider";
import { bindCasinoToWebServer } from "#web-bindings/casino";
import { bindMiscToWebServer } from "#web-bindings/misc";

//
const main = async () => {
  //
  const env = new ServerEnvGenerator().build();

  //
  const secretsStorage = new SecretsStorage();

  //
  const runtimes = await BlockchainsRuntimes.gather(
    env,
    getCasinoBlockchainConfigurations(),
  );

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
  const client = new PrismaClient();

  //
  // CASINO
  //

  //
  const casino = new Casino(client, runtimes, secretsStorage);

  //
  bindCasinoToWebServer(webServer, casino);

  //
  // MISC
  //

  //
  bindMiscToWebServer(webServer, runtimes, secretsStorage);

  //
  // MIDDLEWARES
  //

  // Auth handling
  webServer.addHook("preHandler", (request, reply, next) => {
    // if CORS request
    if (request.headers.origin != null) {
      // forward without checks
      return next();
    }

    // else, returns unauthorized
    return reply.code(401).send();
  });

  // rate-limit Middleware
  await webServer.register(RateLimitPlugin, {
    timeWindow: 60 * 1_000, // 1 minute
    max: 100, // 50 requests per
    ban: 20, // ban the IP after spamming 20 times while being rate-limited
    cache: 10_000,
  });

  // CORS Middleware
  await webServer.register(CorsPlugin, {
    origin: getCORSParams(env),
  });

  //
  // RUN
  //

  //
  ON_DEATH(() => {
    webServer.close();
    casino.discardConnection();
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
};

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exit(1);
});
