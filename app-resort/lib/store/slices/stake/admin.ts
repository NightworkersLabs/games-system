import { StoreSlice } from 'lib/store/_'
import { IPopupTxSlice } from '../popup-tx/handler'
import { IWeb3Slice } from '../web3'
import { IStakeSlice } from './user-context'

export interface IStakeAdminSlice {
  toggleStakingAllowance: () => void
  toggleSneakingAllowance: () => void
}

const slice: StoreSlice<IStakeAdminSlice, IWeb3Slice & IStakeSlice & IPopupTxSlice> = (set, get) => ({
  toggleStakingAllowance: () => get().setupStandardPopupTx({
    description: 'Toggle staking allowance',
    txFunc: () => get().stakingContract.allowStaking(!get().isStakingAllowed),
    onSuccess: get().refreshStakingState
  }),
  toggleSneakingAllowance: () => get().setupStandardPopupTx({
    description: 'Toggle sneaking allowance',
    txFunc: () => get().stakingContract.setPaused(!get().isSneakingPrevented),
    onSuccess: get().refreshStakingState
  })
})

export default slice
