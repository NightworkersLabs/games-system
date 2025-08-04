import { useToast } from '@chakra-ui/react'
import { BLOCKCHAIN_CURRENCY_NAME } from 'env/defaults'
import { useEffect } from 'react'
import { useNWStore } from 'lib/store/main'
import { formatEtherFixed } from 'lib/BigNumberFormatters'

import shallow from 'zustand/shallow'

//
export default function VaultRewardsClaimedToast () {
  //
  const {
    latestClaimRewards,
    clearLatestClaimRewards
  } = useNWStore(s => ({
    latestClaimRewards: s.latestClaimRewards,
    clearLatestClaimRewards: s.clearLatestClaimRewards
  }), shallow)

  //
  const toast = useToast()

  //
  useEffect(() => {
    //
    if (latestClaimRewards == null) {
      return
    }

    //
    toast({
      title: BLOCKCHAIN_CURRENCY_NAME + ' rewards claimed !',
      description: `You successfully claimed your ${formatEtherFixed(latestClaimRewards, 4)} ${BLOCKCHAIN_CURRENCY_NAME} as rewards for the current round, congratulations !`,
      status: 'success',
      isClosable: true,
      duration: null,
      position: 'bottom'
    })

    //
    clearLatestClaimRewards()
    //
  }, [clearLatestClaimRewards, latestClaimRewards, toast])

  //
  return (<></>)
}
