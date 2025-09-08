import { Flex, Text, Box, HStack, Tooltip } from '@chakra-ui/react'
import { useNWStore } from 'lib/store/main'
import { formatEther } from 'ethers/lib/utils'
import { BLOCKCHAIN_CURRENCY_NAME, NWERC20_NAME } from 'env/defaults'
import shallow from 'zustand/shallow'
import { BigNumber } from 'ethers'
import { useMemo } from 'react'

interface GaugeConf {
    getPriceTag: () => string
    bounds: [number, number]
}

//
function formatERC20PriceDisplay (price: BigNumber) {
  if (!price) return '...'
  return `${(+formatEther(price)) / 1_000}k ${NWERC20_NAME}`
}

//
function formatMintPriceDisplay (price: BigNumber) {
  if (!price) return '...'
  return `${formatEther(price)} ${BLOCKCHAIN_CURRENCY_NAME}`
}

//
export default function ProgressBar () {
  //
  const {
    maxMintableNFTs,
    evenPricierNFTAt,
    pricierNFTAt,
    payableNFTUntil,
    basePayableMintPrice,
    baseNWERC20MintPrice,
    pricerNWERC20MintPrice,
    evenPricierNWERC20MintPrice,
    payableNFTScarceAt,
    scarcePayableMintPrice
  } = useNWStore(s => ({
    maxMintableNFTs: s.maxMintableNFTs,
    evenPricierNFTAt: s.evenPricierNFTAt,
    pricierNFTAt: s.pricierNFTAt,
    payableNFTUntil: s.payableNFTUntil,
    basePayableMintPrice: s.basePayableMintPrice,
    baseNWERC20MintPrice: s.baseNWERC20MintPrice,
    pricerNWERC20MintPrice: s.pricerNWERC20MintPrice,
    evenPricierNWERC20MintPrice: s.evenPricierNWERC20MintPrice,
    payableNFTScarceAt: s.payableNFTScarceAt,
    scarcePayableMintPrice: s.scarcePayableMintPrice
  }), shallow)

  //
  const gaps = useMemo<GaugeConf[]>(() => [
    {
      getPriceTag: () => formatMintPriceDisplay(basePayableMintPrice),
      bounds: [0, payableNFTScarceAt]
    },
    {
      getPriceTag: () => formatMintPriceDisplay(scarcePayableMintPrice),
      bounds: [payableNFTScarceAt, payableNFTUntil]
    },
    {
      getPriceTag: () => formatERC20PriceDisplay(baseNWERC20MintPrice),
      bounds: [payableNFTUntil, pricierNFTAt]
    },
    {
      getPriceTag: () => formatERC20PriceDisplay(pricerNWERC20MintPrice),
      bounds: [pricierNFTAt, evenPricierNFTAt]
    },
    {
      getPriceTag: () => formatERC20PriceDisplay(evenPricierNWERC20MintPrice),
      bounds: [evenPricierNFTAt, maxMintableNFTs]
    }
  ], [
    baseNWERC20MintPrice,
    basePayableMintPrice,
    evenPricierNFTAt,
    evenPricierNWERC20MintPrice,
    maxMintableNFTs,
    payableNFTScarceAt,
    payableNFTUntil,
    pricerNWERC20MintPrice,
    pricierNFTAt,
    scarcePayableMintPrice
  ])

  //
  return (
    <Flex position='relative'>
      <HStack
        mx="auto"
        h="20"
        w="full"
        maxW="container.lg"
        className="pinkBorder"
        spacing="0"
        position="relative"
        bg="purple.700"
        id='mint-progress-bar'
      >
        {gaps.map((d, id) =>
          <Gauge key={id} conf={d} />
        )}
      </HStack>
      <MintedCount />
    </Flex>
  )
}

//
function Gauge (props: { conf: GaugeConf }) {
  //
  const howManyMinted = useNWStore(s => s.howManyMinted)

  //
  const howMany = useMemo(() => props.conf.bounds[1] - props.conf.bounds[0], [props.conf.bounds])

  //
  const howManyRemaining = useMemo(() => {
    //
    if (howManyMinted >= props.conf.bounds[1]) {
      return 0
    } else if (howManyMinted <= props.conf.bounds[0]) {
      return howMany
    }

    //
    return props.conf.bounds[1] - howManyMinted
  }, [howMany, howManyMinted, props.conf.bounds])

  //
  const prcCompletion = useMemo(() => {
    if (isNaN(howManyRemaining)) return 0
    if (howManyRemaining === howMany) return 0
    else if (howManyRemaining === 0) return 100
    const prc = ((howMany - howManyRemaining) / howMany) * 100
    return prc
  }, [howMany, howManyRemaining])

  //
  return (
    <Flex
      direction="column"
      justify="space-evenly"
      h="full"
      flexGrow={howMany}
      borderRight='2px'
      borderColor="purple.600"
      zIndex="1"
      p='1'
      position='relative'
      color={howManyRemaining === 0 ? 'whiteAlpha.600' : 'white'}
      fontSize={{ base: '.5rem', md: '1.1rem' }}
    >
      <Box
        position="absolute"
        left="0"
        h="calc(5rem - 8px)"
        bg="#ed5af7"
        w={prcCompletion.toPrecision(2) + '%'}
        className={`gauge ${howManyRemaining !== 0 ? 'gauge-remain' : ''}`}
      ></Box>
      <Flex direction='column' gap={1} zIndex="1">
        <Flex justifyContent='center' flexWrap='wrap' className='norowgap' alignItems='center'>
          <Text className="pixelFont" align="center">
            { howManyRemaining ? howManyRemaining.toLocaleString('en') : 'SOLD-OUT !' }
          </Text>
          {howManyRemaining > 0 && (
            <Text className="pixelFont" align="center" fontSize={{ base: '.2rem', md: '.4rem' }}>
                        LEFT
            </Text>
          )}
        </Flex>
        <Text className="pixelFont" align="center" fontSize="xs">
          {props.conf.getPriceTag()}
        </Text>
      </Flex>
    </Flex>
  )
}

//
function MintedCount () {
  //
  const {
    howManyRevealed,
    howManyMinted
  } = useNWStore(s => ({
    howManyRevealed: s.howManyRevealed,
    howManyMinted: s.howManyMinted
  }), shallow)

  //
  return (
    <Tooltip hasArrow label='[Mints Ordered] ([NFT with revealed traits])'>
      <Flex
        fontSize='.8rem'
        alignItems='center'
        color='#443737'
        position='absolute'
        backgroundColor='#ffb43f'
        bottom='-1.25rem'
        right='1.5rem'
        p='1'
        borderRadius='5px'
        zIndex="1"
        gap='2px'
      >
        <Flex>Total:</Flex>
        <Flex>{howManyMinted}</Flex>
        <Flex color='#00000054' fontSize='.65rem'>({howManyRevealed?.toNumber()})</Flex>
      </Flex>
    </Tooltip>
  )
}
