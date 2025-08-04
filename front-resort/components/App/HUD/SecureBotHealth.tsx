import { Flex, Icon, Spinner, Text, Tooltip } from '@chakra-ui/react'
import { BLOCKCHAIN_CURRENCY_NAME, getValidatorServiceUrl } from 'env/defaults'
import { BigNumber } from 'ethers'
import { parseEther } from 'ethers/lib/utils'
import { formatEtherFixed } from 'lib/BigNumberFormatters'
import { useMemo } from 'react'
import { useNWStore } from 'lib/store/main'
import useSWR from 'swr'

//
export const CircleIcon = (props) => (
  <Icon viewBox='0 0 200 200' {...props}>
    <path
      fill='currentColor'
      d='M 100, 100 m -75, 0 a 75,75 0 1,0 150,0 a 75,75 0 1,0 -150,0'
    />
  </Icon>
)

//
export const Timeout = (time: number) => {
  const controller = new AbortController()
  setTimeout(() => controller.abort(), time * 1000)
  return controller
}

//
const validatorServiceFetcher = async (path: string, chainId: number) => {
  //
  const rq = new URL(path, getValidatorServiceUrl())
  rq.searchParams.append('chainId', chainId.toString())

  //
  const res = await fetch(rq, {
    signal: Timeout(10).signal
  })

  //
  const txt = await res.text()

  //
  return ({ res, txt })
}

//
enum HealthStatus {
    NotAvailable,
    DangerouslyBroke,
    KindaBroke,
    Wealthy
}

//
function healthToColor (status: HealthStatus) {
  switch (status) {
  case HealthStatus.NotAvailable:
  case HealthStatus.DangerouslyBroke:
    return 'red'
  case HealthStatus.KindaBroke:
    return 'yellow'
  case HealthStatus.Wealthy:
    return 'green'
  }
}

//
function healthToCompleteDescr (status: HealthStatus) {
  switch (status) {
  case HealthStatus.KindaBroke:
    return 'Bot account is emptying. You might consider poking the dev to ask a refill soon.'
  case HealthStatus.NotAvailable:
    return 'Bot is not responding or is having issues. Please check your connection, or contact the dev if the issue persists.'
  case HealthStatus.DangerouslyBroke:
    return 'Bot account is broke and will not be able to process your TXs. Please contact the dev to ask a refill.'
  case HealthStatus.Wealthy:
    return 'Bot is online and has enough funds.'
  }
}

//
function healthToSimpleDescr (status: HealthStatus) {
  switch (status) {
  case HealthStatus.DangerouslyBroke:
    return 'Broke!'
  case HealthStatus.NotAvailable:
    return 'Error'
  case HealthStatus.KindaBroke:
    return 'Starving'
  case HealthStatus.Wealthy:
    return 'OK'
  }
}

//
export default function SecureBotHealth () {
  //
  const chainId = useNWStore(s => s.chainId)

  //
  const { data, error } = useSWR(
    ['/balance', chainId],
    validatorServiceFetcher,
    { refreshInterval: 30_000 }
  )

  //
  const brokeBelowWei = useMemo(() => {
    if (process.env.NEXT_PUBLIC_BOT_BROKE_BELOW_WEI == null) return parseEther('2')
    return BigNumber.from(process.env.NEXT_PUBLIC_BOT_BROKE_BELOW_WEI)
  }, [])

  //
  const botBalance = useMemo(() => {
    if (!data || data?.res?.status !== 200 || error) return null
    return BigNumber.from(data.txt)
  }, [data, error])

  //
  const status = useMemo(() => {
    if (botBalance == null) return HealthStatus.NotAvailable
    else if (botBalance.lt(brokeBelowWei)) return HealthStatus.DangerouslyBroke
    else if (botBalance.lt(brokeBelowWei.mul(8))) return HealthStatus.KindaBroke
    else return HealthStatus.Wealthy

  //
  }, [botBalance, brokeBelowWei])
  //
  return (
    <Tooltip hasArrow placement='left' label={healthToCompleteDescr(status) + `(${formatEtherFixed(botBalance, 3)} ${BLOCKCHAIN_CURRENCY_NAME})`}>
      <Flex justifyContent='center' alignItems='center' gap='1'>
        {(!data && <Spinner size='xs' />) ||
                    <CircleIcon color={ healthToColor(status) + '.500'}/>}
        <Text fontSize='.75rem'>{healthToSimpleDescr(status)}</Text>
      </Flex>
    </Tooltip>
  )
}
