import { useRouter } from 'next/router'

import blStorage from 'lib/Backlinking'

import MainPage, { getServerSideProps as gSSP } from '../index'
import { MetaMaskMandatoryInfos } from 'lib/DeviceDetector'

export const getServerSideProps = gSSP

//
export default function BacklinkRoutingWrapper (props: {
    mmInfos: MetaMaskMandatoryInfos
}) {
  const router = useRouter()
  const blName = router.query.name as string
  const blInfos = blStorage[blName]

  return <MainPage
    mmInfos={props.mmInfos}
    blRef={blInfos}
  />
}
