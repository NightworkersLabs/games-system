import { BigNumber, ethers } from "ethers";
import {
  type FastifyInstance,
  type FastifyReply,
  type FastifyRequest,
} from "fastify";
import { type FromSchema } from "json-schema-to-ts";

import { coinflipRegisterer, rouletteRegisterer } from "#casino/db";
import {
  CoinFlipOutcomeV,
  coinFlipper,
  RouletteOutcomeV,
  rouletteSpinner,
} from "#casino/rand";
import type { Casino } from "#casino/rooms";
import { UserError } from "#lib/helpers";
import {
  produceTOPWN,
  type TrustfulOrderPayloadWithNonce,
} from "#provably-fair/compliance";

//
//
//

//
const IIdentifyProofT = {
  properties: {
    account: { type: "string" },
    accSign: { type: "string" },
    chainId: { type: "number" },
  },
  required: ["account", "accSign", "chainId"],
} as const;

//
const ITrustfulBetT = {
  properties: {
    expectedNonce: { type: "number" },
    clientSeed: { type: "string" },
    hashedSecret: { type: "string" },
  },
} as const;

//
const IBasicBetT = {
  properties: {
    howManyToBet: { type: "number" },
  },
  required: ["howManyToBet"],
} as const;

//
//
//

//
const updateChipsBalance = {
  type: "object",
  additionalProperties: false,
  ...IIdentifyProofT,
} as const;

//
const convertChips = {
  type: "object",
  allOf: [
    IIdentifyProofT,
    {
      properties: {
        howMuchToConvert: { type: "number" },
      },
      required: ["howMuchToConvert"],
    },
  ],
} as const;

//
const rouletteBet = {
  type: "object",
  allOf: [
    IIdentifyProofT,
    ITrustfulBetT,
    IBasicBetT,
    {
      properties: {
        wantedOutcome: { enum: RouletteOutcomeV },
      },
      required: ["wantedOutcome"],
    },
  ],
} as const;

//
const coinflipBet = {
  type: "object",
  allOf: [
    IIdentifyProofT,
    ITrustfulBetT,
    IBasicBetT,
    {
      properties: {
        wantedOutcome: { enum: CoinFlipOutcomeV },
      },
      required: ["wantedOutcome"],
    },
  ],
} as const;

//
//
//

const _identifyProof = {
  type: "object",
  additionalProperties: false,
  ...IIdentifyProofT,
} as const;

/** @dev old-school promise handling to allow user-errors interception */
const validateIdentity = <T>(
  request: FastifyRequest,
  reply: FastifyReply,
  /** payload that contains the authentication data */
  payload: FromSchema<typeof _identifyProof>,
  /** method that will carry the signed-in account after a successful login */
  cb: (signedInAccount: BigNumber) => Promise<T>,
): void => {
  //
  new Promise((resolve, reject) => {
    //
    const verification = ethers.utils
      .verifyMessage(IDText, payload.accSign)
      .toLowerCase();
    if (verification !== payload.account) {
      throw new UserError(
        "Cannot validate identity of requester. Please log-in again.",
      );
    }

    //
    const signedInAccount = BigNumber.from(payload.account);
    if (signedInAccount.isZero()) {
      throw new Error("signed in account is not parsable");
    }

    //
    cb(signedInAccount)
      .then((data) => resolve(reply.send(data)))
      .catch(reject);
    //
  }).catch((err) => {
    /** prevent UserErrors to be logged */
    if (!(err instanceof UserError)) {
      request.log.warn(err);
    }

    // error normal response
    return reply.code(500).send({
      message: err.message,
    });
  });
};

const _trustfulBet = {
  type: "object",
  additionalProperties: false,
  ...ITrustfulBetT,
} as const;

//
const produceTOPWNFromSchema = ({
  clientSeed,
  hashedSecret,
  expectedNonce,
}: FromSchema<typeof _trustfulBet>): TrustfulOrderPayloadWithNonce => {
  return produceTOPWN(clientSeed, hashedSecret, expectedNonce);
};

//
//
//

const IDText =
  "To Access Night Workers's Casino, you need to sign this text to authenticate yourself. This operation is absolutely free.";

//
export const bindCasinoToWebServer = (
  webServer: FastifyInstance,
  casino: Casino,
) => {
  //
  webServer.get("/casino/sign-text", () => IDText);

  //
  webServer.post<{ Body: FromSchema<typeof updateChipsBalance> }>(
    "/casino/balance",
    {
      schema: {
        body: updateChipsBalance,
      },
    },
    (req, rep) => {
      validateIdentity(req, rep, req.body, (signedInAccount) =>
        casino.interrogateBalance(signedInAccount, req.body.chainId),
      );
    },
  );

  //

  webServer.post<{ Body: FromSchema<typeof convertChips> }>(
    "/casino/convert",
    {
      schema: {
        body: convertChips,
      },
    },
    (req, rep) => {
      validateIdentity(req, rep, req.body, (signedInAccount) =>
        casino.convertChips(
          signedInAccount,
          req.body.chainId,
          req.body.howMuchToConvert,
        ),
      );
    },
  );

  //
  webServer.post<{ Body: FromSchema<typeof rouletteBet> }>(
    "/casino/spin",
    {
      schema: {
        body: rouletteBet,
      },
    },
    (req, rep) => {
      validateIdentity(req, rep, req.body, (signedInAccount) =>
        casino.playWithChips(rouletteSpinner, rouletteRegisterer, {
          playerWalletID: signedInAccount,
          chainId: req.body.chainId,
          howMuchCoinsToBet: req.body.howManyToBet,
          wantedOutcome: req.body.wantedOutcome,
          payload: produceTOPWNFromSchema(req.body),
        }),
      );
    },
  );

  //
  webServer.post<{ Body: FromSchema<typeof coinflipBet> }>(
    "/casino/flip",
    {
      schema: {
        body: coinflipBet,
      },
    },
    (req, rep) => {
      validateIdentity(req, rep, req.body, (signedInAccount) =>
        casino.playWithChips(coinFlipper, coinflipRegisterer, {
          playerWalletID: signedInAccount,
          chainId: req.body.chainId,
          howMuchCoinsToBet: req.body.howManyToBet,
          wantedOutcome: req.body.wantedOutcome,
          payload: produceTOPWNFromSchema(req.body),
        }),
      );
    },
  );
};
