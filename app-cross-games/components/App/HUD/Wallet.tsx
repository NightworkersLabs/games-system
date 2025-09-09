import { useMemo } from 'react'
import shallow from 'zustand/shallow'

import { Button, Flex, Image,Text, Tooltip } from '@chakra-ui/react'
import { faCaretDown, faPlusCircle, faServer, faWallet } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import AutoUpdateTracker from '#/components/_/AutoUpdateTracker'
import { formatEtherFixed } from '#/lib/BigNumberFormatters'
import { useNWStore } from '#/lib/store/main'
import { handledChainIds } from '#/lib/TypedNetworks'

//
const Wallet = (props : { isVisible: boolean }) => {
  //
  const {
    signer,
    dAppState
  } = useNWStore(s => ({
    signer: s.signer,
    dAppState: s.dAppState
  }), shallow)

  //
  return (
    <Flex direction='column' gap='2'>
      <Flex
        bg="blackAlpha.700"
        minW={40}
        p={2}
        border="1px"
        borderColor="#ed5af7"
        direction="column"
        justifyContent='center'
        zIndex={1}
      >
        <CurrentChainDisplay />
        { signer && <ConnectedAccount />}
        { signer && handledChainIds.length > 1 && <NetworkSwitcher /> }
        { (!signer && dAppState !== 'WaitingOnMetaMaskInstallation') && <><ConnectButton /></> }
      </Flex>
      <Flex gap='2' alignItems='center' justifyContent='center'>
        { signer && <AccountBalance isVisible={props.isVisible} /> }
      </Flex>
    </Flex>
  )
}

//
const NetworkSwitcher = () => {
  //
  const selectingNetwork = useNWStore(s => s.selectingNetwork)

  //
  return (
    <Flex
      _hover={{ cursor: 'pointer', color: '#DDD', backgroundColor: '#333' }}
      transition='color .3s, background-color .3s'
      mt='2' backgroundColor='#FFF' color='#222' justifyContent='space-around' alignItems='center' gap='1' fontSize='.65rem'
      onClick={selectingNetwork}
    >
      <FontAwesomeIcon icon={faCaretDown} />
      <Flex alignItems='center' gap='1'>
        <Text>Switch Network</Text>
        <FontAwesomeIcon icon={faServer} />
      </Flex>
      <FontAwesomeIcon icon={faCaretDown} />
    </Flex>
  )
}

//
const ConnectButton = () => {
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
    >CONNECT WALLET</Button>
  )
}

//
const GetFromFaucetButton = () => {
  //
  const currentNetwork = useNWStore(s => s.currentNetwork)

  //
  const faucetedNetwork = useMemo(() => {
    if (currentNetwork != null && 'faucet' in currentNetwork) return currentNetwork
    return null
  }, [currentNetwork])

  //
  return (
    faucetedNetwork == null
      ? <FontAwesomeIcon icon={faWallet} />
      : <Tooltip placement='bottom' defaultIsOpen hasArrow label={`Need Free ${faucetedNetwork.currencyName} ?`}>
        <Flex
          _hover={{ cursor: 'pointer' }}
          onClick={() => window.open(faucetedNetwork.faucet, '_blank')}
        >
          <FontAwesomeIcon icon={faPlusCircle} />
        </Flex>
      </Tooltip>
  )
}

//
const CurrentChainDisplay = () => {
  //
  const networkName = useNWStore(s => s.currentNetwork?.networkName)

  //
  return (
    <Flex justify='center' gap={1}>
      {networkName
        ? <BlockchainCurrencyIcon />
        : <Text color="red">UNKNOWN NETWORK</Text>}
      <Text>{networkName}</Text>
    </Flex>
  )
}

//
export const shorthandingBigNumber = (addr: string) => {
  return `${addr.slice(0, 7)}...${addr.slice(-5, addr.length)}`
}

//
const ConnectedAccount = () => {
  //
  const currentEOAAddress = useNWStore(s => s.currentEOAAddress)

  //
  return (
    <Text mt='.25rem' color='#AAA' fontSize='.6rem' align="center">
      {(currentEOAAddress && shorthandingBigNumber(currentEOAAddress)) || 'NOT CONNECTED'}
    </Text>
  )
}

//
export const BlockchainCurrencyIcon = () => {
  //
  const currentNetwork = useNWStore(s => s.currentNetwork)

  //
  return (
    <Image
      boxShadow={`0px 0px 4px 1px ${currentNetwork.color}`}
      backgroundColor={currentNetwork.color}
      borderRadius='50%'
      src={currentNetwork.logo}
      alt={currentNetwork.currencyName}
      objectFit='cover'
      height='24px'
      width='24px'
      style={{ imageRendering: 'auto' }}
    />
  )
}

//
const AccountBalance = (props : { isVisible: boolean }) => {
  //
  const {
    userBalance,
    updateUserBalance$,
    currentNetwork
  } = useNWStore(s => ({
    userBalance: s.userBalance,
    updateUserBalance$: s.updateUserBalance$,
    currentNetwork: s.currentNetwork
  }))

  //
  return (
    <Flex
      alignSelf='center' justifyContent='space-between' alignItems='center' gap='1' flexWrap='nowrap'
      pl='2' borderRadius='10px'
      boxShadow='0px 0px 13px 3px #000000' backgroundColor={currentNetwork.subcolor}
    >
      {props.isVisible && <GetFromFaucetButton />}
      <Flex flex='1' direction='column' ml='1' mr='.15rem'>
        <Flex gap='1' alignItems='center' justifyContent='end'>
          <Text flex='1' fontSize='.7rem' textAlign='right'>{userBalance == null ? '---' : formatEtherFixed(userBalance, 4)}</Text>
          <Text fontSize='.6rem' fontWeight='bold'>{currentNetwork.currencyName}</Text>
        </Flex>
        <AutoUpdateTracker toCallPeriodically={updateUserBalance$} periodicityInSecs={10} />
      </Flex>
      <BlockchainCurrencyIcon />
    </Flex>
  )
}

export default Wallet;