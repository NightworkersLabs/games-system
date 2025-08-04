import NWEntryPoint from 'components'
import RedirectAppStore from 'components/App/RedirectAppStore'
import { isStoreReliant, MetaMaskMandatoryInfos } from 'lib/DeviceDetector'
import type { GetServerSideProps } from 'next'

import { useEffect, useState } from 'react'

//
export const getServerSideProps : GetServerSideProps = async (context) => {
  //
  const userAgent = context.req.headers['user-agent']

  //
  return {
    props: { mmInfos: isStoreReliant(userAgent) }
  }
}

//
export default function MainPage (props: {
    mmInfos: MetaMaskMandatoryInfos
}) {
  //
  const [shouldRedirectToStore, setShouldRedirectToStore] = useState<boolean>(null)

  //
  useEffect(() => {
    // whenever we are on Android or iOS and not on MetaMask Mobile
    setShouldRedirectToStore(props.mmInfos.isStoreCompatible && window.ethereum == null)
    //
  }, [props.mmInfos.isStoreCompatible])

  //
  return (
    shouldRedirectToStore == null
      ? <></>
      : (shouldRedirectToStore
        ? <RedirectAppStore store={props.mmInfos.isIOS ? 'app-store' : 'google-play'} />
        : <NWEntryPoint isStoreCompatible={props.mmInfos.isStoreCompatible} />)
  )
}
