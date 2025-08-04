import { Flex, Text, Tooltip } from '@chakra-ui/react'
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { shorthandingBigNumber } from 'components/App/HUD/Wallet'
import { HandledCasinoGame } from 'components/Casino'
import { GameOutcomeDisplayer } from 'components/Data/Stats/Games'
import { BigNumber } from 'ethers/lib/ethers'
import { CoinBet, ColorBet } from 'lib/store/slices/_/bet'
import { useMemo } from 'react'

//
// FRAMEWORK
//

//
export type RandomNumberResolver = (randomNumberToResolve: BigNumber) => any

//
export const OUTCOME_RESOLVERS: { [c : HandledCasinoGame | string] : RandomNumberResolver } = {
  coinflip: rn => <CoinflipResolver randomNumber={rn} gameType='coinflip' />,
  roulette: rn => <RouletteResolver randomNumber={rn} gameType='roulette' />
}

//
// COINFLIP
//

//
const getCoinflipOutcome = (rawOutcome: number) : string =>
  rawOutcome === 1
    ? CoinBet[CoinBet.Heads]
    : CoinBet[CoinBet.Tails]

//
function CoinflipResolver (props: {
  randomNumber: BigNumber
  gameType: HandledCasinoGame
}) {
  //
  const rawOutcome = useMemo(() => props.randomNumber.mod(2).toNumber(), [props.randomNumber])

  //
  return (
    <Flex gap='1' alignItems='start' direction='column'>
      <Flex gap='1' alignItems='center'>
        <Text textAlign='center'>Coin face</Text>
        <Text>=</Text>
        <RandomNumberOperator randomNumber={props.randomNumber} />
        <ModuloOperator />
        <PossibleOutcomes possibles={2} label='Tails or Heads = 2 outcomes possible.' />
      </Flex>
      <Flex gap='1' alignItems='center' justifyContent='center'>
        <Text textAlign='center'>Coin face</Text>
        <Text>=</Text>
        <Text fontWeight='bold'>{rawOutcome}</Text>
      </Flex>
      <Flex gap='1' alignItems='center' justifyContent='center'>
        <Text textAlign='center'>Coin face</Text>
        <Text>=</Text>
        {GameOutcomeDisplayer[props.gameType](getCoinflipOutcome(rawOutcome).toString())}
      </Flex>
    </Flex>
  )
}

//
// ROULETTE
//

//
//
const getRouletteOutcome = (rawOutcome: number) : string =>
  rawOutcome === 0
    ? ColorBet[ColorBet.Green]
    : ([10, 9, 11, 5, 1, 6, 2].includes(rawOutcome)
      ? ColorBet[ColorBet.Black]
      : ColorBet[ColorBet.Red]
    )

//
function RouletteResolver (props: {
  randomNumber: BigNumber
  gameType: HandledCasinoGame
}) {
  //
  const rawOutcome = useMemo(() => props.randomNumber.mod(15).toNumber(), [props.randomNumber])

  //
  return (
    <Flex gap='1' alignItems='start' direction='column'>
      <Flex gap='1' alignItems='center'>
        <Text textAlign='center'>Roulette Number</Text>
        <Text>=</Text>
        <RandomNumberOperator randomNumber={props.randomNumber} />
        <ModuloOperator />
        <PossibleOutcomes possibles={15} label='14 Numbers on Roulette + Green = 15 outcomes possible.' />
      </Flex>
      <Flex gap='1' alignItems='center' justifyContent='center'>
        <Text textAlign='center'>Roulette Number</Text>
        <Text>=</Text>
        <Text fontWeight='bold'>{rawOutcome}</Text>
      </Flex>
      <Flex gap='1' alignItems='center' justifyContent='center'>
        <Text textAlign='center'>Roulette Color</Text>
        <Text>=</Text>
        {GameOutcomeDisplayer[props.gameType](getRouletteOutcome(rawOutcome).toString())}
      </Flex>
    </Flex>
  )
}

//
// ... UTILS
//

//
function RandomNumberOperator (props: {
  randomNumber: BigNumber
}) {
  return (
    <Tooltip hasArrow label='Random Number that you got as a response from the provably fair system'>
      <Flex fontSize='.5rem' flex='0' gap='2' lineHeight='1.2' alignItems='center' bgColor='gray' px='1' borderRadius='5px'>
        <Text fontWeight='bold'>Random Number</Text>
        <Text>{shorthandingBigNumber(props.randomNumber.toHexString())}</Text>
        <FontAwesomeIcon icon={faInfoCircle} />
      </Flex>
    </Tooltip>
  )
}

//
function ModuloOperator () {
  return (
    <Tooltip hasArrow label='Applying a modulo ("%" in computer representation) on a randomly generated number is a common way to get an output from a certain amount of outcomes.'>
      <Flex fontSize='.7rem' gap='1' alignItems='center' bgColor='#c5ae34' px='1' borderRadius='5px'>
        <Text fontWeight='bold'>%</Text>
        <FontAwesomeIcon icon={faInfoCircle} />
      </Flex>
    </Tooltip>
  )
}

//
function PossibleOutcomes (props: {
  possibles : number
  label: string
}) {
  return (
    <Tooltip hasArrow label={props.label}>
      <Flex fontSize='.7rem' gap='1' alignItems='center' bgColor='#c43131' px='1' borderRadius='5px'>
        <Text fontWeight='bold'>{props.possibles}</Text>
        <FontAwesomeIcon icon={faInfoCircle} />
      </Flex>
    </Tooltip>
  )
}
