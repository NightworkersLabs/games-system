import { Box, Button, forwardRef, TabList, TabPanel, TabPanels, Tabs, useTab, useMultiStyleConfig } from '@chakra-ui/react'

import Mint from 'components/Mint'
import Staking from 'components/Staking'
import Vault from 'components/Vault'

import Casino from 'components/Casino'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faDice, faSuitcase, faVault, faPortrait } from '@fortawesome/free-solid-svg-icons'
import { NWERC20_NAME } from 'env/defaults'

//
export default function NWTabs () {
  //
  const CustomTab = forwardRef((props, ref) => {
    // 1. Reuse the `useTab` hook
    const icon = props.icon
    const tabProps = useTab({ ...props, ref })

    // 2. Hook into the Tabs `size`, `variant`, props
    const styles = useMultiStyleConfig('Tabs', tabProps)

    return (
      <Button _selected={{ color: '#ff6fc5' }} __css={styles.tab} {...tabProps}>
        <Box display='inline-block' mr='2'>
          {icon}
        </Box>{tabProps.children}
      </Button>
    )
  })

  //
  return (
    <Tabs isLazy align='center' backgroundColor='#581a6e4a' borderRadius='md'>
      <TabList>
        <CustomTab icon={<FontAwesomeIcon icon={faDice} />}>Casino</CustomTab>
        <CustomTab icon={<FontAwesomeIcon icon={faPortrait} />}>Mint NFTs</CustomTab>
        <CustomTab icon={<FontAwesomeIcon icon={faSuitcase} />}>Stake NFTs</CustomTab>
        <CustomTab icon={<FontAwesomeIcon icon={faVault} />}>{NWERC20_NAME} Vault</CustomTab>
      </TabList>
      <TabPanels backgroundColor='#371a54de'>
        <TabPanel>
          <Casino />
        </TabPanel>
        <TabPanel>
          <Mint />
        </TabPanel>
        <TabPanel p='0'>
          <Staking />
        </TabPanel>
        <TabPanel>
          <Vault />
        </TabPanel>
      </TabPanels>
    </Tabs>
  )
}
