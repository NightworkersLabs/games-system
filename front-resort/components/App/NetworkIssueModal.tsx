import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  Text,
  Link,
  UnorderedList,
  ListItem
} from '@chakra-ui/react'
import { useNWStore } from 'lib/store/main'

//
export default function NetworkIssueModal () {
  //
  const L2NetworkToManuallyInsert = useNWStore(s => s.L2NetworkToManuallyInsert)

  //
  return (
    <Modal closeOnOverlayClick={false} isCentered isOpen={true} onClose={() => {}}>
      <ModalOverlay />
      <ModalContent
        color="white"
        bg="purple.900"
        border="4px"
        borderRadius="none"
        borderColor="pink.400"
      >
        <ModalHeader>
          <Text className={'pixelFont'}>Cannot switch to expected network</Text>
        </ModalHeader>
        <ModalBody pb={6}>
          <Text>
                        We were not able to request your provider to switch to Night Workers&apos;s network.
          </Text>
          <br />
          <Text>
                        This most probably happened because you are in a Development environment, for any of thoses reasons :
          </Text>
          <br />
          <UnorderedList>
            <ListItem>MetaMask do not allow a chain switch / injection to a HTTP JSON-RPC URL</ListItem>
            <ListItem>MetaMask default localhost pre-configured network Chain ID differs from expected</ListItem>
          </UnorderedList>
          <br />
          <Text>
                        Please add / update the chain described below into your provider&apos;s networks to continue.
          </Text>
          <br />
                    URL : <Text fontWeight='extrabold'>{L2NetworkToManuallyInsert.url}</Text>
          <br />
                    Chain ID : <Text fontWeight='extrabold'>{L2NetworkToManuallyInsert.chainIdAsDecimal}</Text>
          <br />
          <Link href='https://metamask.zendesk.com/hc/en-us/articles/360043227612-How-to-add-a-custom-network-RPC' isExternal>
                        How to add a custom network (with MetaMask) ?
          </Link>
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}
