import type { Variants } from 'framer-motion';
import { motion } from 'framer-motion'
import { useMemo } from 'react'
import useSWR from 'swr'

import { Flex, Image } from '@chakra-ui/react'

import type { BetOdd, OutcomeDisplayerFunc } from '#/src/components/Casino/_/base';
import { BaseBetButton, BetBox,BetOdds } from '#/src/components/Casino/_/base'
import { fetchForGameData } from '#/src/components/Casino/Stats'
import { ColorBet } from '#/src/lib/store/slices/_/bet'

import type { HandledCasinoGame } from '..'

//
//
//

//* */
const pinDeg = 40

//*  */
const degVal = 24

/** */
interface RouletteDegreesRange {
    [droppedOn: string]: number
}
const degRanges: RouletteDegreesRange = {
  2: 0,
  7: degVal,
  10: degVal * 2,
  4: degVal * 3,
  0: degVal * 4,
  9: degVal * 5,
  3: degVal * 6,
  11: degVal * 7,
  8: degVal * 8,
  5: degVal * 9,
  14: degVal * 10,
  1: degVal * 11,
  12: degVal * 12,
  6: degVal * 13,
  13: degVal * 14
}

const rouletteAnimationsBase: Variants = {
  Idle: {
    rotateZ: [0, -360],
    transition: {
      rotateZ: {
        duration: 20,
        ease: 'linear',
        repeat: Infinity,
        repeatType: 'loop'
      }
    }
  },
  Spinning: {
    rotateZ: [0, -360],
    transition: {
      rotateZ: {
        duration: 0.5,
        ease: 'linear',
        repeat: Infinity,
        repeatType: 'loop'
      }
    }
  }
}

const generateVariants = (base: Variants, ranges: RouletteDegreesRange) : Variants => {
  const exp = Object.keys(ranges).reduce((prev, curr) => {
    //
    prev[curr] = {
      rotateZ: -ranges[curr] + pinDeg - 360,
      transition: {
        rotateZ: {
          duration: 1,
          ease: 'easeOut'
        }
      }
    }

    //
    return prev
    //
  }, {} as Variants)

  //
  return { ...base, ...exp }
}

const rouletteAnimations = generateVariants(rouletteAnimationsBase, degRanges)

//
//
//

//
export const rouletteBetOutcomeDisplayer : OutcomeDisplayerFunc<ColorBet> = outcome => ({
  descr: ColorBet[outcome],
  color: outcome === ColorBet.Green
    ? 'green'
    : (
      outcome === ColorBet.Black
        ? 'black'
        : 'red'
    )
})

//
export const RouletteWheel = (props: {
    history: {outcome?: ColorBet, outcomeDetailed?: number, hasFailed?: boolean }[]
}) => {
  //
  const currentState = useMemo(() => {
    //
    if (props.history.length === 0) {
      return 'Idle'
    }

    //
    const latestCoinState = props.history[props.history.length - 1]

    //
    if (latestCoinState.hasFailed) {
      return 'Idle'
    } else if (latestCoinState.outcome == null) {
      return 'Spinning'
    }

    //
    return latestCoinState.outcomeDetailed.toString()
    //
  }, [props.history])

  //
  return (
    <Flex alignItems='center' justifyContent='center' px='3'>
      <Flex
        position='relative'
        w='auto'
        overflow='hidden' // prevents roulette from resizing viewport when spinning AND glower from having borders cut
      >
        <Image
          position='absolute'
          alt='Roulette Pin'
          className='roulette-pin'
          src='/resources/casino/wheel-pin.png'
          zIndex="40"
        />
        <motion.div
          style={{ transformStyle: 'preserve-3d' }}
          variants={rouletteAnimations}
          animate={currentState}
        >
          <Image alt='Roulette Wheel' src='/resources/casino/wheel.png' />
        </motion.div>
      </Flex>
    </Flex>
  )
}

export const greenMultiplicator = 10

//
export const RouletteColorPicker = (props: {
    canBet: boolean,
    bet: ColorBet,
    setBet: (bet: ColorBet) => void
}) => {
  //
  const { data } = useSWR<BetOdd[]>(
    ['/winrates', 'roulette' as HandledCasinoGame],
    fetchForGameData,
    { refreshInterval: 30_000, dedupingInterval: 30_000 }
  )

  //
  return (
    <BetBox subtitle='1.Pick your odds'>
      <Flex w="full" justify='space-evenly'>
        <BaseBetButton
          correspondingBet={ColorBet.Red}
          betName="RED"
          canBet={props.canBet}
          bet={props.bet}
          setBet={props.setBet}
          colorChecked='#A20B84'
          colorUnchecked='#541949'
        />
        <BaseBetButton
          correspondingBet={ColorBet.Black}
          betName="BLACK"
          canBet={props.canBet}
          bet={props.bet}
          setBet={props.setBet}
          colorChecked='#0e0e3a'
          colorUnchecked='#262634'
        />
      </Flex>
      <BaseBetButton
        correspondingBet={ColorBet.Green}
        betName="GREEN"
        canBet={props.canBet}
        bet={props.bet}
        setBet={props.setBet}
        colorChecked='green'
        colorUnchecked='#132813'
        multiplicator={{ times: greenMultiplicator, bigger: true }}
      />
      <BetOdds
        data={data}
        colors={{
          Green: '#132813',
          Red: '#541949',
          Black: '#262634'
        }}
        sorter={(a, b) => {
          if (a.bettedOn === 'Green' || b.bettedOn === 'Green') return 1
          return a.bettedOn === 'Red' || b.bettedOn === 'Red' ? -1 : 1
        }}
      />
    </BetBox>
  )
}
