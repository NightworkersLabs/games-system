import Highcharts from 'highcharts'
import HighchartsReact from 'highcharts-react-official'
import { useMemo, useRef } from 'react'
import useSWR from 'swr'

import type { GamesEvol } from '#/src/components/Data/Stats/_';
import { fetchStatsData } from '#/src/components/Data/Stats/_'

//
const GamesEvolCharts = () => {
  //
  const chartComponentRef = useRef<HighchartsReact.RefObject>(null)

  //
  const dataQuery = useSWR<GamesEvol>(
    ['/games-evol'],
    fetchStatsData,
    { dedupingInterval: 20_000 }
  )

  //
  const options = useMemo<Highcharts.Options>(() => ({
    title: {
      text: 'Monthly Games Played'
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
        text: 'Games played'
      }
    },
    series: dataQuery.data
      ? Object.entries(dataQuery.data).map(([gameName, data]) => ({
        type: 'line',
        name: gameName,
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

export default GamesEvolCharts;