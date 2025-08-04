import { Flex, Text, Divider, VStack } from '@chakra-ui/react'
import { faBank, faFileContract, faWarning } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { HUDButton } from 'components/App/HUD'
import { formatEtherFixed } from 'lib/BigNumberFormatters'
import { BLOCKCHAIN_CURRENCY_NAME, getTableGamesContractAddress } from 'env/defaults'
import { useMemo } from 'react'
import { useNWStore } from 'lib/store/main'
import shallow from 'zustand/shallow'
import UniversalGauge, { GaugeTick } from './UnversalGauge'

//
export default function TableGamesAvailability () {
  //
  const {
    tableGamesBalance,
    tgBankSustained,
    minimumRollingFundsExpected,
    minimumBalanceEnsured,
    flatExcedentaryFundsExpected,
    getContractExplorerUrl
  } = useNWStore(s => ({
    tableGamesBalance: s.tableGamesBalance,
    tgBankSustained: s.tgBankSustained,
    minimumRollingFundsExpected: s.minimumRollingFundsExpected,
    minimumBalanceEnsured: s.minimumBalanceEnsured,
    flatExcedentaryFundsExpected: s.flatExcedentaryFundsExpected,
    getContractExplorerUrl: s.getContractExplorerUrl
  }), shallow)

  //
  const gaugeTicks = useMemo<GaugeTick[]>(() => [
    {
      blinking: true,
      color: '#00982f',
      to: minimumRollingFundsExpected,
      tooltipLabel: (currentVal, to) => {
        return `You cannot play below ${formatEtherFixed(to, 0)} ${BLOCKCHAIN_CURRENCY_NAME}`
      }
    },
    {
      color: '#00982f',
      to: minimumBalanceEnsured
    },
    {
      color: '#579e6d',
      to: minimumBalanceEnsured?.add(flatExcedentaryFundsExpected),
      tooltipLabel: (currentVal, to) => {
        return `Once ${formatEtherFixed(to, 0)} ${BLOCKCHAIN_CURRENCY_NAME} is reached,
                    everything above ${formatEtherFixed(minimumBalanceEnsured, 0)} ${BLOCKCHAIN_CURRENCY_NAME} will be given back to the community !`
      }
    }
  ], [flatExcedentaryFundsExpected, minimumBalanceEnsured, minimumRollingFundsExpected])

  //
  return (
    <VStack gap='1' mr='2'>
      <HUDButton name='CONTRACT' icon={faFileContract} href={ getContractExplorerUrl(getTableGamesContractAddress()) } />
      <Flex boxShadow='0px 0px 12px 1px #ffffff47' backgroundColor='#16161685' p='2' borderRadius="15px" direction='column' alignItems='center'>
        <Flex fontSize='.75rem' className='pixelFont' alignItems='center' gap='2'>
          <FontAwesomeIcon icon={faBank} />
          <Text mt='1'>Bank</Text>
        </Flex>
        <Divider my='2px' />
        <Flex alignItems='center' gap='1'>
          <Flex gap='1'>
            <Text fontWeight='bold'>{formatEtherFixed(tableGamesBalance)}</Text>
          </Flex>
          { !tgBankSustained &&
                        <Flex fontSize='.75rem' gap='1' alignItems='center'>
                          <Text color='gray'>/ {formatEtherFixed(minimumRollingFundsExpected)}</Text>
                          <FontAwesomeIcon color='red' icon={faWarning} />
                        </Flex>
          }
          <Text>{BLOCKCHAIN_CURRENCY_NAME}</Text>
        </Flex>
        <UniversalGauge value={tableGamesBalance}
          ticks={gaugeTicks} />
      </Flex>
    </VStack>
  )
}
