import Document, { Html, Main, Head, NextScript } from 'next/document'

class NWDocument extends Document {
  static async getInitialProps (ctx) {
    const initialProps = await Document.getInitialProps(ctx)
    return { ...initialProps }
  }

  render () {
    return (
      <Html>
        <Head>
          <link rel="preconnect" href="https://fonts.googleapis.com"></link>
          <link
            rel="preconnect"
            href="https://fonts.gstatic.com"
            crossOrigin="anonymous"
          ></link>
          <link
            href="https://fonts.googleapis.com/css2?family=Permanent+Marker&display=swap"
            rel="stylesheet"
          />
          <link
            href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap"
            rel="stylesheet"
          ></link>
        </Head>
        <body className="bodyBg">
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}

export default NWDocument
