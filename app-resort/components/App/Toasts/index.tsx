import HookersUnstakingToast from './_/HookersUnstaking'
import MintedRobbedToast from './_/MintedRobbed'
import VaultRewardsClaimedToast from './_/VaultRewardsClaimed'

export default function NWToasts () {
  return (
    <>
      <HookersUnstakingToast />
      <MintedRobbedToast />
      <VaultRewardsClaimedToast />
    </>
  )
}
