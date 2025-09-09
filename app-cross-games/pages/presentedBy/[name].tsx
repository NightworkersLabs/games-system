import { useRouter } from 'next/router'

import blStorage from '#/lib/Backlinking'
import type { MetaMaskMandatoryInfos } from '#/lib/DeviceDetector'
import MainPage, { getServerSideProps as gSSP } from '#/pages/index'

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