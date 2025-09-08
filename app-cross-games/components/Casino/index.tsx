import { Flex, Tooltip } from '@chakra-ui/react'
import CasinoBank from './Offchain/Bank'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBank, faCoins, faDharmachakra, faDice } from '@fortawesome/free-solid-svg-icons'
import { useMemo } from 'react'
import { IconProp } from '@fortawesome/fontawesome-svg-core'

import CasinoAuth from './Offchain/_/CasinoAuth'
import ChipsBalance from './Offchain/_/ChipsBalance'
import ChipsRoulette from './Offchain/Roulette'
import ChipsCoinFlip from './Offchain/CoinFlip'
import { useNWStore } from 'lib/store/main'

export const GAMES_ICONS = {
  coinflip: faCoins,
  roulette: faDharmachakra,
  dices: faDice
} as const

/** handled games string IDs, (both front / back) */
export type HandledCasinoGame = keyof typeof GAMES_ICONS

//
export default function Casino () {
  //
  const [tabIndex, setTabIndex] = useNWStore(s => [s.casinoTabIndex, s.setCasinoTabIndex])

  //
  const casinoAuthSignature = useNWStore(s => s.casinoAuthSignature)

  //
  return (
    <Flex direction='column' gap={{ base: 2, sm: 5 }}>
      <Flex gap='1.5rem' mx='10' flexWrap='wrap' alignItems='center' justifyContent='space-evenly'>
        <CasinoAuth />
        {casinoAuthSignature != null && <ChipsBalance isFullMode={true} />}
      </Flex>
      <Flex
        direction={{ base: 'column', sm: 'row' }}
        position='relative' left='-.5rem'
        ml={{ base: 4, sm: 0 }}
      >
        <Flex
          direction={{ base: 'row', sm: 'column' }}
          py={{ base: 0, sm: 3 }}
          px={{ base: 3, sm: 0 }}
          mr={{ base: 0, sm: 2 }}
          mb={{ base: 2, sm: 0 }}
          gap='1' alignItems='center'
          fontSize={{ base: '1.25rem', md: '1.5rem' }}
          zIndex={30}
        >
          <TabButton isMainButton={true} index={0} cIndex={tabIndex} iUpdater={setTabIndex} icon={faBank} title='Casino Bank' />
          <Flex w='20px' h='20px' />
          <TabButton index={1} cIndex={tabIndex} iUpdater={setTabIndex} icon={GAMES_ICONS.roulette} title='Roulette' />
          <TabButton index={2} cIndex={tabIndex} iUpdater={setTabIndex} icon={GAMES_ICONS.coinflip} title='Coin Flip' />
          <Flex position='relative'>
            <Flex
              bottom='-.4rem' left='.65rem'
              whiteSpace='nowrap' flexWrap='nowrap'
              position='absolute' zIndex='1'
              bgColor='#F00B' borderRadius='3px' fontSize='.5rem' px='1'
            >
              Soon !
            </Flex>
            <TabButton index={3} cIndex={tabIndex} iUpdater={null} icon={GAMES_ICONS.dices} title='Dices (TBA)' />
          </Flex>
        </Flex>
        <Flex zIndex='1' flex='1' justifyContent='stretch' alignItems='stretch'>
          {tabIndex === 0 && <CasinoBank />}
          {tabIndex === 1 && <ChipsRoulette />}
          {tabIndex === 2 && <ChipsCoinFlip />}
        </Flex>
      </Flex>
    </Flex>

  )
}

function TabButton (props: {
    icon: IconProp,
    index: number,
    cIndex: number,
    title: string,
    iUpdater?: (index: number) => void
    isMainButton?: boolean
}) {
  //
  const isSelected = useMemo(() => props.index === props.cIndex, [props.cIndex, props.index])

  //
  const selectIndent = useMemo(() =>
    isSelected
      ? (props.isMainButton
        ? '.7rem'
        : '.9rem')
      : '.3rem'
  , [isSelected, props.isMainButton])

  //
  return (
    <Tooltip placement='left' hasArrow label={props.title}>
      <Flex
        position='relative' p='2' _hover={{ cursor: 'pointer' }}
        borderTopLeftRadius={{ base: '5px' }}
        borderBottomLeftRadius={{ sm: '5px' }}
        borderTopRightRadius={{ base: '5px', sm: 0 }}
        left={{ base: 0, sm: selectIndent }}
        top={{ base: selectIndent, sm: 0 }}
        onClick={props.iUpdater ? () => props?.iUpdater(props.index) : null}
        bgColor={isSelected ? '#e563ff' : 'inherit'}
        color={isSelected ? '#3f0772' : (props.iUpdater ? 'white' : '#555')}
        fontSize={props.isMainButton ? '1em' : '.9em'}
      >
        <FontAwesomeIcon icon={props.icon} size={props.isMainButton ? 'lg' : '1x'} />
      </Flex>
    </Tooltip>
  )
}
