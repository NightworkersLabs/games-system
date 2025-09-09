import { BigNumber } from "ethers";
import { keccak256 } from "ethers/lib/utils.js";

import type TrustfulOrderPayloadWithNonce from "#/src/lib/provably-fair/TrustfulOrderPayloadWithNonce";

export class ProvablyFairResolver {
  /**
   * This is how we compute a random number from an provably-fair order payload and a server secret.
   * This can, should and must be replicated client-side by any user to replay how we calculate every fair random number.
   * @dev Concatenate :
   * - clientSeed, as stringified hex representation. careful 0 casts to "0x00" !
   * - nonce, as string decimal representation of its ID. 1243 is "1243"
   * - secretAsHexString, self explainatory. Something like "0xa943..."
   * @returns the random number, rendered as its hex representation
   */
  private static _asHexString(
    clientSeed: BigNumber,
    nonce: number,
    secretAsHexString: string,
  ): string {
    // concat...
    const concat =
      clientSeed.toHexString() + nonce.toString() + secretAsHexString;

    // then, consider the concate string as ASCII, and turn it into SHA-3 hex representation
    const random = keccak256(Buffer.from(concat, "ascii"));

    //
    return random;
  }

  //
  static asBigNumber(
    clientSeed: BigNumber,
    nonce: number,
    secretAsHexString: string,
  ): BigNumber {
    return BigNumber.from(
      ProvablyFairResolver._asHexString(clientSeed, nonce, secretAsHexString),
    );
  }

  //
  static fromPayloadAsHex(
    payload: TrustfulOrderPayloadWithNonce,
    secretAsHexString: string,
  ): string {
    return ProvablyFairResolver._asHexString(
      payload.clientSeed,
      payload.nonce,
      secretAsHexString,
    );
  }

  //
  static fromPayload(
    payload: TrustfulOrderPayloadWithNonce,
    secretAsHexString: string,
  ): BigNumber {
    return ProvablyFairResolver.asBigNumber(
      payload.clientSeed,
      payload.nonce,
      secretAsHexString,
    );
  }
}
