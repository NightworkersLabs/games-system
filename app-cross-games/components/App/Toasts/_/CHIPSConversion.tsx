import { useToast } from '@chakra-ui/react'
import { CASINO_COIN_NAME } from 'env/defaults'
import { useCallback, useEffect } from 'react'
import { useNWStore } from 'lib/store/main'

import shallow from 'zustand/shallow'
import WinningsModal from './WinningsModal'
import { formatEtherFixed } from 'lib/BigNumberFormatters'
import { ChipConversionResult } from 'lib/store/slices/casino-bank/user-context'

//
export default function CHIPSConversionToast () {
  //
  const {
    running,
    latestChipsConversion,
    currencyName,
    singleChipPrice,
    getGrossCurrencyFromChips,
    resetLCCResult
  } = useNWStore(s => ({
    singleChipPrice: s.singleChipPrice,
    running: s.convertChipsRS,
    latestChipsConversion: s.latestChipsConversion,
    currencyName: s.currentNetwork?.currencyName,
    getGrossCurrencyFromChips: s.getGrossCurrencyFromChips,
    resetLCCResult: s.resetLCCResult
  }), shallow)

  //
  const toast = useToast({ duration: null })

  //
  const winningsMessage = useCallback(({ howManyChips }: ChipConversionResult) => {
    //
    const toCurrency = formatEtherFixed(
      getGrossCurrencyFromChips(
        howManyChips
      )
    )

    //
    return `Your funds transfer succeeded. You will soon receive ${toCurrency} ${currencyName} on your account.`
  }, [currencyName, getGrossCurrencyFromChips])

  //
  useEffect(() => {
    // if receiving an error...
    if (typeof running === 'string') {
      // display error toast
      toast({
        status: 'error',
        title: `${CASINO_COIN_NAME} conversion failed...`,
        description: `Conversion failed : "${running}"`,
        isClosable: true,
        position: 'bottom'
      })

      // end immediately
      return
    }

    // if still running OR no meaningful result
    if (running !== false || latestChipsConversion == null) {
      // end immediately
      return
    }

    // if played did not win in the long run by this, display a discrete pop-up
    if (latestChipsConversion.netEvol <= 0) {
      toast({
        duration: 5000,
        status: 'success',
        title: `${CASINO_COIN_NAME} conversion successful !`,
        description: winningsMessage(latestChipsConversion),
        isClosable: true,
        position: 'bottom'
      })

      // ANYWAY, reset payload to prevent useless rerendering of popup
      resetLCCResult()
    }

  //
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, latestChipsConversion])

  // if won, display modal
  return (
    singleChipPrice && latestChipsConversion?.netEvol > 0 && <WinningsModal />
  )
}
