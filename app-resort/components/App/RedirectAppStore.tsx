import { Button, Flex, Image, Text, Link, Box } from '@chakra-ui/react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faDownload, faMobileScreenButton, faTabletScreenButton } from '@fortawesome/free-solid-svg-icons'

import { motion } from 'framer-motion'
import { useMemo } from 'react'
import { domain } from 'pages/_app'

export default function RedirectAppStore (props: {
    store: 'google-play' | 'app-store'
}) {
  //
  return (
    <motion.div
      style={{ width: '100vw', height: '100vh', alignItems: 'center', justifyContent: 'center', display: 'flex' }}
      animate={{ opacity: 1 }}
      initial={{ opacity: 0 }}
    >
      <Flex
        alignItems='center'
        direction='column'
        className='pixelFont'
        textAlign='center'
        p='4' m='3'
        backgroundColor='#141414a8'
        gap='2em'
      >
        <RedirectToStoreHeader />
        <Text>We detected you are using an Android / iOS device.</Text>
        <RedirectToStoreDescription />
        <RedirectToStoreActions store={props.store} />
      </Flex>
    </motion.div>
  )
}

//
function RedirectToStoreActions (props: {
    store: 'google-play' | 'app-store'
}) {
  //
  const storeUrl = useMemo(() =>
    props.store === 'app-store'
      ? 'https://apps.apple.com/fr/app/metamask-blockchain-wallet/id1438144202'
      : 'https://play.google.com/store/apps/details?id=io.metamask&hl=fr&gl=US'
  , [props.store])

  //
  return (
    <Flex direction='column' gap='2'>
      <Button
        rightIcon={<FontAwesomeIcon icon={faDownload} />}
        onClick={() => window.open(storeUrl, '_blank')}
        size='lg'
        fontSize='1em'
      >Download now !</Button>
      <Link
        backgroundColor='#9f3594'
        fontSize='.5em'
        p='1'
        href={`dapp://${domain}`}
        isExternal
      >Already installed ?</Link>
    </Flex>
  )
}

//
function RedirectToStoreDescription () {
  return (
    <Flex fontSize='.7rem' direction='column' alignItems='center' justifyContent='center' gap='5'>
      <Text>If you want to be able to use all Web3 features we provide,</Text>
      <Box>
        <Box as='span'>Please access this dApp through </Box>
        <Box as='span' fontWeight='bold' color='orange'>MetaMask Mobile</Box>
        <Box as='span'> integrated browser.</Box>
      </Box>
    </Flex>
  )
}

//
function RedirectToStoreHeader () {
  return (
    <Flex gap='5' alignItems='center' justifyContent='center'>
      <FontAwesomeIcon icon={faMobileScreenButton} size='2x'/>
      <Image alt='metamask' src='/resources/icons/metamask_64.png' />
      <FontAwesomeIcon icon={faTabletScreenButton} size='2x'/>
    </Flex>
  )
}
