import '#/src/styles/globals.css'
import '#/src/styles/hub.css'
import '#/src/styles/u-gauge.css'
import '#/src/styles/bet-tracker.css'
import '@fortawesome/fontawesome-svg-core/styles.css'

import Head from 'next/head'

import { ChakraProvider } from '@chakra-ui/react'
import { config } from '@fortawesome/fontawesome-svg-core'

import { appName, domainUrl } from '#/src/pages/_document'
import main from '#/src/theme/main'
config.autoAddCss = false

//
//
//

const NWApp = ({ Component, pageProps }) => {
  return (
    <ChakraProvider theme={main}>
      {/* <NWHead /> */}
      <Component {...pageProps} />
    </ChakraProvider>
  )
}

// Only uncomment this method if you have blocking data requirements for
// every single page in your application. This disables the ability to
// perform automatic static optimization, causing every page in your app to
// be server-side rendered.
//
// MyApp.getInitialProps = async (appContext) => {
//   // calls page's `getInitialProps` and fills `appProps.pageProps`
//   const appProps = await App.getInitialProps(appContext);
//
//   return { ...appProps }
// }

//
export const NWHead = (props: {
  title?: string,
  description?: string,
  imageUrl?: string
}) => {
  //
  return (
    <Head>
      <title>{props.title}</title>

      {/** Basic Informations */}
      {props.description && <meta name="description" content={props.description} />}

      {/** iOS specifics */}
      <meta name="apple-mobile-web-app-title" content={props.title} />

      {/** Twitter specifics */}
      {props.imageUrl && <meta name="twitter:card" content="summary_large_image" />}
      <meta name="twitter:title" content={props.title} />
      {props.description && <meta name="twitter:description" content={props.description} />}
      {props.imageUrl && <meta name="twitter:image" content={props.imageUrl} />}

      {/** basic Open Graph Metadata (https://ogp.me/) */}
      <meta property='og:title' content={props.title} />
      {props.imageUrl && <meta property='og:image' content={props.imageUrl} />}

      {/** Optionnal Open Graph Metadata (https://ogp.me/) */}
      <meta property="og:audio" content={`${domainUrl}resources/nw-audio.mp3`} />
      {props.description && <meta property='og:description' content={props.description} />}

    </Head>
  )
}

NWHead.defaultProps = {
  title: appName,
  description: appName,
  imageUrl: `${domainUrl}favicons/apple-icon.png`
}

export default NWApp;
