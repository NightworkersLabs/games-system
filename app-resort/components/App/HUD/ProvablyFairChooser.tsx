import { Checkbox, Tooltip, Flex } from '@chakra-ui/react'
import { faBalanceScale, faBalanceScaleLeft } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { ChangeEvent, useCallback, useEffect } from 'react'
import { useNWStore } from 'lib/store/main'
import shallow from 'zustand/shallow'

//
export default function ProvablyFairChooser () {
  const {
    useProvablyFairness,
    setProvablyFairnessUsage
  } = useNWStore(s => ({
    useProvablyFairness: s.useProvablyFairness,
    setProvablyFairnessUsage: s.setProvablyFairnessUsage
  }), shallow)

  //
  const setPf = useCallback((ev: ChangeEvent<HTMLInputElement>) => {
    const mustUse = ev.target.checked
    localStorage.setItem('usePF', JSON.stringify(mustUse))
    setProvablyFairnessUsage(mustUse)
  }, [setProvablyFairnessUsage])

  //
  useEffect(() => {
    const usePF = JSON.parse(localStorage.getItem('usePF') || 'true')
    setProvablyFairnessUsage(usePF)
  }, [setProvablyFairnessUsage])

  //
  return (
    <Tooltip placement='left' hasArrow label='If enabled, randomness produced by the bot can be checked.'>
      <Flex gap={2} alignItems='center'> {/** required */}
        <Checkbox isChecked={useProvablyFairness} onChange={setPf}>
          {useProvablyFairness ? 'Enabled' : 'Disabled'}
        </Checkbox>
        <FontAwesomeIcon color={useProvablyFairness ? 'white' : 'red'} icon={useProvablyFairness ? faBalanceScale : faBalanceScaleLeft} />
      </Flex>
    </Tooltip>
  )
}
