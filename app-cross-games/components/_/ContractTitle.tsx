import { Box, Flex, Text, Tooltip } from '@chakra-ui/react'
import type { IconDefinition } from '@fortawesome/free-solid-svg-icons';
import { faPause, faSquareCheck } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

//
const ContractTitle = (props: { title: string, isPaused?: boolean, icon?: IconDefinition }) => {
  return (
    <Tooltip placement='right' hasArrow label={props.isPaused === true ? 'Not available right now :(' : (props.isPaused === false ? 'Active and available !' : '')}>
      <Flex direction='column' _hover={{ cursor: 'pointer' }}>
        {props.icon &&
                <>
                  <FontAwesomeIcon color={props.isPaused === true ? 'gray' : 'white'} size='2x' icon={props.icon} />
                  <Box mb='.25rem'></Box>
                </>
        }
        <Flex
          whiteSpace='nowrap'
          color={props.isPaused === true ? 'gray' : 'white'}
          alignItems='center'
          className='pixelFont'
          gap={{ base: '3', lg: '5' }}
          fontSize={{ base: 'xl', md: '2xl', lg: '4xl' }}>
          {props.isPaused != null && <FontAwesomeIcon icon={props.isPaused === true ? faPause : faSquareCheck} />}
          <Text flex='0'>{props.title}</Text>
        </Flex>
      </Flex>
    </Tooltip>
  )
}

export default ContractTitle;