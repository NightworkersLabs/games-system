import { useCallback } from 'react'

import { Box, Checkbox, Flex, Text } from '@chakra-ui/react'

import { useNWStore } from '#/src/lib/store/main'

import { NextStepButton } from '.'

const ETETxText = 'To prevent manipulations and exploits from third-parties (hackers, us developpers...) of the outcome / rarity you will get,' +
                  ' this transaction will first be handled by a secure bot of our own, and it might require a bit of configuration on your part. ' +
                  'Fear not, it will only take a bit longer than the traditionnal method, and the fairness of the random output can be proven.'
const AgnosticTxText = 'To prevent hacks and manipulations when the outcomes will be picked, it might require a bit of configuration on your part.'

const PFText = 'As you want to have proof of fairness, you will have extra steps to go though before processing the order.'
const NonPFText = 'Since you explicitely OPTED-OUT of provability,' +
                  ' we will automate all the process for you, but you will NOT be able to confirm any fairness. If possible, always prefer using provability.'

//
const SecurePopupTxDescriptor = (props: {
    nextStep: () => void,
    usesProvablyFairness: boolean,
    willBeProvable: boolean,
    description: string
}) => {
  //
  const setSkipProvablyExplaination = useNWStore(s => s.setSkipProvablyExplaination)

  //
  const skipDescriptorForSession = useCallback(() => {
    // save into session
    sessionStorage.setItem('skipPFDescr', 'true')

    // define state
    setSkipProvablyExplaination(true)

    // go to next step
    props.nextStep()
  //
  }, [props, setSkipProvablyExplaination])

  //
  return (
    <Flex direction='column' textAlign='center'>
      <Text>You are about to <Text as='span' fontWeight='bold'>{props.description}</Text>, which involves random outcomes.</Text>
      <Box h='1.2em' />
      <Text>{ props.willBeProvable ? ETETxText : AgnosticTxText }</Text>
      <Box h='1.2em' />
      <Text color={props.usesProvablyFairness ? 'white' : '#ff7676'}>{ props.usesProvablyFairness ? PFText : NonPFText }</Text>
      <Box h='1.2em' />
      <Text>Follow these steps to continue.</Text>
      <Flex flex='1' w='100%' mt='5' alignItems='center' justifyContent='space-between'>
        <Checkbox size='sm' bgColor='#00000033' p='2' onChange={skipDescriptorForSession}>
          <Text fontSize='.6rem'>Ignore disclaimer ?</Text>
        </Checkbox>
        <NextStepButton nextDescr='Continue' nextStep={props.nextStep} />
      </Flex>
    </Flex>
  )
}

export default SecurePopupTxDescriptor;