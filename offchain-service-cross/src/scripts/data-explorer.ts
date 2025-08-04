 
import fastify from 'fastify'

import CorsPlugin from '@fastify/cors'
import RateLimitPlugin from '@fastify/rate-limit'

import { readFileSync } from 'fs'

import { defaultDataProviderServicePort } from '#env/defaults'

import ON_DEATH from 'death'
import { getCORSParams } from '#env/server/template'
import { bindDataAPIsToWebServer } from '#web-bindings/data/_'
import { PrismaClient } from '#prisma/client/index.js'
import { DataEnvGenerator, isBearerAuthBypassAllowed } from '#env/data/generator'
import chalk from 'chalk'

//
async function main () {
  //
  const env = (new DataEnvGenerator()).build()

  //
  const webServer = fastify({
    logger: {
      level: 'warn'
    },
    https: (env.HTTPS_HOST != null && env.HTTPS_HOST.length !== 0)
      ? {
        key: readFileSync(`/etc/letsencrypt/live/${env.HTTPS_HOST}/privkey.pem`),
        cert: readFileSync(`/etc/letsencrypt/live/${env.HTTPS_HOST}/fullchain.pem`)
      }
      : null
  })

  //
  const client = new PrismaClient()

  //
  // DATA
  //

  //
  bindDataAPIsToWebServer(webServer, client)

  //
  // MIDDLEWARES
  //

  //
  const bearerAuthBypassAllowed = isBearerAuthBypassAllowed()
  if (bearerAuthBypassAllowed) {
    console.log(chalk.green('You can use the env-configured Bearer Token to bypass CORS-only API access :)'))
  }

  // Auth handling
  webServer.addHook('preHandler', (request, reply, next) => {
    // if CORS request OR not requiring bearer token...
    if (request.headers.origin != null || bearerAuthBypassAllowed === false) {
      // forward without checks
      return next()
    }

    //
    const extractToken = () => {
      // if authorization header filled...
      if (request.headers.authorization) {
        // check auth type
        const [type, token] = request.headers.authorization.split(' ')

        // if NOT bearer...
        if (type !== 'Bearer') {
          return 'Unsupported Auth'
        }

        //
        return { token }

      //
      }

      //
      const rawUrl = new URL(request.url, 'http://127.0.0.1')
      const token = rawUrl.searchParams.get('token')
      return token ? { token } : null
    }

    //
    const tPayload = extractToken()

    // if returned a string directly = ERRORed in finding token
    if (typeof tPayload === 'string') {
      return reply.code(401).send(tPayload)
    }

    // if no token found whatsoever...
    if (tPayload === null) {
      // returns unauthorized
      return reply.code(401).send('CORS-only API')
    }

    // checks against accepted token...
    if (env.ACCEPTED_BEARER_TOKEN === tPayload.token) {
      // token is ok, forward
      return next()
    }

    // else, returns unauthorized
    return reply.code(401).send(`Invalid Token => [${tPayload.token}]`)
  })

  // rate-limit Middleware
  await webServer.register(RateLimitPlugin, {
    timeWindow: 60 * 1_000, // 1 minute
    max: 100, // 50 requests per
    ban: 20, // ban the IP after spamming 20 times while being rate-limited
    cache: 10_000
  })

  // CORS Middleware
  await webServer.register(CorsPlugin, {
    origin: getCORSParams(env)
  })

  //
  // RUN
  //

  //
  ON_DEATH(() => {
    webServer.close()
    client.$disconnect()
  })

  //
  webServer.listen({ port: defaultDataProviderServicePort, host: '0.0.0.0' }, (err, address) => {
    //
    if (err) {
      console.error(err)
      process.exit(1)
    }

    //
    console.log(`[DataService] ready at ${address}`)
  })
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
