import { Button, Flex, Text, Image } from '@chakra-ui/react'
import { formatEtherFixed } from 'lib/BigNumberFormatters'
import { BLOCKCHAIN_CURRENCY_NAME } from 'env/defaults'
import { BigNumber } from 'ethers'
import { useMemo } from 'react'
import { BetBox } from 'components/Casino/_/base'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowsSpin } from '@fortawesome/free-solid-svg-icons'

export default function BetButton (props: {
    bet: BigNumber,
    multiplicator: number,
    basePtsTax: number,
    isDisabled: boolean,
    onClick: () => void,
    btnName: string
}) {
  //
  const winnings = useMemo(() => {
    //
    if (props.bet == null || props.multiplicator == null || props.basePtsTax == null) {
      return BigNumber.from(0)
    }

    //
    const rawWinnings = props.bet.mul(props.multiplicator)
    const tax = rawWinnings.mul(props.basePtsTax).div(10_000)

    //
    return rawWinnings.sub(tax)
    //
  }, [props.basePtsTax, props.bet, props.multiplicator])

  //
  return (
    <BetBox subtitle='3. Play'>
      <Flex direction='column' alignItems='center' gap='3' pb='2'>
        <Flex fontSize='.75rem' alignItems='center'>
          <Text>You could win</Text>
          <Image boxSize='10px' alt={BLOCKCHAIN_CURRENCY_NAME} src='resources/icons/bc.svg' ml='1' />
          <Text fontWeight='bold' mx='1'>{
            winnings.isZero()
              ? '--.---'
              : formatEtherFixed(winnings, 3)
          }</Text>
          <Text>{BLOCKCHAIN_CURRENCY_NAME} !</Text>
        </Flex>
        <Button
          borderRadius={'full'}
          bg="#ed5af7"
          _hover={{ bg: '#ef00ff' }}
          _active={{ bg: '#a100ab' }}
          w="max"
          mx="auto"
          onClick={props.onClick}
          isDisabled={props.isDisabled}
          rightIcon={<FontAwesomeIcon fontSize='1.25rem' icon={faArrowsSpin} />}
        >{props.btnName}</Button>
      </Flex>
    </BetBox>
  )
}
