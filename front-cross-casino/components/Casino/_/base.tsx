import { VStack, Text, Flex, Tooltip } from '@chakra-ui/react'
import { faMagnifyingGlassChart, faReply, faScaleUnbalanced, faWarning } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useMemo, useState } from 'react'
import { CoinBet, ColorBet } from 'lib/store/slices/_/bet'

export interface BetTagDecorator {
    color: string,
    descr: string
}
export type OutcomeDisplayerFunc<T> = (outcome: T) => BetTagDecorator

export function BetBox (props: { children: any, subtitle: string }) {
  return (
    <VStack
      flex='1'
      alignSelf='stretch'
      alignItems='center'
      justifyContent='center'
      backgroundColor='#00000091'
      p='3'
      pb='5'
      borderRadius='15px'
      position='relative'
      mb='4'
      mx='2'
    >
      <Text className='pixelFont' position='absolute' top='-1.5' left='5' fontSize='.5rem'>{props.subtitle}</Text>
      {props.children}
    </VStack>
  )
}

export function GamePlateau (props: {
    top: any,
    left: any,
    right: any,
    leftDisabled?: any,
    stats?: any
}) {
  //
  const [statsMode, setStatsMode] = useState(false)

  //
  return (
    <Flex
      className="glowingBorder casinoBg"
      pt="5"
      pb={{ base: 5, md: 2 }}
      direction='column'
      alignItems='stretch'
      flexWrap='wrap'
      gap='6'
      flex='1'
      maxW='100%'
      px={{ base: 0, sm: 2 }}
    >
      <Flex maxW='100%' position='relative' flexWrap='wrap' flex='1' alignSelf='stretch' direction="row" pb="5" alignItems='center' justifyContent='center'>
        {(!props.stats || !statsMode) && props.top}
        {props.stats &&
          <Flex _hover={{ cursor: 'pointer' }} position='absolute' right='.8rem' top='-.4rem' onClick={() => setStatsMode(!statsMode)}>
            <Tooltip hasArrow label={statsMode ? 'Back to game ?' : 'Live Feed & Leaderboard'}>
              <FontAwesomeIcon size='2x' icon={statsMode ? faReply : faMagnifyingGlassChart} />
            </Tooltip>
          </Flex>
        }
      </Flex>
      {(!props.stats || !statsMode)
        ? <Flex flex='1' direction="row" align="center" flexWrap='wrap' alignItems='stretch' justifyContent='stretch' columnGap='2' rowGap='5'>
          <Flex flex='1' className={props.leftDisabled ? 'stripped' : null} >
            <Flex
              direction="column"
              flex='1'
              position='relative'
            >
              {props.leftDisabled &&
                                  <Flex
                                    w='100%'
                                    h='100%'
                                    position='absolute'
                                    alignItems='center'
                                    justifyContent='center'
                                  >
                                    <Flex
                                      direction='column'
                                      gap='1'
                                      backgroundColor='#111B'
                                      zIndex='40'
                                      p='1rem'
                                      borderRadius='10px'
                                      alignItems='center'
                                      flex='.75'
                                    >
                                      <FontAwesomeIcon icon={faWarning} size='2x' />
                                      {props.leftDisabled}
                                    </Flex>
                                  </Flex>}
              <Flex direction="column" flex='1' className={props.leftDisabled ? 'disabled' : null}>
                {props.left}
              </Flex>
            </Flex>
          </Flex>
          <Flex direction='column' gap='5' grow={1}>
            {props.right}
          </Flex>
        </Flex>
        : props.stats
      }
    </Flex>
  )
}

interface MultiplicatorBaseBetButton {
    times: number
    bigger: boolean
}

//
export function BaseBetButton <T = CoinBet | ColorBet> (props: {
    correspondingBet: T,
    betName: string,
    bet: T,
    canBet: boolean,
    setBet: (bet: T) => void,
    colorUnchecked?: string
    colorChecked?: string
    multiplicator? : MultiplicatorBaseBetButton
    bg? : any
}) {
  //
  const betThis = useMemo(() => props.bet === props.correspondingBet, [props.bet, props.correspondingBet])

  //
  return (
    <Flex
      className='pixelFont'
      alignItems='center'
      justifyContent='center'
      position='relative'
      w='40%'
      maxW='80'
      h='16'
      borderColor="#f67cff"
      boxSizing='content-box'
      borderRadius="sm"
      fontSize='1rem'
      onClick={() => {
        if (!props.canBet) return
        props.setBet(props.correspondingBet)
      }}
      _hover={{ cursor: props.canBet ? 'pointer' : 'not-allowed' }}
      borderWidth={betThis ? '4px' : '1px'}
      bgColor={betThis ? props.colorChecked : props.colorUnchecked}
      bg={props.bg}
    >
      <Text
        position='absolute'
        bottom='-1.2em'
        right='-1em'
        color='yellow'
        backgroundColor='#0009'
        textShadow='1px 1px 0px #a75160'
        p='1'
        borderRadius='5px'
        fontSize={props.multiplicator.bigger ? '.8em' : '.5em'}
      >x{props.multiplicator.times}{props.multiplicator.bigger && '!'}</Text>
      {props.bg == null && <Text>{props.betName}</Text>}
    </Flex>
  )
}

BaseBetButton.defaultProps = {
  colorUnchecked: '#5200855c',
  colorChecked: '#520085',
  multiplicator: { times: 2, bigger: false }
}

//
export interface BetOdd {
  bettedOn: string
  /** @dev decimal as string */
  plays: string
  /** @dev decimal as string */
  wons: string
}

//
export function BetOdds (props: {
  colors: {[bettedOn: string]: string}
  data: BetOdd[]
  sorter: (a: BetOdd, b: BetOdd) => number
}) {
  //
  const odds = useMemo(() =>
    props.data
      ? Object.fromEntries(
        props.data.map(o =>
        [
          o.bettedOn,
          o.wons !== '0' ? +(o.wons) / +(o.plays) : 0
        ] as const
        )
      )
      : null, [props.data])

  //
  const total = useMemo(() =>
    odds
      ? Object
        .entries(odds)
        .reduce((base, [, odd]) => base + odd, 0)
      : 0
  , [odds])

  //
  const sorted = useMemo(() =>
    props.data
      ? [...props.data].sort(props.sorter)
      : null
  , [props.data, props.sorter])

  //
  return (
    odds
      ? <Flex w='100%' pt='3' position='relative'>
        <Text color='gray' fontSize='.6rem' right='1rem' bottom='-1rem' position='absolute'>(Latest 100 bets)</Text>
        <Flex flex='1' alignItems='center' justifyContent='stretch'>
          <Flex flex='0' alignItems='center'>
            <FontAwesomeIcon icon={faScaleUnbalanced} />
          </Flex>
          <Flex flex='1' px='3' userSelect='none' mr='1'>
            {
              sorted.map(o =>
                <BetOddComponent
                  plays={o.plays}
                  wons={o.wons}
                  key={o.bettedOn}
                  bettedOn={o.bettedOn}
                  total={total}
                  odds={odds[o.bettedOn]}
                  bgColor={props.colors[o.bettedOn]}
                />
              )}
          </Flex>
        </Flex>
      </Flex>
      : <></>
  )
}

//
function BetOddComponent (props: {
  bettedOn: string
  odds: number
  plays: string
  wons: string
  total: number
  bgColor?: string
}) {
  //
  const prc = +(((props.odds / props.total) * 100).toFixed(2))

  //
  return (
    <Tooltip hasArrow label={`${props.bettedOn} => [plays: ${props.plays} | wons: ${props.wons}]`}>
      <Flex
        flex={prc}
        bg={props.bgColor ?? 'black'}
        alignItems='center' justifyContent='center'
        transition='transform 200ms'
        _hover={{ transform: 'scale(1.5)', cursor: 'pointer' }}
        gap='2px'
        minW='3rem'
        fontSize='.55rem'
        border='1px solid #444'
        borderRadius='2px'
      >
        <Text fontWeight='bold'>{prc}</Text>
        <Text>%</Text>
      </Flex>
    </Tooltip>
  )
}
