import { Flex, Text, IconButton, Tooltip } from '@chakra-ui/react'
import { NWERC20_NAME } from 'env/defaults'
import AutoUpdateTracker from '../../_/AutoUpdateTracker'

//
import { useNWStore } from 'lib/store/main'
import { toCurrency } from 'lib/BigNumberFormatters'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faThumbtack } from '@fortawesome/free-solid-svg-icons'
import { NWERC20CurrencyIcon } from 'components/_/MixedCurrencyIcon'

//
export default function NWERC20Balance () {
  //
  const getNWERC20Balance$ = useNWStore(s => s.getNWERC20Balance$)
  const addNWERC20AsWatchedAsset = useNWStore(s => s.addNWERC20AsWatchedAsset)

  //
  return (
    <Flex flexWrap='wrap' className="pixelFont" justifyContent='center' alignItems='center' gap='2px'>
      <NWERC20CurrencyIcon />
      <Flex direction='column' ml='2'>
        <NWERC20WealthDisplay />
        <AutoUpdateTracker periodicityInSecs={30} toCallPeriodically={getNWERC20Balance$} immediateCall={false} />
      </Flex>
      <Tooltip hasArrow label={`Add ${NWERC20_NAME} to MetaMask ?`}>
        <IconButton
          padding='0'
          aria-label={`Add ${NWERC20_NAME} to MetaMask ?`}
          variant='unstyled'
          size='xs'
          onClick={addNWERC20AsWatchedAsset}
          icon={<FontAwesomeIcon icon={faThumbtack} />}
        />
      </Tooltip>
    </Flex>
  )
}

//
function NWERC20WealthDisplay () {
  //
  const NWERC20Balance = useNWStore(s => s.NWERC20Balance)

  //
  return (
    <Flex alignItems='end' direction='column'>
      <Text fontSize='.4rem'>{NWERC20_NAME}</Text>
      <Text fontSize='.5rem' fontWeight='bold'>{NWERC20Balance
        ? toCurrency(NWERC20Balance)
        : '...'}
      </Text>
    </Flex>
  )
}
