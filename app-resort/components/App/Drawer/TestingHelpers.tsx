import { NWERC20_NAME } from 'env/defaults'

import { Flex, Text, Link } from '@chakra-ui/react'

//
const getDocLink = (contractName: string) => `https://github.com/Nightworkers-P2E/owner-guide/blob/main/${contractName}.md`

//
const getAbiLink = (contractName: string) => `/abi/${contractName}.json`

//
export default function TestingHelpers () {
  //
  return (
    <Flex direction='column' alignItems='center' mb='5' p='2' gap='3' className='test-container'>
      <Link href='https://multisig.pangolin.exchange' isExternal>Pangolin Multisig</Link>
      <Link href='/multisig-formatter' isExternal>Multisig addr. formatter</Link>
      <Flex justifyContent='center' direction='column' fontSize='.75rem' gap='1' flexWrap='wrap'>
        <Text>ABI Files + doc : </Text>
        <ContractRow contractName='NightworkersGame' customDescr='Mint' />
        <ContractRow contractName='RedLightDistrict' customDescr={NWERC20_NAME + ' Staking'} />
        <ContractRow contractName='TableGames' customDescr='CoinFlip/Roulette' />
        <ContractRow contractName='Lottery' />
        <ContractRow contractName='Backroom' customDescr='Vault' />
        <ContractRow contractName='LOLLY' customDescr={NWERC20_NAME} noDoc={true} />
      </Flex>
    </Flex>

  )
}

function ContractRow (props: {
    contractName: string,
    customDescr?: string,
    noDoc?: boolean
}) {
  return (
    <Flex gap='2'>
      <Link flex='1' href={getAbiLink(props.contractName)} isExternal>{ props.customDescr ?? props.contractName }</Link>
      {props.noDoc == null && <Link href={getDocLink(props.contractName)} isExternal>doc</Link>}
    </Flex>
  )
}
