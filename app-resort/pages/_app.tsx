import { ChakraProvider } from '@chakra-ui/react'
import main from 'theme/main'

import Head from 'next/head'

import 'styles/globals.css'
import 'styles/hub.css'
import 'styles/u-gauge.css'
import 'styles/bet-tracker.css'

import { BLOCKCHAIN_CURRENCY_NAME, NWERC20_NAME } from 'env/defaults'

import { config } from '@fortawesome/fontawesome-svg-core'
import '@fortawesome/fontawesome-svg-core/styles.css'
config.autoAddCss = false

//
//
//

const description = `Flip coins, Spin roulettes and play lottery to get rich and feed the vault ! \
Get your exclusive Pimps and Hookers ! \
Stake them to win ${NWERC20_NAME} and get back w${BLOCKCHAIN_CURRENCY_NAME} from the Vault. \
Audit, KYC and Multi-signature governance :)`

//
const mainProduct = 'Night Workers'
const title = `${mainProduct} - Casino | NFT | P2E`

//
export const domain = process.env.NEXT_PUBLIC_DOMAIN ?? 'nightworkers.vercel.app'
const url = `https://${domain}/`
const googleOwnDomainTag = 'LhBN99NI_16ahBQ5ywbOYfMnte3hiZD8UHhIv8xOzpo' /** liked to nightworkers-testnet.vercel.app */

//
const image = `${url}banner.jpg`

//
//
//

export default function NWApp ({ Component, pageProps }) {
  return (
    <ChakraProvider theme={main}>
      <NWHead />
      <Component {...pageProps} />
    </ChakraProvider>
  )
}

function NWHead () {
  //
  return (
    <Head>
      <title>{title}</title>

      {/** Basic Informations */}
      <meta name="application-name" content={title} />
      <meta name="description" content={description} />
      <meta name="google-site-verification" content={googleOwnDomainTag} />

      {/** Icons */}
      <link rel="icon" href="/favicon.png" />
      <link rel='shortcut icon' href='/favicon.png' />
      <link rel="manifest" href="/manifest.json" />
      <link rel='icon' type='image/png' sizes='32x32' href='/favicons/favicon-32x32.png' />
      <link rel='icon' type='image/png' sizes='16x16' href='/favicons/favicon-16x16.png' />
      <link rel='apple-touch-icon' href='/favicons/apple-icon-180x180.png' />
      <link rel='apple-touch-icon' sizes='152x152' href='/favicons/apple-icon-152x152.png' />
      <link rel='apple-touch-icon' sizes='180x180' href='/favicons/apple-icon-180x180.png' />
      <link rel='apple-touch-icon' sizes='167x167' href='/favicons/apple-icon-167x167.png' />

      {/** Theme */}
      <meta name="theme-color" content="#2c3dd4" /> {/** https://developer.mozilla.org/fr/docs/Web/HTML/Element/meta/name/theme-color */}

      {/** Mobile parameters */}
      <meta name="format-detection" content="telephone=no" /> {/** http://www.html-5.com/metatags/format-detection-meta-tag.html */}
      <meta name="mobile-web-app-capable" content="yes" />

      {/** Edge specifics */}
      <meta name='msapplication-config' content='/favicons/browserconfig.xml' />
      <meta name='msapplication-TileColor' content='#2B5797' />
      <meta name='msapplication-tap-highlight' content='no' />

      {/** iOS specifics */}
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content={title} />

      {/** basic Open Graph Metadata (https://ogp.me/) */}
      <meta property='og:title' content={title} />
      <meta property='og:type' content='website' />
      <meta property='og:image' content={image} />
      <meta property='og:url' content={url} />

      {/** Optionnal Open Graph Metadata (https://ogp.me/) */}
      <meta property="og:audio" content={`${url}resources/nw-audio.mp3`} />
      <meta property='og:description' content={description} />
      <meta property='og:site_name' content={mainProduct} />

      {/** Twitter specifics */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta property="twitter:domain" content={domain} />
      <meta property="twitter:url" content={url} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

    </Head>
  )
}
