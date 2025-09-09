//

import { BigNumber, Contract, ethers } from 'ethers'
import { formatEther } from 'ethers/lib/utils'

import { Flex,Text } from '@chakra-ui/react'

import { fetchData } from '#/components/Data/_'
import { getDataServiceUrl, getNWExecutionContextFromEnv } from '#/env/defaults'
import { deployed, handledNetworks } from '#/lib/TypedNetworks'
import CasinoBankABI from '#/public/abi/CasinoBank.json'

//
export type SingleChipsPrices = {
  [chainId: number] : {
    readonly currencyName: string
    /** @dev stringified BigNumber for parsing */
    readonly chipValue: string
    /** @dev stringified BigNumber for parsing */
    readonly balance: string
    /** @dev stringified BigNumber for parsing */
    readonly tax: string
   }
}

//
const dataServiceUrl = getDataServiceUrl()

//
export const fetchStatsData = async <T,> (path: string) : Promise<T> => {
  //
  const url = new URL(path, dataServiceUrl)
  const cEnv = getNWExecutionContextFromEnv()

  // if not in a prod env
  if (cEnv !== 'prod') {
    url.searchParams.set('onlyCheap',
      // if test env, only fetch data from cheap networks, else take from ALL networks
      cEnv === 'test'
        ? 'true'
        : 'false'
    )
  }

  //
  return fetchData(url)
}

//
export const chipsAmountRenderer = (
  cell : { getValue: () => string, row: { original: { chainId: number } } },
  singleChipValues: SingleChipsPrices,
  currencyMode: boolean,
  net: boolean = false
) => {
  //
  if (!currencyMode) {
    //
    const val = parseInt(cell.getValue())
    const isNegative = val < 0

    //
    return <Text
      color={!net ? 'inherit' : (isNegative ? 'red' : 'green')}
      textAlign='right'
      fontWeight='bold'
    >{(!isNegative && net) && '+'}{val}</Text>
  }

  //
  const chipDataOnBc = singleChipValues[cell.row.original?.chainId]
  if (chipDataOnBc == null) {
    return <Text color='red'>NOT AVAILABLE YET</Text>
  }

  //
  const value = BigNumber.from(chipDataOnBc?.chipValue)

  //
  const currencied = BigNumber.from(cell.getValue()).mul(value)
  const isNegative = currencied.isNegative()

  //
  return (
    <Flex
      color={!net ? 'inherit' : (isNegative ? 'red' : 'green')}
      gap='1' textAlign='right' alignItems='center' justifyContent='end' flexWrap='wrap'
    >
      <Text fontWeight='bold'>{(!isNegative && net) && '+'}{formatEther(currencied)}</Text>
      <Text fontSize='.85rem'>{chipDataOnBc?.currencyName}</Text>
    </Flex>
  )
}

/**
 * @param chainsToFetch array of chain Ids that filters the available networks
 */
export const getSingleChipValues = (chainsToFetch: number[]) : Promise<SingleChipsPrices>  => {
  /** @dev why do i need this ? */
  const wtf = deployed

  //
  return Promise.allSettled(
    Object.entries(handledNetworks)
      // filter to optimize
      .filter(([, i]) => chainsToFetch.includes(i.chainId))
      // promised fetch of values from BC
      .map(async ([n, i]) => {
        //
        const contractAddr = wtf?.CasinoBank?.[n]?.[0]

        //
        const contract = new Contract(contractAddr, CasinoBankABI,
          new ethers.providers.JsonRpcProvider(
            i.url,
            i.chainId
          )
        )

        const [
          chipValue,
          balance,
          tax
        ] = await Promise.all([
          (contract.singleChipPrice() as Promise<BigNumber>).then(bn => bn.toString()),
          contract.provider.getBalance(contract.address).then(bn => bn.toString()),
          (contract.taxRevenue() as Promise<BigNumber>).then(bn => bn.toString())
        ])

        //
        return [
          i.chainId,
          {
            currencyName: i.currencyName,
            chipValue,
            balance,
            tax
          }
        ] as const
      })
  // get only fufilled
  ).then(e => e
    .filter(w => w.status === 'fulfilled')
    .map(w => w.status === 'fulfilled' && w.value)
  ).then(t => Object.fromEntries(t))
}

//
export interface BalanceData {
  chainId: number
  _sum: {
    tBought: number
    tWithdrawed: number
    withdrawable: number
  }
}

//
export type BalanceEvol = {
  [chainId: number] : [
    time: number,
    balance: number
  ]
}

//
export type GamesStats = {
  /** @dev key */
  bettedOn: string
  /** @dev stringified BigNumber for parsing */
  plays: string
  /** @dev stringified BigNumber for parsing */
  wons: string
  /** @dev stringified DECIMAL for parsing */
  avgWins: string
  /** @dev stringified DECIMAL for parsing */
  avgBet: string
  /** @dev stringified BigNumber for parsing */
  maxWin: string
}

//
export type PackedGamesStats = {
  [game: string] : GamesStats[]
}

export type GameEvol = [tsEpoch: number, count: number]

//
export type GamesEvol = {
  [game: string] : GameEvol[]
}
