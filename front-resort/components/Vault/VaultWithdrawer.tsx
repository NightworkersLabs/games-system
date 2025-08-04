import { faArrowUp } from '@fortawesome/free-solid-svg-icons'
import { BigNumber } from 'ethers'
import { useNWStore } from 'lib/store/main'
import VaultInput from './_/VaultInput'
import shallow from 'zustand/shallow'
import { useMemo } from 'react'
import { NWERC20_NAME } from 'env/defaults'

//
export default function VaultWithdrawer (props: {
    hasClaimableRewards: boolean
    isWithdrawPeriod: boolean
}) {
  //
  const {
    backroomStake,
    mayClaimDoWithdraw
  } = useNWStore(s => ({
    backroomStake: s.backroomStake,
    mayClaimDoWithdraw: s.mayClaimDoWithdraw
  }), shallow)

  //
  const hasNWERC20Staked = useMemo(() =>
    backroomStake?.staked?.isZero() === false
  , [backroomStake.staked])

  //
  return (
    <VaultInput
      btnName={inputVal => {
        if (props.hasClaimableRewards) {
          return inputVal?.isZero() ? 'CLAIM' : 'CLAIM & WITHDRAW'
        }
        return 'WITHDRAW'
      }}
      currencyIcon={inputVal => {
        if (props.hasClaimableRewards) {
          return inputVal?.isZero() ? 'ether' : 'mixed'
        }
        return 'ERC20'
      }}
      onClick={mayClaimDoWithdraw}
      maxValue={backroomStake.staked ?? BigNumber.from(0)}
      icon={faArrowUp}
      iconColor='#4ab769'
      canClick={inputVal => {
        if (inputVal == null) {
          return 'Invalid amount to unstake'
        }

        if (!hasNWERC20Staked) {
          return 'You have no ' + NWERC20_NAME + ' staked'
        }

        if (inputVal.gt(backroomStake?.staked)) {
          return 'Trying to withdraw more than staked'
        }

        if (inputVal.isZero() && props.hasClaimableRewards === false) {
          return 'You have gained no rewards to claim'
        }

        if (props.isWithdrawPeriod === false) {
          return 'You cannot withdraw while a round is playing'
        }
      }}
    />
  )
}
