import { BigNumber } from 'ethers'
import { parseEther } from 'ethers/lib/utils'
import { useEffect, useMemo, useState } from 'react'
import shallow from 'zustand/shallow'

import { Button, Flex, Text, Tooltip } from '@chakra-ui/react'
import { faBank, faCircleQuestion, faFileContract, faRotate, faWallet } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import AutoUpdateTracker from '#/components/_/AutoUpdateTracker'
import ContractTitle from '#/components/_/ContractTitle'
import { HUDButton } from '#/components/App/HUD'
import { BlockchainCurrencyIcon } from '#/components/App/HUD/Wallet'
import { CasinoAuthReminderPopup } from '#/components/Casino/Offchain/_/CasinoAuth'
import { BaseChipsAmountPicker } from '#/components/Casino/Offchain/_/ChipsAmountPicker'
import { formatEtherFixed } from '#/lib/BigNumberFormatters'
import { useNWStore } from '#/lib/store/main'

const CasinoBank = () => {
  //
  const {
    updateCasinoBankContext$,
    isCasinoBankUnpaused,
    casinoBankBalance,
    contractAddress,
    currentNetwork,
    getContractExplorerUrl
  } = useNWStore(s => ({
    updateCasinoBankContext$: s.updateCasinoBankContext$,
    isCasinoBankUnpaused: s.isCasinoBankUnpaused,
    casinoBankBalance: s.casinoBankBalance,
    contractAddress: s.casinoBankContract.address,
    currentNetwork: s.currentNetwork,
    getContractExplorerUrl: s.getContractExplorerUrl
  }), shallow)

  //
  const mustShowBankBalance = useMemo(() => {
    //
    const rawLimit = parseEther(currentNetwork.dappOptions?.showBankBalanceAbove ?? '100000')
    //
    if (casinoBankBalance == null || rawLimit == null) return false
    //
    return casinoBankBalance.gte(rawLimit)
  //
  }, [currentNetwork, casinoBankBalance])

  //
  return (
    <Flex
      className="glowingBorder casinoBg"
      pb="10"
      pt="5"
      direction='column'
      align='strech'
      flexWrap='wrap'
      gap='6'
      flex='1'
    >
      <Flex justifyContent='center'>
        <Flex direction='column'>
          <ContractTitle icon={faBank} isPaused={!isCasinoBankUnpaused} title='Casino Bank' />
          <AutoUpdateTracker toCallPeriodically={updateCasinoBankContext$} />
        </Flex>
      </Flex>
      <Flex flex='1' justifyContent='center'>
        <HUDButton name='CONTRACT' icon={faFileContract} href={ getContractExplorerUrl(contractAddress) } />
      </Flex>
      {mustShowBankBalance && <BankBalance />}
      <ChipsTrader />
    </Flex>
  )
}

//
const BankBalance = () => {
  //
  const {
    casinoBankBalance,
    casinoBankTaxRevenue,
    currencyName
  } = useNWStore(s => ({
    casinoBankBalance: s.casinoBankBalance,
    casinoBankTaxRevenue: s.casinoBankTaxRevenue,
    currencyName: s.currentNetwork?.currencyName
  }), shallow)

  //
  const taxlessBankBalance = useMemo(() => {
    //
    if (casinoBankBalance == null || casinoBankTaxRevenue == null) {
      return BigNumber.from(0)
    }

    //
    return casinoBankBalance.sub(casinoBankTaxRevenue)
    //
  }, [casinoBankBalance, casinoBankTaxRevenue])

  //
  return (
    <Flex direction='column' alignItems='center' my='1'>
      <Text fontStyle='italic'>Bank balance :</Text>
      <Text fontSize='1.25rem' fontWeight='bold'>{formatEtherFixed(taxlessBankBalance)} {currencyName}</Text>
    </Flex>
  )
}

//
const ChipsTrader = () => {
  //
  const casinoAuthSignature = useNWStore(s => s.casinoAuthSignature)

  //
  return (
    <Flex
      flex='1' justifyContent='center' alignItems='center'
      className={casinoAuthSignature == null ? 'stripped' : null}
    >
      {casinoAuthSignature == null &&
                <Flex
                  direction='column' position='absolute' alignItems='center' gap='1'
                  backgroundColor='#111B' zIndex='40' p='1rem' borderRadius='10px'
                >
                  <CasinoAuthReminderPopup />
                </Flex>}
      <Flex flex='1'
        flexWrap='wrap' justifyContent='space-evenly' columnGap='5' rowGap='3rem' mt='6'
        className={casinoAuthSignature == null ? 'disabled' : null}
      >
        <ChipsBuyer />
        <ChipsWithdrawer />
      </Flex>
    </Flex>
  )
}

//
const ChipsBuyer = () => {
  //
  const {
    maxChipsBuyableAtOnce,
    isCasinoBankUnpaused,
    userBalance,
    currencyName,
    buyChips,
    getNetCurrencyFromChips,
    getMaxChipsBuyableFromBalance
  } = useNWStore(s => ({
    maxChipsBuyableAtOnce: s.maxChipsBuyableAtOnce,
    isCasinoBankUnpaused: s.isCasinoBankUnpaused,
    userBalance: s.userBalance,
    currencyName: s.currentNetwork?.currencyName,
    buyChips: s.buyChips,
    getNetCurrencyFromChips: s.getNetCurrencyFromChips,
    getMaxChipsBuyableFromBalance: s.getMaxChipsBuyableFromBalance
  }), shallow)

  //
  const maxBuyable = useMemo(() =>
    Math.min(
      getMaxChipsBuyableFromBalance(userBalance),
      maxChipsBuyableAtOnce
    )
  , [getMaxChipsBuyableFromBalance, maxChipsBuyableAtOnce, userBalance])

  //
  const [chipsToBuy, setChipsToBuyCount] = useState(1)

  //
  const buying = useMemo(() =>
    getNetCurrencyFromChips(chipsToBuy)
  , [chipsToBuy, getNetCurrencyFromChips])

  //
  const cannotAffordToBuy = useMemo(() => maxBuyable <= 0, [maxBuyable])

  //
  const isDisabled = useMemo(() =>
    !isCasinoBankUnpaused || cannotAffordToBuy,
  [cannotAffordToBuy, isCasinoBankUnpaused])

  //
  return (
    <Flex direction='column' alignItems='center' position='relative'>
      <TaxWidgetIndicator />
      <BaseChipsAmountPicker
        subtitle='Amount to buy'
        chipsSetter={setChipsToBuyCount}
        value={chipsToBuy}
        max={maxBuyable}
        isDisabled={isDisabled}
      />
      <Button
        onClick={() => buyChips(chipsToBuy)}
        isDisabled={isDisabled}
        fontSize={{ base: '.75rem', sm: '1rem' }}
        gap='2'
        py='5'
        mt={cannotAffordToBuy ? '2' : null}
      >
        {cannotAffordToBuy &&
                <Flex position='absolute' top='-1.2rem' alignItems='center' gap='2'>
                  <FontAwesomeIcon color='#ffc965' icon={faWallet} fontSize='.6rem' />
                  <Text fontSize='.4rem' textShadow='1px 1px 0px orange'>Insufficient Balance</Text>
                </Flex> }
        <Text fontSize='.6rem'>Buy for</Text>
        <Text>{formatEtherFixed(buying)}</Text>
        <BlockchainCurrencyIcon />
        <Text fontSize='.6rem'>{currencyName}</Text>
      </Button>
    </Flex>
  )
}

//
const ChipsWithdrawer = () => {
  //
  const {
    chipsBalance,
    casinoAuthSignature,
    running,
    convertChips$,
    isCasinoBankUnpaused,
    currencyName,
    getGrossCurrencyFromChips
  } = useNWStore(s => ({
    chipsBalance: s.chipsBalance,
    casinoAuthSignature: s.casinoAuthSignature,
    running: s.convertChipsRS,
    convertChips$: s.convertChips$,
    isCasinoBankUnpaused: s.isCasinoBankUnpaused,
    currencyName: s.currentNetwork?.currencyName,
    getGrossCurrencyFromChips: s.getGrossCurrencyFromChips
  }), shallow)

  //
  const [chipsToWithdraw, setChipsToWithdrawCount] = useState(0)

  //
  const hasNoWithdrawableChips = useMemo(() => chipsBalance == null || chipsBalance.withdrawable < 1, [chipsBalance])

  //
  const cannotWithdraw = useMemo(() =>
    casinoAuthSignature == null || hasNoWithdrawableChips || running === true || !isCasinoBankUnpaused
  , [casinoAuthSignature, isCasinoBankUnpaused, hasNoWithdrawableChips, running])

  //
  const convertedCasinoCoinToCurrency = useMemo(() =>
    formatEtherFixed(getGrossCurrencyFromChips(chipsToWithdraw))
  , [getGrossCurrencyFromChips, chipsToWithdraw])

  //
  useEffect(() => {
    if (chipsBalance?.withdrawable < chipsToWithdraw) {
      setChipsToWithdrawCount(chipsBalance.withdrawable)
    }
  }, [chipsBalance, chipsToWithdraw])

  //
  return (
    <Flex direction='column'>
      <BaseChipsAmountPicker
        subtitle='Amount to withdraw'
        chipsSetter={setChipsToWithdrawCount}
        value={chipsToWithdraw}
        max={chipsBalance?.withdrawable}
        isDisabled={cannotWithdraw}
      />
      <Flex justifyContent='center' alignItems='center' gap='3'>
        <Button
          onClick={cannotWithdraw ? null : () => convertChips$.raise(chipsToWithdraw)}
          isDisabled={cannotWithdraw || chipsToWithdraw === 0}
          fontSize={{ base: '.75rem', sm: '1rem' }}
          gap='2'
          py='5'
        >
          { running === true
            ? <Flex gap='2' alignItems='center'>
              <FontAwesomeIcon className='spinning' fontSize='1.25rem' icon={faRotate} />
              <Text>Converting...</Text>
            </Flex>
            : <>
              <Text fontSize='.6rem'>Convert</Text>
              <Text>{convertedCasinoCoinToCurrency}</Text>
              <BlockchainCurrencyIcon />
              <Text fontSize='.6rem'>{currencyName}</Text>
            </>}
        </Button>
      </Flex>
    </Flex>
  )
}

//
const TaxWidgetIndicator = () => {
  //
  const chipsBuyBasePointsTax = useNWStore(s => s.chipsBuyBasePointsTax)

  //
  return (
    <Tooltip placement='top' hasArrow label='Applied on each conversion'>
      <Flex flexWrap='nowrap' position='absolute' right='1rem' top='-.6rem' zIndex='2'>
        <Flex alignItems='center' gap='1'>
          <Text fontSize='.7rem'>Tax:</Text>
          <Text fontWeight='bold'>{chipsBuyBasePointsTax / 100} %</Text>
        </Flex>
        <FontAwesomeIcon icon={faCircleQuestion} color='grey' fontSize='.6rem' />
      </Flex>
    </Tooltip>
  )
}

export default CasinoBank;