import { randomBytes } from "crypto";
import { BigNumber } from "ethers";

export class RandomGenerator {
  /**
   * generate a fresh random number, represented as a string of an hex
   */
  static async asHexNumber(): Promise<string> {
    const binarySecret = await randomBytes(32); // 256 random bits
    return "0x" + binarySecret.toString("hex");
  }

  //
  static async asBigNumber() {
    return BigNumber.from(await RandomGenerator.asHexNumber());
  }
}
