import { BigNumber } from 'ethers'
import { sha256 } from 'ethers/lib/utils'

import { getMeaningfulMessageFromError } from '#/src/lib/EthersErrorDigger'
import type { SEPRunState } from '#/src/lib/SingleExecPromise'

/** Requested payload from the off-chain service */
export class PerishableSecretHash {
  /** Requested secret hash */
  hash: BigNumber
  /** Epoch seconds at which the server auto-dispose of the secret */
  autoDisposedAt: number

  /** check the validity of the  */
  public static isValid (psh: PerishableSecretHash) {
    if (psh == null) return false
    const secondsSinceEpoch = Math.round(Date.now() / 1000)
    return psh.autoDisposedAt > secondsSinceEpoch
  }
}

/** Validation Bot response to a Secure Transaction */
export interface TrustfulBotResponse {
    /** nonce of the order within its running context */
    nonce: number
    /** if the bot have been able to use the hashed secret provided within the inital request */
    wasHashedSecretLegitimate: boolean
    /** random number generated off-chain by the bot */
    randomNumber: BigNumber
    /** the secret used to generate the random number */
    usedSecret: BigNumber
}

/** @dev all is optionnal since the context evolves as the user fills the data */
export interface TrustfulPayloadContext {
    /** a random seed selected by the user */
    clientSeed?: BigNumber
    /** a playload containing an hash of a secret that was produced earlier by the Validation Bot */
    pshPayload?: PerishableSecretHash
    /** state of any secret hash fetching operation linked to this context */
    requestingSecret?: SEPRunState
    /**
     * define if we explicitly expect this transaction context to be provable
     * @dev should never be null, but for conviniency sake when invoking AgnosticOnChainSecurePopupTx-like from setup(), let it be for a split-second
     */
    wantedAsProvable?: boolean
}

//
//
//

export type TPCUpdater = (c: TrustfulPayloadContext) => void

//
export const updateClientSeedFromPP = (passPhrase: string, toUpdate: TrustfulPayloadContext, updater: TPCUpdater) => {
  //
  if (toUpdate == null) return
  const isOK = passPhrase != null && passPhrase.length !== 0

  //
  toUpdate.clientSeed = isOK
    ? BigNumber.from(
      sha256(
        Buffer.from(passPhrase, 'utf-8')
      )
    )
    : null

  //
  updater(toUpdate)
}

export const requestServerSecret = async (toUpdate: TrustfulPayloadContext, updater: TPCUpdater) => {
  //
  if (toUpdate == null) return
  if (toUpdate.requestingSecret === true) return

  //
  toUpdate.requestingSecret = true
  updater(toUpdate)

  //
  await _requestSecret()
    .then(pSH => {
      toUpdate.pshPayload = pSH
      toUpdate.requestingSecret = false
      updater(toUpdate)
    })
    .catch(err => {
      toUpdate.requestingSecret = getMeaningfulMessageFromError(err)
      updater(toUpdate)
    })
}

//
const _requestSecret = () =>
  fetch(process.env.NEXT_PUBLIC_SECRET_PROVIDER_URL + '/generate/secret')
    .then<PerishableSecretHash>(async r => {
    //
      const raw = await r.text()

      //
      if (r.status !== 200) {
        return Promise.reject(
          new Error(raw)
        )
      }

      //
      const responseText = JSON.parse(raw)

      //
      return {
        autoDisposedAt: responseText.disposedAt,
        hash: BigNumber.from(responseText.secretHash)
      }
    })
