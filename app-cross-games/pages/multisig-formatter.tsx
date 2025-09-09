import { useCallback, useState } from 'react'

import { Button, Flex, Text, Textarea, useToast,VStack } from '@chakra-ui/react'

import { NWHead } from '#/pages/_app'
import { mainProduct } from '#/pages/_document'

const MultiSignatureAddressesFormatter = () => {
  //
  const [wlList, updateWLList] = useState('')
  const [addrCount, setAddrCount] = useState(0)
  const [formatedWlList, updateFormattedWLList] = useState('')

  //
  const formatWLList = useCallback((val: string) => {
    //
    updateWLList(val)

    //
    const splitted = val.split(/[\n, ]/).filter(x => x.length !== 0)
    setAddrCount(splitted.length)

    //
    val = '["' + splitted.join('","') + '"]'
    updateFormattedWLList(val)
  }, [])

  //
  const toast = useToast()

  //
  const copyFormattedWLToClipBoard = useCallback(() => {
    navigator.clipboard.writeText(formatedWlList)
    toast({
      description: 'Copied ' + addrCount + ' formatted addresses!',
      duration: 1000,
      position: 'bottom'
    })
  }, [addrCount, formatedWlList, toast])

  //
  return (
    <Flex direction='column' alignItems='center' justifyContent='center' height='100%' width='100%' p='5'>
      <NWHead
        title={'Muti-sig wallet bulk addresses formatter - ' + mainProduct}
      />
      <Flex flex='1' w='100%' alignItems='center' justifyContent='center' gap='10' p='5'>
        <VStack flex='1'>
          <Text>Raw list of addresses</Text>
          <Textarea rows={20} color='black' bgColor='#ffffffa3' onChange={ev => formatWLList(ev.target.value)} value={wlList} />
          <Flex alignItems='center' gap='5'>
            <Button onClick={() => formatWLList('')}>CLEAR</Button>
            <Text>Count: {addrCount}</Text>
          </Flex>
        </VStack>
        <VStack flex='1'>
          <Text>Formated list for Multi-Sig</Text>
          <Textarea onClick={copyFormattedWLToClipBoard} rows={20} bgColor='black' readOnly value={formatedWlList} />
          <Button onClick={copyFormattedWLToClipBoard}>COPY</Button>
        </VStack>
      </Flex>
    </Flex>
  )
}

export default MultiSignatureAddressesFormatter;