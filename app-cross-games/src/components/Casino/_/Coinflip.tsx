import type { Variants } from 'framer-motion';
import { motion } from 'framer-motion'
import { useMemo } from 'react'
import useSWR from 'swr'

import { Flex, Image } from '@chakra-ui/react'

import type { BetOdd,OutcomeDisplayerFunc } from '#/src/components/Casino/_/base';
import { BaseBetButton, BetBox, BetOdds } from '#/src/components/Casino/_/base'
import { fetchForGameData } from '#/src/components/Casino/Stats'
import { CoinBet } from '#/src/lib/store/slices/_/bet'

import type { HandledCasinoGame } from '..'

export const coinBetOutcomeDisplayer : OutcomeDisplayerFunc<CoinBet> = outcome => ({
  descr: CoinBet[outcome],
  color: outcome === CoinBet.Heads ? '#bb71ef' : '#0066ff'
})

const coinAnimations : Variants = {
  Idle: {
    rotateY: [0, 360],
    transition: {
      rotateY: {
        duration: 8,
        ease: 'linear',
        repeat: Infinity
      }
    }
  },
  Flipping: {
    rotateY: [0, 360],
    y: [0, -30],
    transition: {
      rotateY: {
        duration: 0.3,
        ease: 'linear',
        repeat: Infinity
      },
      y: {
        duration: 0.2,
        ease: 'easeInOut',
        repeat: 1,
        repeatType: 'reverse'
      }
    }
  },
  Heads: {
    rotateY: 360 + 360,
    transition: {
      rotateY: {
        duration: 0.66,
        ease: 'easeOut'
      }
    }
  },
  Tails: {
    rotateY: 360 + 180,
    transition: {
      rotateY: {
        duration: 0.66,
        ease: 'easeOut'
      }
    }
  }
}

//
export const Coin = (props: {
    history: { outcome?: CoinBet, hasFailed?: boolean }[]
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
      return 'Flipping'
    }

    //
    return latestCoinState.outcome === CoinBet.Heads ? 'Heads' : 'Tails'
    //
  }, [props.history])

  //
  return (
    <motion.div
      style={{
        transformStyle: 'preserve-3d',
        borderRadius: '50%',
        boxShadow: 'rgb(44 44 23) 0px 0px 20px 8px',
        position: 'relative',
        width: '200px',
        height: '200px'
      }}
      variants={coinAnimations}
      animate={currentState}
    >
      <Image position='absolute' transform='translateZ(.1px)' alt='Coin Heads' src="/resources/casino/HEADS.png" />
      <Image position='absolute' transform='rotateY(180deg)' alt='Coin Tails' src="/resources/casino/TAILS.png" />
    </motion.div>
  )
}

//
export const CoinBetSelection = (props: {
    canBet: boolean,
    bet: CoinBet,
    setBet: (bet: CoinBet) => void
}) => {
  //
  const { data } = useSWR<BetOdd[]>(
    ['/winrates', 'coinflip' as HandledCasinoGame],
    fetchForGameData,
    { refreshInterval: 30_000, dedupingInterval: 30_000 }
  )

  //
  return (
    <BetBox subtitle='1.Pick your odds'>
      <Flex w="full" justify='space-evenly'>
        <BaseBetButton
          correspondingBet={CoinBet.Heads}
          betName="HEADS"
          canBet={props.canBet}
          bet={props.bet}
          setBet={props.setBet}
          // bg={"center / 120% no-repeat url('/resources/casino/HEADS.png')"}
        />
        <BaseBetButton
          correspondingBet={CoinBet.Tails}
          betName="TAILS"
          canBet={props.canBet}
          bet={props.bet}
          setBet={props.setBet}
          // bg={"center / 120% no-repeat url('/resources/casino/TAILS.png')"}
        />
      </Flex>
      <BetOdds
        data={data}
        colors={{
          Heads: '#b72eb7',
          Tails: '#562156'
        }}
        sorter={(a, b) =>
          a.bettedOn === 'Heads' || b.bettedOn === 'Heads' ? 1 : -1
        }
      />
    </BetBox>
  )
}
