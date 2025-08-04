import NWEntryPoint, { NWEntryPointHeaders } from 'components'
import RedirectAppStore from 'components/App/RedirectAppStore'
import blStorage, { BacklinkReference } from 'lib/Backlinking'
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
    mmInfos: MetaMaskMandatoryInfos,
    blRef?: BacklinkReference
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
    <>
      <NWEntryPointHeaders />
      {shouldRedirectToStore == null
        ? <></>
        : (shouldRedirectToStore
          ? <RedirectAppStore store={props.mmInfos.isIOS ? 'app-store' : 'google-play'} />
          : <NWEntryPoint
            blRef={
            // if backlink is not defined...
              props.blRef == null
              // define as backlink whenever store compatible or not
                ? (props.mmInfos.isStoreCompatible
                  ? blStorage.mmm // tracks metamask mobile usage
                  : blStorage.browser) // tracks classic browser usage
                : props.blRef
            }
            isStoreCompatible={props.mmInfos.isStoreCompatible}
          />)}
    </>

  )
}
