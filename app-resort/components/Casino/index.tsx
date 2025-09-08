import { Flex, Tooltip } from '@chakra-ui/react'
import Lottery from 'components/Casino/Onchain/Lottery'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCoins, faDharmachakra, faTicket } from '@fortawesome/free-solid-svg-icons'
import { useMemo, useState } from 'react'
import { IconProp } from '@fortawesome/fontawesome-svg-core'

import Roulette from './Onchain/Roulette'
import CoinFlip from './Onchain/CoinFlip'

//
export default function Casino () {
  //
  const [tabIndex, setTabIndex] = useState(0)

  //
  return (
    <Flex direction='column' gap={{ base: 2, sm: 5 }}>
      <Flex
        direction={{ base: 'column', sm: 'row' }}
        position='relative' left='-.5rem'
        ml={{ base: 4, sm: 0 }}
      >
        <Flex
          direction={{ base: 'row', sm: 'column' }}
          py={{ base: 0, sm: 3 }}
          px={{ base: 3, sm: 0 }}
          mr={{ base: 0, sm: 3 }}
          mb={{ base: 2, sm: 0 }}
          gap='1' alignItems='center'
          fontSize={{ base: '1.25rem', md: '1.5rem' }}
          zIndex={30}
        >
          <TabButton index={0} cIndex={tabIndex} iUpdater={setTabIndex} icon={faDharmachakra} title='Roulette' />
          <TabButton index={1} cIndex={tabIndex} iUpdater={setTabIndex} icon={faCoins} title='Coin Flip' />
          <TabButton index={2} cIndex={tabIndex} iUpdater={setTabIndex} icon={faTicket} title='Lottery' />
        </Flex>
        <Flex zIndex='1' flex='1' justifyContent='stretch' alignItems='stretch'>
          {tabIndex === 0 && <Roulette />}
          {tabIndex === 1 && <CoinFlip />}
          {tabIndex === 2 && <Lottery />}
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
    iUpdater: (index: number) => void
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
        onClick={() => props.iUpdater(props.index)}
        bgColor={isSelected ? '#e563ff' : 'inherit'}
        color={isSelected ? '#3f0772' : 'white'}
        fontSize={props.isMainButton ? '1em' : '.9em'}
      >
        <FontAwesomeIcon icon={props.icon} size={props.isMainButton ? 'lg' : '1x'} />
      </Flex>
    </Tooltip>
  )
}
