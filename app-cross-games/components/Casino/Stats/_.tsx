import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime' // import plugin

import { Flex, Tooltip } from '@chakra-ui/react'
dayjs.extend(relativeTime) // use plugin

//
export const TooltipdFromNow = (props: {
  ts: string | Date
}) => {
  //
  const date = dayjs(props.ts)

  //
  return <Tooltip hasArrow label={date.toString()}>
    <Flex fontSize='.8rem' fontStyle='italic'>
      { date.fromNow()}
    </Flex>
  </Tooltip>
}
