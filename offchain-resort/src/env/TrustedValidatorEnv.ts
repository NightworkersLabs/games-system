import "dotenv/config";

import env from "env-var";
import { Wallet } from "ethers";

import type { Provider } from "@ethersproject/abstract-provider";

import { type ITrustedValidatorEnv } from "#/src/env/ITrustedValidatorEnv";

//
export class TrustedValidatorEnv {
  //
  static build(): ITrustedValidatorEnv {
    //
    const out = {
      RPC_URL: env.get("RPC_URL").required().asString(),
      CHAIN_ID: env.get("CHAIN_ID").required().asInt(),
      LOTTERY: env.get("LOTTERY").required().asString(),
      NIGHTWORKERS_GAME: env.get("NIGHTWORKERS_GAME").required().asString(),
      RED_LIGHT_DISTRICT: env.get("RED_LIGHT_DISTRICT").required().asString(),
      TABLE_GAMES: env.get("TABLE_GAMES").required().asString(),
      MNEMO_OR_PRIV_KEY: env.get("MNEMO_OR_PRIV_KEY").required().asString(),
      CORS_ALLOWED_URL: env.get("CORS_ALLOWED_URL").asString(),
      HTTPS_HOST: env.get("HTTPS_HOST").asString(),
    };

    //
    const redacted = Object.assign({}, out);
    redacted.MNEMO_OR_PRIV_KEY = `===[REDACTED]=== (length: ${redacted.MNEMO_OR_PRIV_KEY.length})`;
    console.log("=== USED ENV VARIABLES ===>", redacted);

    //
    return out;
  }

  //
  static getWalletFromEnv(MNEMO_OR_PRIV_KEY: string, provider: Provider) {
    // is mnemo
    if (MNEMO_OR_PRIV_KEY.includes(" ")) {
      const wallet = Wallet.fromMnemonic(MNEMO_OR_PRIV_KEY);
      return wallet.connect(provider);
    }

    // is private key
    return new Wallet(MNEMO_OR_PRIV_KEY, provider);
  }

  //
  static getCORSParamsFromEnv = (CORS_ENV?: string) => {
    //
    if (CORS_ENV == null || CORS_ENV.length !== 0) return "*";

    //
    if (CORS_ENV.includes(",")) {
      return CORS_ENV.split(",");
    }

    //
    return CORS_ENV;
  };
}
