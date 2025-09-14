import { Flex, Link,Text } from '@chakra-ui/react'

import { CASINO_COIN_NAME } from '#/src/consts'

//
const getDocLink = (contractName: string) => `https://github.com/Nightworkers-P2E/owner-guide/blob/main/${contractName}.md`

//
const getAbiLink = (contractName: string) => `/abi/${contractName}.json`

//
const TestingHelpers = () => {
  //
  return (
    <Flex direction='column' alignItems='center' mb='5' p='2' gap='3' className='test-container'>
      <Link href='https://multisig.pangolin.exchange' isExternal>Pangolin Multisig</Link>
      <Link href='/multisig-formatter' isExternal>Multisig addr. formatter</Link>
      <Flex justifyContent='center' direction='column' fontSize='.75rem' gap='1' flexWrap='wrap'>
        <Text>ABI Files + doc : </Text>
        <ContractRow contractName='CasinoBank' customDescr={CASINO_COIN_NAME + ' Bank'} />
      </Flex>
    </Flex>

  )
}

const ContractRow = (props: {
    contractName: string,
    customDescr?: string,
    noDoc?: boolean
}) => {
  return (
    <Flex gap='2'>
      <Link flex='1' href={getAbiLink(props.contractName)} isExternal>{ props.customDescr ?? props.contractName }</Link>
      {props.noDoc == null && <Link href={getDocLink(props.contractName)} isExternal>doc</Link>}
    </Flex>
  )
}

export default TestingHelpers;