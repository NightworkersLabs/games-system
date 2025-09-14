import { useRouter } from 'next/router'

import blStorage from '#/src/lib/Backlinking'
import type { MetaMaskMandatoryInfos } from '#/src/lib/DeviceDetector'
import MainPage, { getServerSideProps as gSSP } from '#/src/pages/index'

export const getServerSideProps = gSSP

//
const BacklinkRoutingWrapper = (props: {
    mmInfos: MetaMaskMandatoryInfos
}) => {
  const router = useRouter()
  const blName = router.query.name as string
  const blInfos = blStorage[blName]

  return <MainPage
    mmInfos={props.mmInfos}
    blRef={blInfos}
  />
}

export default BacklinkRoutingWrapper;