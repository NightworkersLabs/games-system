import { Tab, TabList, TabPanel, TabPanels, Tabs, Text } from '@chakra-ui/react'
import { faChartArea, faTrophy } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import BetsFeed from '#/components/Casino/Stats/BetsFeed'
import Leaderboard from '#/components/Casino/Stats/Leaderboard'
import { fetchData } from '#/components/Data/_'
import { getDataServiceUrl } from '#/env/defaults'

import type { HandledCasinoGame } from '..'

const dataServiceUrl = getDataServiceUrl()

//
export const fetchForGameData = async <T,>(path: string, gameType: HandledCasinoGame): Promise<T> => {
  const url = new URL(path, dataServiceUrl)
  url.searchParams.set('game', gameType)
  return fetchData(url)
}

//
const GamesStatsTab = (props: {
  game : HandledCasinoGame
}) => {
  return (
    <Tabs isLazy isFitted colorScheme='pink' px='10' maxW='100%'>
      <TabList>
        <Tab gap='2'>
          <FontAwesomeIcon icon={faChartArea} />
          <Text fontSize='.8rem'>History (latest 20 bets)</Text>
        </Tab>
        <Tab gap='2'>
          <FontAwesomeIcon icon={faTrophy} />
          <Text fontSize='.8rem'>Leaderboard (Top 10)</Text>
        </Tab>
      </TabList>
      <TabPanels>
        <TabPanel>
          <BetsFeed game={props.game} />
        </TabPanel>
        <TabPanel>
          <Leaderboard game={props.game} />
        </TabPanel>
      </TabPanels>
    </Tabs>
  )
}

export default GamesStatsTab;