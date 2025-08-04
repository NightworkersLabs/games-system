import { faArrowDown } from '@fortawesome/free-solid-svg-icons'
import VaultInput from './_/VaultInput'
import shallow from 'zustand/shallow'
import { useNWStore } from 'lib/store/main'

//
export default function VaultStaker (props: {
    hasClaimableRewards: boolean
    isWithdrawPeriod: boolean
}) {
  //
  const {
    NWERC20Balance,
    allowAndDeposit
  } = useNWStore(s => ({
    NWERC20Balance: s.NWERC20Balance,
    allowAndDeposit: s.allowAndDeposit
  }), shallow)

  //
  return (
    <VaultInput
      btnName={'DEPOSIT'}
      onClick={allowAndDeposit}
      maxValue={NWERC20Balance}
      icon={faArrowDown}
      iconColor='#a7a7ff'
      canClick={val => {
        if (props.hasClaimableRewards && props.isWithdrawPeriod) {
          return 'You must claim this round rewards before depositing more'
        }

        if (val == null || val.isZero()) {
          return 'Amount to stake cannot be 0'
        }

        if (val.gt(NWERC20Balance)) {
          return 'Trying to stake more than you got'
        }
      }}
    />
  )
}
