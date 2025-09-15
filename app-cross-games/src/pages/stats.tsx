import type { GetStaticProps } from 'next'
import type { ReactElement } from 'react';
import { SWRConfig } from 'swr'

import { Flex, Tab, TabList, TabPanel, TabPanels, Tabs,Text } from '@chakra-ui/react'

import { NWNakedTitleContent } from '#/src/components/App/NWTitle'
import type { BalanceData, BalanceEvol, GamesEvol, PackedGamesStats, SingleChipsPrices } from '#/src/components/Data/Stats/_';
import { fetchStatsData, getSingleChipValues } from '#/src/components/Data/Stats/_'
import BalancesTable from '#/src/components/Data/Stats/Balances'
import BalancesEvolChart from '#/src/components/Data/Stats/BalancesEvol'
import GamesStatsUI from '#/src/components/Data/Stats/Games'
import GamesEvolCharts from '#/src/components/Data/Stats/GamesEvol'
import { NWHead } from '#/src/pages/_app'
import { mainProduct } from '#/src/pages/_document'
import { safeResultsArr, safeResultsObj } from '#/src/pages/sales/[name]';

//
const refreshedEveryMin = 5

// This function gets called at build time on server-side.
// It may be called again, on a serverless function, if
// revalidation is enabled and a new request comes in
export const getStaticProps : GetStaticProps = async () => {
  //
  const balancesP = fetchStatsData<BalanceData[]>('/balances-total')

  //
  const [
    balances,
    singleChipValues,
    balancesEvol,
    gamesStats,
    gamesEvol
  ] = await Promise.allSettled([
    balancesP,
    balancesP.then(results => {
      const chainIds = results.map(w => w.chainId);
      return getSingleChipValues(chainIds);
    }),
    fetchStatsData<BalanceEvol>('/balances-evol'),
    fetchStatsData<PackedGamesStats>('/games-stats'),
    fetchStatsData<GamesEvol>('/games-evol')
  ])

  //
  return {
    props: {
      singleChipValues: safeResultsObj(singleChipValues),
      fallback: {
        '/balances-total': safeResultsArr(balances),
        '/balances-evol': safeResultsObj(balancesEvol),
        '/games-stats': safeResultsObj(gamesStats),
        '/games-evol': safeResultsObj(gamesEvol)
      }
    },
    // Next.js will attempt to re-generate the page:
    // - When a request comes in
    // - At most once every {x} seconds
    revalidate: refreshedEveryMin * 60 // In seconds
  }
}

//
const StatsPage = (props: {
  singleChipValues: SingleChipsPrices,
  fallback: ReactElement
}) => {
  //
  return (
    //
    <SWRConfig value={{ fallback: props.fallback }}>
      <NWHead
        title={'Global Stats - ' + mainProduct}
        description={'General stats regarding casino volume and activity'}
      />
      <Flex direction='column' alignItems='center' justifyContent='center' flex='1' my='5' gap='3'>
        <Text fontSize='.8rem' mb='2'>(Refreshed every {refreshedEveryMin} minutes)</Text>
        <Tabs isLazy backgroundColor='#6666' colorScheme='pink'>
          <TabList>
            <Tab>Balances</Tab>
            <Tab>Games</Tab>
          </TabList>
          <TabPanels>
            <TabPanel>
              <Flex gap='5' justifyContent='center' alignItems='center' flexDirection='column'>
                <BalancesTable singleChipValues={props.singleChipValues} />
                <BalancesEvolChart />
              </Flex>
            </TabPanel>
            <TabPanel>
              <Flex gap='5' justifyContent='center' alignItems='center' flexDirection='column'>
                <GamesStatsUI />
                <GamesEvolCharts />
              </Flex>
            </TabPanel>
          </TabPanels>
        </Tabs>
        <Flex direction='column'>
          <NWNakedTitleContent />
        </Flex>
      </Flex>
    </SWRConfig>
  )
}

export default StatsPage;