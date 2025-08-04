import { VStack, Text, Flex } from '@chakra-ui/react'
import { faWarning } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useMemo } from 'react'
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
    leftDisabled?: any
}) {
  //
  return (
    <Flex
      className="glowingBorder casinoBg"
      py="5"
      direction='column'
      alignItems='stretch'
      flexWrap='wrap'
      gap='6'
      flex='1'
      px={{ base: 0, sm: 2 }}
    >
      <Flex flexWrap='wrap' flex='1' alignSelf='stretch' direction="row" pb="5" alignItems='center' justifyContent='center'>
        {props.top}
      </Flex>
      <Flex flex='1' direction="row" align="center" flexWrap='wrap' alignItems='stretch' justifyContent='stretch' columnGap='2' rowGap='5'>
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
                                    m='10'
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
      <Text>{props.betName}</Text>
    </Flex>
  )
}

BaseBetButton.defaultProps = {
  colorUnchecked: '#5200855c',
  colorChecked: '#520085',
  multiplicator: { times: 2, bigger: false }
}
