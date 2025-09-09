import type { NextRequest} from 'next/server';
import { userAgent } from 'next/server'

//
const isIphone = (ua: string) => /(iPhone|iPod)/i.test(ua)
const isIpad = (ua: string) => /(iPad)/i.test(ua)
const isAndroid = (ua: string) => /(Android)/i.test(ua)

//
export interface MetaMaskMandatoryInfos {
    isStoreCompatible: boolean
    isIOS: boolean
}

//
export const isStoreReliant = (userAgent: string) : MetaMaskMandatoryInfos => {
  //
  const isIOS = isIphone(userAgent) || isIpad(userAgent)

  //
  return {
    isIOS,
    isStoreCompatible: isIOS || isAndroid(userAgent)
  }
}

export const isStoreReliantFromRequest = (req: NextRequest) : MetaMaskMandatoryInfos => {
  const ua = userAgent(req).ua
  return isStoreReliant(ua)
}
