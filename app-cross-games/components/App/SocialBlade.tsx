import { faGithub, faDiscord, faTwitter } from '@fortawesome/free-brands-svg-icons'

import { Flex, Link, Tooltip } from '@chakra-ui/react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { IconProp } from '@fortawesome/fontawesome-svg-core'
import NWDrawer from './Drawer'

//
function SocialButton (props: { url: string, icon: IconProp, tooltipText: string }) {
  return (
    <Tooltip label={props.tooltipText}>
      <Link color='white' isExternal href={props.url} bgColor='inherit' >
        <FontAwesomeIcon size='lg' icon={props.icon} />
      </Link>
    </Tooltip>
  )
}

//
export default function SocialBlade (props: {
    hideToolboxButton?: boolean
}) {
  return (
    <Flex justifyContent='center' gap={5} mt='2' mb='2'>
      <SocialButton url='https://twitter.com/NightworkersLbs' icon={faTwitter} tooltipText='Twitter' />
      <SocialButton url='https://discord.gg/XDMpfuCreN' icon={faDiscord} tooltipText='Discord' />
      <SocialButton url='https://github.com/NightworkersLabs' icon={faGithub} tooltipText='Github' />
      {props.hideToolboxButton !== true && <NWDrawer />}
    </Flex>
  )
}
