import type { GetServerSideProps } from 'next'
import type { ReactElement } from 'react';
import { SWRConfig } from 'swr'

import { Flex, Tab, TabList, TabPanel, TabPanels, Tabs,Text } from '@chakra-ui/react'

import { NWNakedTitleContent } from '#/components/App/NWTitle'
import type { BalanceData, BalanceEvol, GamesEvol, PackedGamesStats, SingleChipsPrices } from '#/components/Data/Stats/_';
import { fetchStatsData, getSingleChipValues } from '#/components/Data/Stats/_'
import BalancesTable from '#/components/Data/Stats/Balances'
import BalancesEvolChart from '#/components/Data/Stats/BalancesEvol'
import GamesStatsUI from '#/components/Data/Stats/Games'
import GamesEvolCharts from '#/components/Data/Stats/GamesEvol'
import { NWHead } from '#/pages/_app'
import { mainProduct } from '#/pages/_document'

//
const refreshedEveryMin = 5

// This function gets called at build time on server-side.
// It may be called again, on a serverless function, if
// revalidation is enabled and a new request comes in
export const getStaticProps : GetServerSideProps = async () => {
  //
  const balancesP = fetchStatsData<BalanceData[]>('/balances-total')

  //
  const [
    balances,
    singleChipValues,
    balancesEvol,
    gamesStats,
    gamesEvol
  ] = await Promise.all([
    balancesP,
    balancesP.then(results => getSingleChipValues(results.map(w => w.chainId))),
    fetchStatsData<BalanceEvol>('/balances-evol'),
    fetchStatsData<PackedGamesStats>('/games-stats'),
    fetchStatsData<GamesEvol>('/games-evol')
  ])

  //
  return {
    props: {
      singleChipValues,
      fallback: {
        '/balances-total': balances,
        '/balances-evol': balancesEvol,
        '/games-stats': gamesStats,
        '/games-evol': gamesEvol
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