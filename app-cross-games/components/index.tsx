import { useNWStore } from 'lib/store/main'

import App from 'components/App'

import { useCallback, useEffect } from 'react'

import { motion, AnimatePresence } from 'framer-motion'
import Disclaimer from './App/Disclaimer'
import { BacklinkReference } from 'lib/Backlinking'
import useSessionStorage from 'lib/useSessionStorage'
import { PreferredNetworkSession } from 'lib/store/slices/web3'
import Head from 'next/head'
import { NWHead } from 'pages/_app'
import { domainUrl } from 'pages/_document'
import { greenMultiplicator } from './Casino/_/Roulette'

//
export default function NWEntryPoint (props: {
    isStoreCompatible: boolean,
    blRef: BacklinkReference
}) {
  //
  const {
    provider,
    implicitPreferredNetworkChange,
    initiateWeb3,
    prepareWeb3Provider,
    setSkipProvablyExplaination
  } = useNWStore(s => ({
    provider: s.provider,
    implicitPreferredNetworkChange: s.implicitPreferredNetworkChange,
    initiateWeb3: s.initiateWeb3,
    prepareWeb3Provider: s.prepareWeb3Provider,
    setSkipProvablyExplaination: s.setSkipProvablyExplaination
  }))

  const [validatedDisclaimer, setValidatedDisclaimer] = useSessionStorage<boolean>('validatedDisclaimer', false)
  const [persistedPreferredNetwork, persistPreferredNetwork] = useSessionStorage<PreferredNetworkSession>('preferredNetwork', null)

  //
  const getContextualizedPreferredNetworkSession = useCallback(() : PreferredNetworkSession => {
    //
    let out : PreferredNetworkSession = persistedPreferredNetwork

    // whenever no preferred network is in session, OR stored session preferences associated tracker is different from incoming...
    if (persistedPreferredNetwork == null || persistedPreferredNetwork.latestTrackerName !== props.blRef.uniqueDashboardName) {
      // overrides
      out = {
        network: props.blRef.preferredNetwork ?? persistedPreferredNetwork?.network,
        latestTrackerName: props.blRef.uniqueDashboardName
      }

      // update session
      persistPreferredNetwork(out)
    }

    //
    return out

  //
  }, [persistPreferredNetwork, persistedPreferredNetwork, props.blRef.preferredNetwork, props.blRef.uniqueDashboardName])

  //
  useEffect(() => {
    if (validatedDisclaimer === true) {
      prepareWeb3Provider()
    }
  }, [prepareWeb3Provider, validatedDisclaimer])

  //
  useEffect(() => {
    if (implicitPreferredNetworkChange != null) {
      persistPreferredNetwork(implicitPreferredNetworkChange)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [implicitPreferredNetworkChange])

  //
  useEffect(() => {
    //
    if (provider == null) return

    //
    return initiateWeb3(
      provider,
      props.blRef,
      getContextualizedPreferredNetworkSession().network
    )
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider])

  //
  useEffect(() => {
    setSkipProvablyExplaination(
      sessionStorage.getItem('skipPFDescr') != null
    )
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  //
  return (
    <AnimatePresence  mode='wait'>
      <motion.div
        style={!validatedDisclaimer ? { display: 'flex', flex: 1, justifyContent: 'center' } : { flex: 1 }}
        key={validatedDisclaimer ? 'app' : 'disclaimer'}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.33 }}
        exit={{ opacity: 0 }}
      >
        {validatedDisclaimer
          ? <App isStoreCompatible={props.isStoreCompatible} />
          : <Disclaimer validate={() => setValidatedDisclaimer(true)} />
        }</motion.div>
    </AnimatePresence>
  )
}

//
//
//

//
const description = `Provably fair, degen-ready, multi-chain Casino ! Flip coin and spin roulette up to x${greenMultiplicator} rewards; no exploits, no cheats, instantaneous feedbacks.`

//
const image = `${domainUrl}banner.jpg`

/** preloads casino components */
export function NWEntryPointHeaders () {
  return (
    <>
      <NWHead
        description={description}
        imageUrl={image}
      />
      <Head>
        <link rel="prefetch" href="/resources/casino/casino-bg.png"></link>
        <link rel="prefetch" href="/resources/casino/CHIP_14.png"></link>
        <link rel="prefetch" href="/resources/casino/HEADS.png"></link>
        <link rel="prefetch" href="/resources/casino/TAILS.png"></link>
        <link rel="prefetch" href="/resources/casino/wheel-pin.png"></link>
        <link rel="prefetch" href="/resources/casino/wheel.png"></link>
      </Head>
    </>
  )
}
