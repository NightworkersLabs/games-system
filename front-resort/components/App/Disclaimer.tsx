import { Flex, OrderedList, ListItem, Button, Text, Link } from '@chakra-ui/react'
import { faDice, faWarning } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

export default function Disclaimer (props: { validate: () => void }) {
  return (
    <Flex
      direction='column' alignSelf='center' justifySelf='center' gap="2rem"
      backgroundColor='#000000a6' borderRadius='5px'
      flex='.25'
    >
      <DisclaimerHeader />
      <Flex direction='column' gap='1.5rem' px='3rem'>
        <ConsentText />
        <Text
          color='#ff9292'
          textAlign='center'
          fontStyle='italic'
          fontWeight='bold'
          fontSize='.8rem'
        >Our whole-system beeing decentralized, you are sole legally responsible regarding your local laws.</Text>
      </Flex>
      <ValidateConsentButton validate={props.validate} />
    </Flex>
  )
}

//
function DisclaimerHeader () {
  return (
    <Flex direction='column' mt='5' gap='3'>
      <FontAwesomeIcon size='5x' icon={faDice} />
      <Text
        textAlign='center'
        fontStyle='italic'
        fontWeight='bold'
        fontSize='1.5rem'
      >By accessing this dApp,</Text>
    </Flex>
  )
}

//
function ConsentText () {
  return (
    <OrderedList spacing='3' textAlign='justify' fontFamily='monospace'>
      <ListItem>You confirm that you are allowed in your country of residence to partake in random-based, gamble-like systems that may involve monetary derivative gains or losses.</ListItem>
      <ListItem>You confirm that you are of legal age to gamble and own crypto-currencies.</ListItem>
    </OrderedList>
  )
}

//
function ValidateConsentButton (props: { validate: () => void }) {
  return (
    <Flex direction='column'>
      <Button
        rightIcon={<FontAwesomeIcon icon={faWarning} />}
        leftIcon={<FontAwesomeIcon icon={faWarning} />}
        onClick={props.validate}
        fontSize='.9rem'
      >Sure, let me in !</Button>
      <Link
        backgroundColor='#ed5af7'
        fontSize='.6rem'
        isExternal
        href='https://blog.ipleaders.in/gambling-laws-across-world/'
        pb='1'
        fontWeight='bold'
        borderTopRadius='0'
        textAlign='center'
      >Am I authorized in my country ?</Link>
    </Flex>
  )
}
