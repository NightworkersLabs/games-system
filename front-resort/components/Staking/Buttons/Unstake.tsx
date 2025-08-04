import {
  Checkbox,
  Button,
  Text,
  Flex,
  TableContainer,
  Table,
  Tr,
  Td,
  Tbody
} from '@chakra-ui/react'
import { faAnglesDown, faDice, faMars, faPersonRunning, faSackDollar, faVenus, faWarning } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { BLOCKCHAIN_CURRENCY_NAME, NWERC20_NAME } from 'env/defaults'
import { useCallback, useMemo, useState } from 'react'

import { useNWStore } from 'lib/store/main'
import { SneakOption } from 'lib/store/slices/stake/user-context'
import { formatEtherFixed, toCurrency } from 'lib/BigNumberFormatters'
import shallow from 'zustand/shallow'
import { BigNumber } from 'ethers'
import AutoUpdateTracker from 'components/_/AutoUpdateTracker'

//
export default function UnstakeButton () {
  //
  const [rescueMode, setRescueMode] = useState(false)

  //
  const {
    ownedNFTs,
    maximumClaimAtOnce,
    singleTokenClaimTax,
    getHookerUnstakableDate,
    unstakeMany,
    rescueMany,
    claimMany
  } = useNWStore(s => ({
    ownedNFTs: s.ownedNFTs,
    maximumClaimAtOnce: s.maximumClaimAtOnce,
    singleTokenClaimTax: s.singleTokenClaimTax,
    getHookerUnstakableDate: s.getHookerUnstakableDate,
    unstakeMany: () => s.sneakOutMany(SneakOption.MoneyAndTokenOut),
    rescueMany: () => s.sneakOutMany(SneakOption.TokenOut),
    claimMany: () => s.sneakOutMany(SneakOption.MoneyOut)
  }), shallow)

  //
  const toggleRescueMode = useCallback(() => {
    setRescueMode(!rescueMode)
  }, [rescueMode])

  //
  const selectedWorking = useMemo(() =>
    Object.values(ownedNFTs)
      .filter(x =>
        x.stakingState === 'staked' &&
                x.selectionState === 'selected'
      ), [ownedNFTs])

  //
  const selectedWorkingCount = useMemo(() => selectedWorking.length, [selectedWorking.length])

  //
  const areAllowedToUnstake = useMemo(() => {
    //
    const hookers = selectedWorking.filter(x => x.isHooker === true)
    if (hookers.length === 0) return true

    //
    const now = new Date()
    return hookers.every(x => getHookerUnstakableDate(x) <= now)
  }, [getHookerUnstakableDate, selectedWorking])

  //
  const claimFees = useMemo(() => {
    if (selectedWorkingCount === 0) return null
    const totalTax = singleTokenClaimTax.mul(selectedWorkingCount)
    return formatEtherFixed(totalTax)
  }, [selectedWorkingCount, singleTokenClaimTax])

  //
  return (
    <>
      <Checkbox
        mx="auto"
        className="pixelFont"
        isChecked={rescueMode}
        onChange={toggleRescueMode}
        size='sm'
      >
        <Text fontSize='.5rem'>RESCUE MODE (no rewards!)</Text>
      </Checkbox>
      <Flex alignSelf='stretch' alignItems='center' gap='1'>
        {!rescueMode &&
                    <Button
                      flex='1'
                      bgColor={'#ed5af7'}
                      flexDirection='column'
                      _hover={{ bgColor: '#ed5af7', color: 'purple.700' }}
                      _active={{ bgColor: '#ed5af7' }}
                      onClick={claimMany}
                      isDisabled={selectedWorkingCount === 0}
                    >
                      {claimFees && <Text fontSize='.45rem'>{claimFees} {BLOCKCHAIN_CURRENCY_NAME} tax.</Text>}
                      <Flex gap='2' justifyContent='center'>
                        <FontAwesomeIcon size='lg' icon={faSackDollar} />
                        <Text>CLAIM</Text>
                        <Text>({selectedWorkingCount}/{maximumClaimAtOnce})</Text>
                      </Flex>
                    </Button>
        }
        <Button
          flex='1'
          bgColor={'#ed5af7'}
          flexDirection='column'
          _hover={{ bgColor: '#ed5af7', color: 'purple.700' }}
          _active={{ bgColor: '#ed5af7' }}
          onClick={() => {
            rescueMode ? rescueMany() : unstakeMany()
          }}
          isDisabled={selectedWorkingCount === 0 || (!rescueMode && !areAllowedToUnstake)}
        >
          {claimFees && !rescueMode && <Text fontSize='.45rem'>{claimFees} {BLOCKCHAIN_CURRENCY_NAME} tax.</Text>}
          <Flex gap='2' alignItems='center' justifyContent='center'>
            {rescueMode && <FontAwesomeIcon size='lg' color='#b90000' icon={faWarning} />}
            {rescueMode && <FontAwesomeIcon size='lg' icon={faPersonRunning} />}
            {!rescueMode && <FontAwesomeIcon size='lg' icon={faSackDollar} />}
            {!rescueMode && <FontAwesomeIcon size='lg' icon={faAnglesDown} />}
            <Text>{rescueMode ? 'GET THE F**K OUT!' : 'UNSTAKE'}</Text>
            <Text>({selectedWorkingCount}/{maximumClaimAtOnce})</Text>
            {rescueMode && <FontAwesomeIcon size='lg' icon={faPersonRunning} />}
            {rescueMode && <FontAwesomeIcon size='lg' color='#b90000' icon={faWarning} />}
          </Flex>
        </Button>
      </Flex>
      {selectedWorkingCount !== 0 && <ClaimRecap isRescueMode={rescueMode} unstakingPrevented={!areAllowedToUnstake} />}
    </>
  )
}

function ClaimRecap (props: {
    isRescueMode: boolean,
    unstakingPrevented: boolean
}) {
  //
  const {
    allUnclaimedRevenue,
    refreshUnclaimedRevenue$
  } = useNWStore(s => ({
    allUnclaimedRevenue: s.allUnclaimedRevenue,
    refreshUnclaimedRevenue$: s.refreshUnclaimedRevenue$
  }))

  //
  return (
    <Flex direction="column" alignSelf='stretch'
      backgroundColor='#ff000024'
      marginTop='0 !important' px="5" py='5' gap='2'
    >
      <Flex direction='column'>
        <Text className='pixelFont'>GAINS ESTIMATION</Text>
        <Flex alignSelf='center' alignItems='center' justifyContent='center' gap='2'>
          <Text fontSize='.75rem' textAlign='center'>{'('}...of total</Text>
          <Flex fontSize='.5rem' direction='column'>
            <Text className='pixelFont'>{toCurrency(allUnclaimedRevenue)} {NWERC20_NAME}</Text>
            <AutoUpdateTracker toCallPeriodically={refreshUnclaimedRevenue$} periodicityInSecs={20} />
          </Flex>
          <Text fontSize='.75rem' textAlign='center'>claimable{')'}</Text>
        </Flex>
      </Flex>
      <Flex mt='3' justifyContent='center'>
        { props.isRescueMode
          ? <Flex margin='auto' gap='2'>
                        You will get no <Text className='pixelFont'>{NWERC20_NAME}</Text> since you want to escape {":'("}
          </Flex>
          : <DetailsEstimation unstakingPrevented={props.unstakingPrevented} />
        }
      </Flex>
    </Flex>
  )
}

function DetailsEstimation (props: {
    unstakingPrevented: boolean
}) {
  //
  const {
    ownedNFTs,
    prcTaxOnHookerClaim,
    getHookerUnclaimedRevenue
  } = useNWStore(s => ({
    ownedNFTs: s.ownedNFTs,
    prcTaxOnHookerClaim: s.prcTaxOnHookerClaim,
    getHookerUnclaimedRevenue: s.getHookerUnclaimedRevenue
  }), shallow)

  //
  const [selectedPimpsCount, totalPimpsUnclaimed] = useMemo(() =>
    Object.values(ownedNFTs)
      .filter(x => x.isHooker === false && x.selectionState === 'selected' && x.stakingState === 'staked')
      .reduce((prev, curr) => {
        return [
          ++prev[0],
          prev[1].add(curr.pimp_unclamedRevenue)
        ]
      }, [0, BigNumber.from(0)])
  , [ownedNFTs])

  //
  const [selectedHookersCount, totalHookersUnclaimed] = useMemo(() =>
    Object.values(ownedNFTs)
      .filter(x => x.isHooker === true && x.selectionState === 'selected' && x.stakingState === 'staked')
      .reduce((prev, curr) => {
        return [
          ++prev[0],
          prev[1].add(getHookerUnclaimedRevenue(curr))
        ]
      }, [0, BigNumber.from(0)])
  , [getHookerUnclaimedRevenue, ownedNFTs])

  //
  const bridedTotal = useMemo(() =>
    totalHookersUnclaimed.mul(prcTaxOnHookerClaim).div(100)
  , [prcTaxOnHookerClaim, totalHookersUnclaimed])

  //
  const avgStolenTotal = useMemo(() => totalHookersUnclaimed.div(2), [totalHookersUnclaimed])

  //
  return (
    <Flex gap='5' justifyContent='center'>
      <RecapCell
        descr='Claiming'
        selectedPimpsCount={selectedPimpsCount}
        selectedHookersCount={selectedHookersCount}
        totalPimpsUnclaimed={totalPimpsUnclaimed}
        totalHookersUnclaimed={totalHookersUnclaimed}
        toSubstract={bridedTotal}
        toSubstractDescription= {
          <Text><FontAwesomeIcon icon={faMars} /> Extorting <FontAwesomeIcon icon={faVenus} /> (20% tax)</Text>
        }
      />
      { props.unstakingPrevented
        ? <Flex fontSize='.75rem' margin='auto' flex='1' color='#ff6666'>
                    At least one of the selected tokens is still in vesting period, preventing from unstaking {':('}
        </Flex>
        : <RecapCell
          descr='Unstaking'
          selectedPimpsCount={selectedPimpsCount}
          selectedHookersCount={selectedHookersCount}
          totalPimpsUnclaimed={totalPimpsUnclaimed}
          totalHookersUnclaimed={totalHookersUnclaimed}
          toSubstract={avgStolenTotal}
          toSubstractDescription= {
            <Text><FontAwesomeIcon icon={faMars} /> Stealing <FontAwesomeIcon icon={faVenus} /> (≈50% <FontAwesomeIcon icon={faDice} />)</Text>
          }
        />}
    </Flex>
  )
}

function RecapCell (props: {
    descr: string,
    selectedPimpsCount: number,
    selectedHookersCount: number,
    totalPimpsUnclaimed: BigNumber,
    totalHookersUnclaimed: BigNumber,
    toSubstract: BigNumber,
    toSubstractDescription: any
}) {
  //
  const formattedPimpsUnclaimed = useMemo(() =>
    toCurrency(props.totalPimpsUnclaimed)
  , [props.totalPimpsUnclaimed])

  //
  const formattedTaxlessHookersUnclaimed = useMemo(() =>
    toCurrency(props.totalHookersUnclaimed)
  , [props.totalHookersUnclaimed])

  //
  const totalTaxedUnclaimed = useMemo(() =>
    props.totalHookersUnclaimed.add(props.totalPimpsUnclaimed).sub(props.toSubstract)
  , [props.toSubstract, props.totalHookersUnclaimed, props.totalPimpsUnclaimed])

  //
  return (
    <Flex
      direction='column' flex='1'
      color='#b3b3b3' borderColor='#b3b3b3'
      _hover={{ color: 'white', borderColor: 'white' }}
    >
      <Flex justifyContent='center' gap='1' alignItems='center'>
        <Text className='pixelFont' fontSize='.5rem' fontWeight='bold'>{props.descr} ?</Text>
      </Flex>
      <TableContainer mt='2'>
        <Table variant='simple' size='sm'>
          <Tbody>
            { props.selectedPimpsCount !== 0 &&
                            <Tr>
                              <Td className='pixelFont' fontSize='.5rem'>x{props.selectedPimpsCount}</Td>
                              <Td>Pimp share(s)</Td>
                              <Td className='pixelFont' fontSize='.5rem' isNumeric>{formattedPimpsUnclaimed}</Td>
                            </Tr>
            }
            { props.selectedHookersCount !== 0 &&
                        <>
                          <Tr>
                            <Td className='pixelFont' fontSize='.5rem'>x{props.selectedHookersCount}</Td>
                            <Td>Hooker wage(s)</Td>
                            <Td className='pixelFont' fontSize='.5rem' isNumeric>{formattedTaxlessHookersUnclaimed}</Td>
                          </Tr>
                          <Tr>
                            <Td></Td>
                            <Td fontSize='.7rem'>{props.toSubstractDescription}</Td>
                            <Td className='pixelFont' fontSize='.5rem' isNumeric>-{toCurrency(props.toSubstract)}</Td>
                          </Tr>
                        </>
            }
            <Tr className='pixelFont'>
              <Td fontSize='.45rem' fontWeight='bold'>TOTAL</Td>
              <Td></Td>
              <Td fontSize='.65rem' fontWeight='bold' isNumeric>{toCurrency(totalTaxedUnclaimed)}</Td>
            </Tr>
          </Tbody>
        </Table>
      </TableContainer>
    </Flex>
  )
}
