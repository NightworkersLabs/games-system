import { Text, Button, Flex, Tooltip, Divider } from '@chakra-ui/react'
import { useMemo } from 'react'
import { useNWStore } from 'lib/store/main'
import { BLOCKCHAIN_CURRENCY_NAME, getChainIDTextDescription, isTestnet } from 'env/defaults'
import shallow from 'zustand/shallow'
import NWERC20Balance from 'components/App/HUD/NWERC20Balance'
import { BlockchainCurrencyIcon } from 'components/_/MixedCurrencyIcon'
import AutoUpdateTracker from 'components/_/AutoUpdateTracker'
import { formatEtherFixed } from 'lib/BigNumberFormatters'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlusCircle, faWallet } from '@fortawesome/free-solid-svg-icons'

//
export default function Wallet (props : { isVisible: boolean }) {
  //
  const {
    signer,
    dAppState,
    chainIdHex
  } = useNWStore(s => ({
    signer: s.signer,
    dAppState: s.dAppState,
    chainIdHex: s.chainIdHex
  }), shallow)

  //
  const isCurrentExpectedTestnet = useMemo(() => isTestnet(chainIdHex), [chainIdHex])

  //
  return (
    <>
      <Flex
        bg="blackAlpha.700"
        minW={40}
        p={2}
        border="1px"
        borderColor="#ed5af7"
        direction="column"
        justifyContent='center'
      >
        <CurrentChainDisplay />
        { signer && <ConnectedAccount />}
        { (!signer && dAppState !== 'WaitingOnMetaMaskInstallation') && <><ConnectButton /></> }
        { signer && <><Divider my={2} /><NWERC20Balance /></> }
      </Flex>
      <Flex gap='2' alignItems='center' justifyContent='center'>
        { signer && <AccountBalance /> }
        { (isCurrentExpectedTestnet && props.isVisible) && <GetFromFaucetButton />}
      </Flex>
    </>
  )
}

//
function ConnectButton () {
  //
  const connectWallet = useNWStore(s => s.connectWallet)

  //
  return (
    <Button
      size={'xs'}
      m='1'
      p='4'
      variant='glowing'
      onClick={connectWallet}
      borderRadius={'none'}
    >
          CONNECT WALLET
    </Button>
  )
}

//
function GetFromFaucetButton () {
  return (
    <Tooltip placement='bottom' defaultIsOpen hasArrow label='Need Free AVAX ?'>
      <Flex
        _hover={{ cursor: 'pointer' }}
        onClick={() => window.open('https://faucet.avax.network', '_blank')}
      >
        <FontAwesomeIcon icon={faPlusCircle} />
      </Flex>
    </Tooltip>
  )
}

//
function CurrentChainDisplay () {
  //
  const chainIdHex = useNWStore(s => s.chainIdHex)

  //
  const chainDescr = useMemo(() => getChainIDTextDescription(chainIdHex), [chainIdHex])

  //
  return (
    <Flex justify='center' gap={1}>
      {chainDescr
        ? <BlockchainCurrencyIcon />
        : <Text color="red">UNKNOWN NETWORK</Text>}
      <Text>{chainDescr}</Text>
    </Flex>
  )
}

//
function displayAddressShorthand (addr: string) {
  return `${addr.slice(0, 5)}...${addr.slice(-3, addr.length)}`
}

//
function ConnectedAccount () {
  //
  const currentEOAAddress = useNWStore(s => s.currentEOAAddress)

  //
  return (
    <Tooltip hasArrow placement='bottom-end' label={currentEOAAddress}>
      <Text fontSize='.6rem' align="center">
        {(currentEOAAddress && displayAddressShorthand(currentEOAAddress)) || 'NOT CONNECTED'}
      </Text>
    </Tooltip>
  )
}

//
function AccountBalance () {
  //
  const {
    userBalance,
    updateUserBalance$
  } = useNWStore(s => ({
    userBalance: s.userBalance,
    updateUserBalance$: s.updateUserBalance$
  }))

  //
  return (
    <Flex alignSelf='center' boxShadow='0px 0px 13px 3px #000000' justifyContent='space-between' alignItems='center' gap='1' pl='2' flexWrap='nowrap' backgroundColor='#cb2222' borderRadius='10px'>
      <FontAwesomeIcon icon={faWallet} />
      <Flex flex='1' direction='column' ml='1'>
        <Flex gap='1' alignItems='center' justifyContent='end'>
          <Text flex='1' fontSize='.7rem' textAlign='right'>{formatEtherFixed(userBalance, 2)}</Text>
          <Text fontSize='.6rem' fontWeight='bold'>{BLOCKCHAIN_CURRENCY_NAME}</Text>
        </Flex>
        <AutoUpdateTracker toCallPeriodically={updateUserBalance$} periodicityInSecs={10} />
      </Flex>
      <BlockchainCurrencyIcon />
    </Flex>
  )
}
