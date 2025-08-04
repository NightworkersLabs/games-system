import { Flex, Tooltip } from '@chakra-ui/react'
import { BigNumber } from 'ethers'

//
export interface GaugeTick {
    color: string
    to: BigNumber
    blinking?: boolean,
    tooltipLabel?: (currentVal: BigNumber, to: BigNumber) => string
}

//
function getGaugePrc (value: BigNumber, from: BigNumber, to: BigNumber) : number {
  //
  if (value == null || to == null) return 0
  if (value.gte(to)) return 1

  //
  value = value.sub(from)
  to = to.sub(from)

  //
  return value.mul(10_000).div(to).toNumber() / 10_000
}

//
export default function UniversalGauge (props: {ticks: GaugeTick[], value: BigNumber}) {
  //
  return (
    <Flex className='u-gauge'>
      { props.ticks.map((t, i, a) => {
        //
        const prc = getGaugePrc(props.value, a[i - 1]?.to ?? BigNumber.from(0), t.to)

        //
        return (
          <Tooltip key={i} hasArrow label={t.tooltipLabel?.(props.value, t.to)}>
            <Flex
              className={
                (t.blinking && prc < 1 ? 'blinking ' : '') +
                                (t.tooltipLabel ? 'withTooltip' : '')
              }
              style={{
                ['--bgc' as any]: t.color,
                ['--gw' as any]: (prc * 100).toFixed(2) + '%'
              }}
            />
          </Tooltip>
        )
      })}
    </Flex>
  )
}
