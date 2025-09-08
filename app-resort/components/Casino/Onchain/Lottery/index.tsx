import {
  Text,
  Flex,
  Button,
  VStack,
  NumberInput,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInputField,
  NumberInputStepper,
  Image
} from '@chakra-ui/react'
import { faFileContract, faTicket } from '@fortawesome/free-solid-svg-icons'
import ContractTitle from 'components/_/ContractTitle'
import { HUDButton } from 'components/App/HUD'
import AutoUpdateTracker from 'components/_/AutoUpdateTracker'
import { formatEtherFixed } from 'lib/BigNumberFormatters'
import { BLOCKCHAIN_CURRENCY_NAME, getLotteryContractAddress } from 'env/defaults'
import { useMemo } from 'react'
import { useNWStore } from 'lib/store/main'
import { LotteryState } from 'lib/store/slices/lottery/user-context'
import shallow from 'zustand/shallow'
import { BetBox, GamePlateau } from 'components/Casino/_/base'

//
export default function Lottery () {
  return (
    <GamePlateau
      top={<LotteryGameDescription />}
      left={
        <>
          <YourLotteryStats />
          <TicketsBuyer />
        </>
      }
      right={
        <>
          <LotteryStateGauge />
          <Flex justifyContent='center' p='1em'>
            <Image maxW='200px' src='/resources/casino/ticket_256.png' alt='Golden ticket' className='slow-rotate-y' />
          </Flex>
        </>
      }
    />
  )
}

//
function LotteryGameDescription () {
  //
  const {
    updateLotteryContext$,
    currentLotteryId,
    isLotteryPaused,
    getContractExplorerUrl
  } = useNWStore(s => ({
    updateLotteryContext$: s.updateLotteryContext$,
    currentLotteryId: s.currentLotteryId,
    isLotteryPaused: s.isLotteryPaused,
    getContractExplorerUrl: s.getContractExplorerUrl
  }), shallow)

  //
  return (
    <>
      <Flex flex="2" justifyContent='center'>
        <Flex direction='column'>
          <ContractTitle icon={faTicket} isPaused={isLotteryPaused} title='LOTTERY' />
          <AutoUpdateTracker toCallPeriodically={updateLotteryContext$} />
        </Flex>
      </Flex>
      <Flex direction='column' alignItems='center' gap='2'>
        <HUDButton name='CONTRACT' icon={faFileContract} href={ getContractExplorerUrl(getLotteryContractAddress()) } />
        <VStack color='#2c2c2c' backgroundColor='#ffffffd6' p='2' m='2' borderRadius="15px">
          <Flex gap='1'>
            <Text>Round n°</Text>
            <Text fontWeight='bold'>{currentLotteryId ?? 0}</Text>
          </Flex>
        </VStack>
      </Flex>
    </>
  )
}

//
function LotteryStateGauge () {
  //
  const {
    lotteryState,
    isLotteryPaused,
    finishesAtTimestamp
  } = useNWStore(s => ({
    lotteryState: s.currentLotteryInformations.state,
    isLotteryPaused: s.isLotteryPaused,
    finishesAtTimestamp: s.currentLotteryDuration.finishesAt
  }), shallow)

  //
  const index = useMemo(() => {
    if (isLotteryPaused == null || isLotteryPaused === true || lotteryState === LotteryState.PricesDistributed) return 3
    else if (lotteryState === LotteryState.WaitingOnPricesDistribution) return 2
    else if (finishesAtTimestamp && finishesAtTimestamp < new Date()) return 1
    return 0
  }, [finishesAtTimestamp, isLotteryPaused, lotteryState])

  //
  return (
    <VStack className='lottery-gauge' minW='400px'>
      <Flex>Round status</Flex>
      <Flex fontSize='.75rem' backgroundColor='#16161685' py='1' px='5' borderRadius="10px" gap='3' alignItems='center' boxShadow='0px 0px 7px 1px #c9c9c93d'>
        <Text className={index >= 0 ? 'passed' : ''}>Ongoing</Text>
        <Text className={index >= 1 ? 'passed' : ''}>Waiting for last ticket</Text>
        <Text className={index >= 2 ? 'passed' : ''}>Waiting on winner picking</Text>
        <Text color='white !important' className={index >= 3 ? 'passed' : ''}>Lottery closed</Text>
      </Flex>
    </VStack>
  )
}

//
function TicketsBuyer () {
  //
  const {
    ticketCost,
    howManyTicketsToBuy,
    lotteryState,
    isLotteryPaused,
    buyTickets,
    setHowManyTicketsToBuy
  } = useNWStore(s => ({
    ticketCost: s.currentLotteryRules.ticketCost,
    howManyTicketsToBuy: s.howManyTicketsToBuy,
    lotteryState: s.currentLotteryInformations.state,
    isLotteryPaused: s.isLotteryPaused,
    buyTickets: s.buyTickets,
    setHowManyTicketsToBuy: s.setHowManyTicketsToBuy
  }), shallow)

  //
  const cantBuy = useMemo(() =>
    isLotteryPaused || lotteryState !== LotteryState.Ongoing
  , [isLotteryPaused, lotteryState])

  //
  return (
    <BetBox subtitle='Buy tickets'>
      <Flex alignItems='center' gap='3' justifyContent='center' flexWrap='wrap'>
        <NumberInput
          className='pixelFont'
          size="sm"
          maxW={20}
          value={howManyTicketsToBuy}
          onChange={number => {
            setHowManyTicketsToBuy(parseInt(number))
          }}
          min={1}
          max={20}
          isDisabled={cantBuy}
        >
          <NumberInputField />
          <NumberInputStepper>
            <NumberIncrementStepper />
            <NumberDecrementStepper />
          </NumberInputStepper>
        </NumberInput>
        <Text className='pixelFont'>for {formatEtherFixed(ticketCost.mul(howManyTicketsToBuy))} {BLOCKCHAIN_CURRENCY_NAME}</Text>
      </Flex>
      <Button
        borderRadius={'full'}
        bg="#ed5af7"
        _hover={{ bg: '#ef00ff' }}
        _active={{ bg: '#a100ab' }}
        w="max"
        mt="5"
        mb="5"
        mx="auto"
        onClick={buyTickets}
        disabled={cantBuy}
      >BUY</Button>
    </BetBox>
  )
}

//
function YourLotteryStats () {
  //
  const {
    totalBoughtTickets,
    howManyTicketsBoughtByMe,
    ticketCost,
    currentRewards
  } = useNWStore(s => ({
    totalBoughtTickets: s.currentLotteryInformations.totalBoughtTickets,
    howManyTicketsBoughtByMe: s.howManyTicketsBoughtByMe,
    ticketCost: s.currentLotteryRules.ticketCost,
    currentRewards: s.currentRewards
  }), shallow)

  //
  return (
    <BetBox subtitle='Statistics'>
      <VStack className='pixelFont' spacing={2} align="flex-start" mb="8" alignItems='center' minW='300px'>
        <Text>Already bought: {totalBoughtTickets}</Text>
        {currentRewards && currentRewards.howManyWinners && <>
          <Text>Winners: {currentRewards.howManyWinners}</Text>
          <Text>Gains per winner: {formatEtherFixed(currentRewards.rewardPerWinner)} {BLOCKCHAIN_CURRENCY_NAME}</Text>
        </>
        }
        {howManyTicketsBoughtByMe &&
                <>
                  <Text>You bought: {howManyTicketsBoughtByMe}</Text>
                  <Text>Your odds: {(howManyTicketsBoughtByMe / totalBoughtTickets).toFixed(2)}%</Text>
                </>}
        <Text>Ticket price: {formatEtherFixed(ticketCost)} {BLOCKCHAIN_CURRENCY_NAME}</Text>
      </VStack>
    </BetBox>
  )
}
