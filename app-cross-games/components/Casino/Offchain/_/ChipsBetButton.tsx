import { useMemo } from 'react'

import { Button, Flex, Image, Text } from '@chakra-ui/react'
import { faArrowsSpin } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import { BetBox } from '#/components/Casino/_/base'
import { CASINO_COIN_NAME } from '#/env/defaults'

const ChipsBetButton = (props: {
    bet: number,
    multiplicator: number,
    isDisabled: boolean,
    onClick: () => void,
    btnName: string,
    running: boolean
}) => {
  //
  const winnings = useMemo(() => {
    //
    if (props.bet == null || props.multiplicator == null) {
      return 0
    }

    //
    return props.bet * props.multiplicator
    //
  }, [props.bet, props.multiplicator])

  //
  return (
    <BetBox subtitle='3. Play'>
      <Flex direction='column' alignItems='center' gap='3' pb='2'>
        <Flex fontSize='.75rem' alignItems='center'>
          <Text>You could win</Text>
          <Image boxSize='7px' alt={CASINO_COIN_NAME} src='/resources/casino/CHIP_14.png' ml='1' />
          <Text fontWeight='bold' mx='1'>{
            winnings === 0 ? '--' : winnings
          }</Text>
          <Text>{CASINO_COIN_NAME} !</Text>
        </Flex>
        <Button
          borderRadius={'full'}
          bg="#ed5af7"
          _hover={{ bg: '#ef00ff' }}
          _active={{ bg: '#a100ab' }}
          w="max"
          mx="auto"
          onClick={props.onClick}
          rightIcon={
            <FontAwesomeIcon className={props.running ? 'spinning' : ''} fontSize='1.25rem' icon={faArrowsSpin} />
          }
          isDisabled={props.isDisabled || props.running}
          fontSize={props.running ? '.5rem' : '1rem'}
          maxW='10rem'
          whiteSpace='normal'
        >{props.running ? 'RIEN NE VA PLUS !' : props.btnName }</Button>
      </Flex>
    </BetBox>
  )
}

export default ChipsBetButton;