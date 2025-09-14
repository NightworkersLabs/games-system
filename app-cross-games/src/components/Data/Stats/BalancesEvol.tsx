import Highcharts from 'highcharts'
import HighchartsReact from 'highcharts-react-official'
import { useMemo, useRef } from 'react'
import useSWR from 'swr'

import type { BalanceEvol} from '#/src/components/Data/Stats/_';
import { fetchStatsData } from '#/src/components/Data/Stats/_'
import { CASINO_COIN_NAME } from '#/src/consts'
import { networksByChainId } from '#/src/lib/TypedNetworks'

//
const BalancesEvolChart = () => {
  //
  const chartComponentRef = useRef<HighchartsReact.RefObject>(null)

  //
  const dataQuery = useSWR<BalanceEvol>(
    ['/balances-evol'],
    fetchStatsData,
    { dedupingInterval: 20_000 }
  )

  //
  const options = useMemo<Highcharts.Options>(() => ({
    title: {
      text: 'Monthly ' + CASINO_COIN_NAME + ' Balance'
    },
    credits: {
      enabled: false
    },
    xAxis: {
      type: 'datetime',
      title: {
        text: '30 trailing days (UTC+0)'
      },
      tickInterval: 24 * 3600 * 1000
    },
    yAxis: {
      title: {
        text: CASINO_COIN_NAME
      }
    },
    series: dataQuery.data
      ? Object.entries(dataQuery.data).map(([chainId, data]) => ({
        type: 'line',
        name: networksByChainId[chainId].networkName,
        // color: networksByChainId[chainId].color, // NOT A GREAT IDEA...
        data
      }))
      : null
  }), [dataQuery])

  //
  return (
    <HighchartsReact
      ref={chartComponentRef}
      highcharts={Highcharts}
      options={options}
    />
  )
}

export default BalancesEvolChart;