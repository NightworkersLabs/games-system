import { Flex, Link, Tooltip } from '@chakra-ui/react'
import type { IconProp } from '@fortawesome/fontawesome-svg-core'
import { faDiscord, faGithub, faTwitter } from '@fortawesome/free-brands-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import NWDrawer from '#/src/components/App/Drawer'

//
const SocialButton = (props: { url: string, icon: IconProp, tooltipText: string }) => {
  return (
    <Tooltip label={props.tooltipText}>
      <Link color='white' isExternal href={props.url} bgColor='inherit' >
        <FontAwesomeIcon size='lg' icon={props.icon} />
      </Link>
    </Tooltip>
  )
}

//
const SocialBlade = (props: {
    hideToolboxButton?: boolean
}) => {
  return (
    <Flex justifyContent='center' gap={5} mt='2' mb='2'>
      <SocialButton url='https://twitter.com/NightworkersLbs' icon={faTwitter} tooltipText='Twitter' />
      <SocialButton url='https://discord.gg/XDMpfuCreN' icon={faDiscord} tooltipText='Discord' />
      <SocialButton url='https://github.com/NightworkersLabs' icon={faGithub} tooltipText='Github' />
      {props.hideToolboxButton !== true && <NWDrawer />}
    </Flex>
  )
}

export default SocialBlade;