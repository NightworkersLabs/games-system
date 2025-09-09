import { randomBytes } from "crypto";
import { BigNumber } from "ethers";
import { keccak256 } from "ethers/lib/utils.js";

/** Depending on the context, elements contained in this interface could be used to produce */
export interface TrustfulOrderPayloadWithNonce {
  /** part of the random number computation that is given by the requester. Zeroed if requester do not want provability. */
  clientSeed: BigNumber;
  /**
   * hash of a secret that was requested earlier by the requester. If outdated or has been used within another request (considered as unsafe),
   * it will not be used, rendering the whole process non-provable.
   */
  hashedSecret: BigNumber;
  /** nonce that the requester expects within the request context. Will be checked against server-side expected value if meaningful. */
  nonce?: number;
}

/** try to generate a well formatted TrustfulOrderPayloadWithNonce from raw requester data */
export const produceTOPWN = (
  rawRequestClientSeed?: string,
  rawHashedSecret?: string,
  rawRequestNonce?: number,
): TrustfulOrderPayloadWithNonce => {
  try {
    return {
      clientSeed:
        (rawRequestClientSeed?.length ?? 0) > 0
          ? BigNumber.from(rawRequestClientSeed)
          : RandomGenerator.asBigNumber(),
      hashedSecret: BigNumber.from(
        rawHashedSecret?.length ? rawHashedSecret : 0,
      ),
      nonce: rawRequestNonce,
    };
  } catch (_) {
    throw new Error(
      "Client seed or secret hash were missformated, please try again.",
    );
  }
};

//
export class ProvablyFairResolver {
  /**
   * This is how we compute a random number from an provably-fair order payload and a server secret.
   * This can, should and must be replicated client-side by any user to replay how we calculate every fair random number.
   * @dev Concatenate :
   * - clientSeed, as stringified hex representation. careful 0 casts to "0x00" !
   * - contextNonce, as string decimal representation of its ID. 1243 is "1243"
   * - revealedSecretAsHexString, self explainatory. Something like "0xa943..."
   * @param clientSeedAsHexString requester provided seed, turned into string representation "0x00AB..."
   * @param revealedSecretAsHexString the secret that was revealed, depending on validity of requester's "hashedSecret";
   * @param contextNonce nonce that is meaningful within this resolving context (not necessarily the one provided by the requester)
   * could be either the value beneath "hashedSecret", or a completly unrelated secret (see TrustfulOrderPayloadWithNonce definition).
   * @returns the random number, rendered as its hex representation ("0xAB3...")
   */
  public static asHexString(
    clientSeedAsHexString: string,
    revealedSecretAsHexString: string,
    contextNonce?: number,
  ): string {
    // concat every available values
    const concat =
      clientSeedAsHexString +
      // zeroed if undefined
      (contextNonce ?? 0).toString() +
      revealedSecretAsHexString;

    // then, turn it into SHA-3 hex representation with "keccak256"
    const random = keccak256(
      // consider the concatenated string as ASCII
      Buffer.from(concat, "ascii"),
    );

    //
    return random;
  }
}

//
//
//

//
export class RandomGenerator {
  /**
   * generate a fresh random number, represented as a string of an hex
   */
  static asHexNumber(): string {
    const binarySecret = randomBytes(32); // 256 random bits
    return "0x" + binarySecret.toString("hex");
  }

  //
  static asBigNumber(): BigNumber {
    return BigNumber.from(RandomGenerator.asHexNumber());
  }
}
