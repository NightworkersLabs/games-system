import { AnimatePresence,motion } from 'framer-motion'
import Head from 'next/head'
import { useCallback, useEffect } from 'react'

import App from '#/src/components/App'
import Disclaimer from '#/src/components/App/Disclaimer'
import { greenMultiplicator } from '#/src/components/Casino/_/Roulette'
import type { BacklinkReference } from '#/src/lib/Backlinking'
import { useNWStore } from '#/src/lib/store/main'
import type { PreferredNetworkSession } from '#/src/lib/store/slices/web3'
import useSessionStorage from '#/src/lib/useSessionStorage'
import { NWHead } from '#/src/pages/_app'
import { domainUrl } from '#/src/pages/_document'

//
const NWEntryPoint = (props: {
    isStoreCompatible: boolean,
    blRef: BacklinkReference
}) => {
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
    <AnimatePresence exitBeforeEnter>
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
export const NWEntryPointHeaders = () => {
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

export default NWEntryPoint;