import { type FastifyInstance } from "fastify";

import type { SecretsStorage } from "#/src/lib/provably-fair/secrets-provider";
import type { TrustedValidatorDaemon } from "#/src/lib/tv-daemon";

export const bindTVDToWebServer = (
  webServer: FastifyInstance,
  tvd: TrustedValidatorDaemon,
  secretsStorage: SecretsStorage,
) => {
  //
  webServer.get("/requestSecret", async () => ({
    secretHash: await secretsStorage.requestSecretH(),
    disposedAt:
      new Date().getTime() / 1_000 + secretsStorage.secsBeforeAutoDispose, // epoch seconds
  }));

  // check account balance
  webServer.get("/balance", () =>
    tvd.getBalance().then((e) => e.toHexString()),
  );
};
