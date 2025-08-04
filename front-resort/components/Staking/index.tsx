import { Flex, Text, Image, Box, Link, Tooltip } from '@chakra-ui/react'
import { faFileContract, faSuitcase } from '@fortawesome/free-solid-svg-icons'
import ContractTitle from 'components/_/ContractTitle'
import { HUDButton } from 'components/App/HUD'
import AutoUpdateTracker from 'components/_/AutoUpdateTracker'
import { getNWERC20ContractAddress, getStakingContractAddress, NWERC20_NAME } from 'env/defaults'
import { useMemo } from 'react'
import { useNWStore } from 'lib/store/main'
import shallow from 'zustand/shallow'
import MyCartel from './NFTCollection'
import { BigNumber } from 'ethers'
import { toCurrency } from 'lib/BigNumberFormatters'
import { formatEther } from 'ethers/lib/utils'

//
export default function Staking () {
  //
  const {
    isSneakingPrevented,
    updateRLDContext$,
    getContractExplorerUrl
  } = useNWStore(s => ({
    isSneakingPrevented: s.isSneakingPrevented,
    updateRLDContext$: s.updateRLDContext$,
    getContractExplorerUrl: s.getContractExplorerUrl
  }), shallow)

  //
  return (
    <Flex alignItems='center' direction='column' gap={3}>
      <Flex px='5' pt='10' justifyContent='center' flexWrap='wrap' gap='3'>
        <Flex direction='column' flex='0'>
          <ContractTitle icon={faSuitcase} isPaused={isSneakingPrevented} title='Red Light District' />
          <AutoUpdateTracker toCallPeriodically={updateRLDContext$} />
        </Flex>
        <Flex justifyContent='space-around' justifySelf='stretch' flex='1' m='1rem'>
          <Flex direction='column' justifyContent='center' gap='5'>
            <HUDButton name='GAME CONTRACT' icon={faFileContract} href={ getContractExplorerUrl(getStakingContractAddress()) } />
            <HUDButton name={NWERC20_NAME} icon={faFileContract} href={ getContractExplorerUrl(getNWERC20ContractAddress()) } />
          </Flex>
          <PoolDexPartners />
        </Flex>
      </Flex>
      <StakingDetails />
      <MyCartel />
    </Flex>
  )
}

//
function PoolDexPartners () {
  return (
    <Flex direction='column' gap='3' justifyContent='center' alignItems='center'>
      <Text>Buy<Box as='span' mx={1} fontSize='.7rem' className='pixelFont parteners-traded-good'>{NWERC20_NAME}</Box>from:</Text>
      <Flex gap={2}>
        <Link href={ 'https://app.pangolin.exchange/' } isExternal >
          <Image alt='Pangolin' src="/resources/icons/pangolin_64.png" />
                    Pangolin
        </Link>
      </Flex>
    </Flex>
  )
}

function StakingDetails () {
  //
  const {
    isSneakingPrevented,
    isStakingAllowed,
    totalLollyEarned,
    totalHookersStaked,
    totalPimpsStaked,
    maximumLOLLYMintableByStaking
  } = useNWStore(s => ({
    isSneakingPrevented: s.isSneakingPrevented,
    isStakingAllowed: s.isStakingAllowed,
    totalLollyEarned: s.totalLollyEarned,
    totalHookersStaked: s.totalHookersStaked,
    totalPimpsStaked: s.totalPimpsStaked,
    maximumLOLLYMintableByStaking: s.maximumLOLLYMintableByStaking
  }), shallow)

  //
  const safeTle = useMemo(() => totalLollyEarned ?? BigNumber.from(0), [totalLollyEarned])

  //
  const safeMLMBS = useMemo(() => maximumLOLLYMintableByStaking ?? BigNumber.from(0), [maximumLOLLYMintableByStaking])

  //
  const formattedPrc = useMemo(() => {
    let out = 0
    if (!safeTle.isZero() && !safeMLMBS.isZero()) {
      const _safeTle = +formatEther(safeTle)
      const _safeMLMBS = +formatEther(safeMLMBS)
      out = _safeTle / _safeMLMBS * 100
    }
    return out.toFixed(2) + ' %'
  }, [safeMLMBS, safeTle])

  //
  return (
    <Flex gap='10' flexWrap='wrap' px='10' py='5' justifyContent='center' alignItems='center'>
      <Flex gap='10'>
        <Flex direction='column'>
          <Text fontSize='.75rem' className='pixelFont'>Can stake ?</Text>
          <YesNoDisplayer isAYes={isStakingAllowed === true} />
        </Flex>
        <Flex direction='column'>
          <Text fontSize='.75rem' className='pixelFont'>Can claim / unstake ?</Text>
          <YesNoDisplayer isAYes={isSneakingPrevented === false} />
        </Flex>
      </Flex>
      <Flex direction='column'>
        <Text fontSize='.75rem' className='pixelFont'>Currently staked</Text>
        <Flex justifyContent='center' gap='10'>
          <Flex direction='column'>
            <Text>Hookers</Text>
            <Text fontWeight='bold'>{totalHookersStaked ?? 0}</Text>
          </Flex>
          <Flex direction='column'>
            <Text>Pimps</Text>
            <Text fontWeight='bold'>{totalPimpsStaked ?? 0}</Text>
          </Flex>
        </Flex>
      </Flex>
      <Flex direction='column'>
        <Text fontSize='.75rem' className='pixelFont'>Total {NWERC20_NAME} produced</Text>
        <Flex justifyContent='center' gap='1'>
          <Tooltip hasArrow label={toCurrency(safeTle) + ' ' + NWERC20_NAME}>
            <Text fontWeight='bold'>{formattedPrc}</Text>
          </Tooltip>
          <Text>of {toCurrency(safeMLMBS)}</Text>
        </Flex>
      </Flex>
    </Flex>
  )
}

function YesNoDisplayer (props: {
    isAYes: boolean
}) {
  return (
    <Text fontWeight='bold' color={props.isAYes ? 'green' : 'red'}>{props.isAYes ? 'YES' : 'NO'}</Text>
  )
}
