import { type FastifyInstance } from 'fastify'

import { SecretsStorage } from '#provably-fair/secrets-provider'
import { BlockchainsRuntimes } from '#lib/multi-chain/configuration'
import { type FromSchema } from 'json-schema-to-ts'
import { BigNumber } from 'ethers'

//
const mandatoryChainId = {
  type: 'object',
  additionalProperties: false,
  properties: {
    chainId: { type: 'number' }
  },
  required: ['chainId']
} as const

//
export function bindMiscToWebServer (webServer: FastifyInstance, runtimes: BlockchainsRuntimes, secretsStorage: SecretsStorage) {
  //
  webServer.get('/generate/secret', () =>
    ({
      secretHash: secretsStorage.requestSecretH(),
      disposedAt: (new Date().getTime() / 1_000) + secretsStorage.secsBeforeAutoDispose // epoch seconds
    })
  )

  // check controller's account balance
  webServer.get<{ Querystring: FromSchema<typeof mandatoryChainId> }>(
    '/controller/balance',
    {
      schema: {
        querystring: mandatoryChainId
      }
    },
    async request => {
      //
      const runtime = runtimes.safeGetRuntime(request.query.chainId)

      //
      const e = await (runtime.controller.getBalance() as Promise<BigNumber>)
      return e.toHexString()
    })
}
