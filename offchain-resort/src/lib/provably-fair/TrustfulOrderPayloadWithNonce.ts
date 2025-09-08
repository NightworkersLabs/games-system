import { BigNumber } from 'ethers'

export default interface TrustfulOrderPayloadWithNonce {
    nonce: number
    clientSeed: BigNumber
    hashedSecret: BigNumber
  }
