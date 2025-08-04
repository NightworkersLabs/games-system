import { getDataServiceUrl } from 'env/defaults'

import { fetchData } from '../_'

//
const dataServiceUrl = getDataServiceUrl()

//
export const fetchTrackersData = async (path: string, trackerId: number) => {
  const url = new URL(path, dataServiceUrl)
  url.searchParams.set('trackerId', trackerId.toString())
  return fetchData(url)
}

//
export interface PaymentData {
  chainId: number
  block: number
  receiver: string
  amount: string
  bts: string
}

//
export interface PaymentTotalData {
  chainId: number
  _sum: {
    amount: string
  },
  _count: {
    _all: number
  }
}

//
export interface BuyData {
  chainId: number
  block: number
  buyer: string
  amount: number
  taxes: string
  bts: string
}

//
export interface BuyTotalData {
  chainId: number
  _sum: {
    amount: number
    taxes: string
  },
  _count: {
    _all: number
  }
}
