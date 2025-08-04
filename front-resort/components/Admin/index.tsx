import { Flex, Button, Input, Divider } from '@chakra-ui/react'

//
import { useState } from 'react'

//
import shallow from 'zustand/shallow'
import { useNWStore } from 'lib/store/main'
import { formatEther, parseEther } from 'ethers/lib/utils'
import { NWERC20_NAME } from 'env/defaults'

//
export default function AdminControl () {
  //
  const [address, setAddress] = useState('')

  //
  const [startRoundInSecs, setStartRoundInSecs] = useState(60)

  //
  const [howMuchERC20ToMint, setHowMuchERC20ToMint] = useState(parseEther('10000'))

  //
  const {
    grantFreeMints,
    grantWhitelistTickets,
    activatePublicLaunch,
    activateWhitelistLaunch,
    toggleGamePaused,
    toggleSneakingAllowance,
    toggleStakingAllowance,
    scheduleBRRound,
    mintNWERC20
  } = useNWStore(s => ({
    scheduleBRRound: s.scheduleBRRound,
    grantWhitelistTickets: s.grantWhitelistTickets,
    grantFreeMints: s.grantFreeMints,
    activatePublicLaunch: s.activatePublicLaunch,
    activateWhitelistLaunch: s.activateWhitelistLaunch,
    toggleGamePaused: s.toggleGamePaused,
    toggleSneakingAllowance: s.toggleSneakingAllowance,
    toggleStakingAllowance: s.toggleStakingAllowance,
    mintNWERC20: s.mintNWERC20
  }), shallow)

  //
  return (
    <Flex direction="column" gap='5' alignItems='stretch' p='2'>
      <Flex direction="column" gap='1'>
        <Button size='xs' onClick={toggleGamePaused}>Toggle Game Pause</Button>
        <Button size='xs' onClick={activatePublicLaunch}>Do Public Launch</Button>
        <Button size='xs' onClick={activateWhitelistLaunch}>Launch Whitelist</Button>
      </Flex>
      <Divider />
      <Flex direction="column" gap='1'>
        <Input
          maxW="96"
          value={address}
          onChange={e => setAddress(e.target.value)}
          placeholder='Which address to grant ? (Defaults to currently connected)'
        />
        <Button size='xs' onClick={() => grantWhitelistTickets(3, address.length ? address : null)}>+3 WL Tickets</Button>
        <Button size='xs' onClick={() => grantFreeMints(10, address.length ? address : null)}>+10 Free Mints</Button>
      </Flex>
      <Divider />
      <Flex direction='column' gap='1'>
        <Button size='xs' onClick={toggleSneakingAllowance}>Toggle Sneaking</Button>
        <Button size='xs' onClick={toggleStakingAllowance}>Toggle Staking</Button>
      </Flex>
      <Flex direction='column' gap='1'>
        <Input
          maxW="96"
          type='number'
          value={formatEther(howMuchERC20ToMint)}
          onChange={e => setHowMuchERC20ToMint(parseEther(e.target.value))}
          placeholder={'How many ' + NWERC20_NAME}
        />
        <Button size='xs' onClick={() => mintNWERC20(howMuchERC20ToMint)}>Mint {NWERC20_NAME} for self</Button>
      </Flex>
      <Flex direction="column" gap='1'>
        <Input
          maxW="96"
          type='number'
          value={startRoundInSecs}
          onChange={e => setStartRoundInSecs(parseInt(e.target.value))}
          placeholder='How many seconds before starting round'
        />
        <Button size='xs' onClick={() => scheduleBRRound(startRoundInSecs)}>Schedule Vault Round</Button>
      </Flex>
    </Flex>
  )
}
