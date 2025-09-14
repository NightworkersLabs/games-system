import type { GetServerSideProps } from 'next'
import { useEffect, useState } from 'react'

import NWEntryPoint, { NWEntryPointHeaders } from '#/src/components'
import RedirectAppStore from '#/src/components/App/RedirectAppStore'
import type { BacklinkReference } from '#/src/lib/Backlinking';
import blStorage from '#/src/lib/Backlinking'
import type { MetaMaskMandatoryInfos } from '#/src/lib/DeviceDetector';
import { isStoreReliant } from '#/src/lib/DeviceDetector'

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
const MainPage = (props: {
    mmInfos: MetaMaskMandatoryInfos,
    blRef?: BacklinkReference
}) => {
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

export default MainPage;