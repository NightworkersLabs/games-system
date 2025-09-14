import { useRef } from 'react'

import { Button, Drawer, DrawerBody, DrawerCloseButton, DrawerContent, DrawerFooter, DrawerHeader, DrawerOverlay, Flex, Text, Tooltip,useDisclosure } from '@chakra-ui/react'
import { faScrewdriverWrench, faToolbox } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import TestingHelpers from '#/src/components/App/Drawer/TestingHelpers'

const NWDrawer = () => {
  //
  const { isOpen, onOpen, onClose } = useDisclosure()
  const btnRef = useRef(null)

  //
  return (
    <>
      <Tooltip hasArrow label='Admin Console'>
        <Button fontSize='1rem' size='xs' variant='glowing' ref={btnRef} onClick={onOpen}>
          <FontAwesomeIcon icon={faToolbox} />
        </Button>
      </Tooltip>
      <Drawer
        isOpen={isOpen}
        placement='right'
        onClose={onClose}
        finalFocusRef={btnRef}
      >
        <DrawerOverlay />
        <DrawerContent backgroundColor='#62265cb5'>
          <DrawerCloseButton />
          <DrawerHeader>
            <Flex gap='2' alignItems='center'>
              <FontAwesomeIcon icon={faScrewdriverWrench} />
              <Text>Admin Console</Text>
            </Flex>
          </DrawerHeader>
          <DrawerBody>
            <TestingHelpers />
          </DrawerBody>
          <DrawerFooter>
            <Button variant='outline' mr={3} onClick={onClose}>Close</Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  )
}

export default NWDrawer;