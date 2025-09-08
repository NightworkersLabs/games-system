import { Flex, Button, Drawer, DrawerBody, DrawerCloseButton, DrawerContent, DrawerFooter, DrawerHeader, DrawerOverlay, Text, useDisclosure, Tooltip } from '@chakra-ui/react'
import { faScrewdriverWrench, faToolbox } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import AdminControl from 'components/Admin'
import { useMemo, useRef } from 'react'
import { useNWStore } from 'lib/store/main'

import TestingHelpers from './TestingHelpers'

export default function NWDrawer () {
  //
  const { isOpen, onOpen, onClose } = useDisclosure()
  const btnRef = useRef()

  //
  const isAdmin = useNWStore(s => s.isAdmin)

  //
  const isDevEnv = useMemo(() =>
    process.env.NODE_ENV === 'development'
  , [])

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
            {isDevEnv && isAdmin && <AdminControl /> }
          </DrawerBody>
          <DrawerFooter>
            <Button variant='outline' mr={3} onClick={onClose}>Close</Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  )
}
