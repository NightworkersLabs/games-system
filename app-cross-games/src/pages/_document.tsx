import type { DocumentContext, DocumentInitialProps } from 'next/document';
import Document, { Head, Html, Main, NextScript } from 'next/document'

//
const googleOwnDomainTag = 'LhBN99NI_16ahBQ5ywbOYfMnte3hiZD8UHhIv8xOzpo' /** liked to nightworkers.vercel.app */

//
export const domainUrl = process.env.NEXT_PUBLIC_DOMAIN_URL;
export const mainProduct = 'Night Workers'
export const appName = `${mainProduct} - Multichain Casino`

//
class NWDocument extends Document {
  //
  static async getInitialProps (ctx: DocumentContext): Promise<DocumentInitialProps> {
    const initialProps = await Document.getInitialProps(ctx)
    return initialProps
  }

  //
  render () {
    return (
      <Html>
        {/** files to prefetch on all domains (fonts, background...) */}
        <Head>
          {/** Basic Informations */}
          <meta name="application-name" content={appName} />

          {/** Highest priority preload of images resources */}
          <link rel="prefetch" href="/resources/nw-bg.jpg"></link>

          {/** Fonts */}
          <link rel="preconnect" href="https://fonts.googleapis.com"></link>
          <link
            href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap"
            rel="stylesheet"
          />
          <link
            rel="preconnect"
            href="https://fonts.gstatic.com"
            crossOrigin="anonymous"
          />

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

          {/** Google specifics */}
          <meta name="google-site-verification" content={googleOwnDomainTag} />

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

          {/** Twitter specifics ['name' + 'content'] (https://developer.twitter.com/en/docs/twitter-for-websites/cards/guides/getting-started) */}
          <meta name="twitter:url" content={domainUrl} />

          {/** basic Open Graph Metadata (https://ogp.me/) ['property' + 'content'] */}
          <meta property='og:type' content='website' />
          <meta property='og:url' content={domainUrl} />

          {/** Optionnal Open Graph Metadata (https://ogp.me/) */}
          <meta property='og:site_name' content={mainProduct} />

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

        </Head>
        <body className="bodyBg withRoller">
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}

export default NWDocument
