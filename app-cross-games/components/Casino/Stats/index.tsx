import { Tabs, TabList, Tab, TabPanels, TabPanel, Text } from '@chakra-ui/react'
import { faChartArea, faTrophy } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { fetchData } from 'components/Data/_'
import { getDataServiceUrl } from 'env/defaults'
import { HandledCasinoGame } from '..'
import BetsFeed from './BetsFeed'
import Leaderboard from './Leaderboard'

const dataServiceUrl = getDataServiceUrl()

//
export const fetchForGameData = async (path: string, gameType: HandledCasinoGame) => {
  const url = new URL(path, dataServiceUrl)
  url.searchParams.set('game', gameType)
  return fetchData(url)
}

//
export default function GamesStatsTab (props: {
  game : HandledCasinoGame
}) {
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
