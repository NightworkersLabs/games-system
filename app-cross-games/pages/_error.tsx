import { Flex, Text } from '@chakra-ui/react'
import { faWarning } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { NWNakedTitleContent } from 'components/App/NWTitle'

export default function Error ({ statusCode }) {
  return (
    <Flex direction='column' gap='5rem' color="white" alignItems='center' justifyContent='center' flex='1'>
      <Flex fontSize='2rem' direction='column'>
        <NWNakedTitleContent />
      </Flex>
      <Flex direction='column' gap='2'>
        <FontAwesomeIcon size='2x' icon={faWarning} />
        <Text>{
          statusCode
            ? (
              statusCode === 404
                ? 'Page not found !'
                : `An error ${statusCode} occurred on server.`
            )
            : 'An error occurred on client.'
        }</Text>
      </Flex>
    </Flex>
  )
}

Error.getInitialProps = ({ res, err }) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404
  return { statusCode }
}
