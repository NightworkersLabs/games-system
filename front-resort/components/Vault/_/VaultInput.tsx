import { Button, Flex, Input, InputGroup, InputRightElement, Tooltip, VStack } from '@chakra-ui/react'
import { IconDefinition } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { formatEtherFixed } from 'lib/BigNumberFormatters'
import { BigNumber } from 'ethers'
import { parseEther } from 'ethers/lib/utils'
import { useCallback, useEffect, useMemo, useState } from 'react'
import MixedCurrencyIcon, { BlockchainCurrencyIcon, NWERC20CurrencyIcon } from 'components/_/MixedCurrencyIcon'

//
export default function VaultInput (props: {
    maxValue: BigNumber,
    onClick: (inputVal: BigNumber) => void,
    canClick: (inputVal: BigNumber) => string | null,
    //
    btnName: string | ((inputVal: BigNumber) => string),
    icon: IconDefinition,
    iconColor: string,
    //
    currencyIcon?: (inputVal: BigNumber) => 'mixed' | 'ERC20' | 'ether'
}) {
  //
  const [inputBN, setInputBN] = useState(BigNumber.from(0))
  const [inputStr, setInputStr] = useState(formatEtherFixed(inputBN))

  //
  const useMax = useCallback(() => {
    setInputBN(props.maxValue)
    setInputStr(formatEtherFixed(props.maxValue))
  }, [props.maxValue])

  //
  const cannotClickExplaination = useMemo(() =>
    props.canClick(inputBN)
  , [inputBN, props])

  //
  const canClick = useMemo(() =>
    cannotClickExplaination == null
  , [cannotClickExplaination])

  //
  const currencyIconType = useMemo(() =>
    props.currencyIcon(inputBN)
  , [inputBN, props])

  //
  useEffect(() => {
    //
    if (inputBN.lte(props.maxValue)) return

    //
    setInputBN(props.maxValue)
    setInputStr(formatEtherFixed(props.maxValue))
    //
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.maxValue])

  //
  return (
    <VStack alignItems='stretch'>
      <Flex gap='2'>
        <InputGroup>
          <Input type='number' value={inputStr} onChange={ev => {
            //
            setInputStr(ev.target.value)

            //
            try {
              setInputBN(parseEther(ev.target.value))
            } catch (e) {
              setInputBN(BigNumber.from(0))
            }
          }} />
          <InputRightElement>
            {currencyIconType === 'mixed'
              ? <MixedCurrencyIcon />
              : (
                currencyIconType === 'ERC20'
                  ? <NWERC20CurrencyIcon />
                  : <BlockchainCurrencyIcon />
              )
            }
          </InputRightElement>
        </InputGroup>
        <Button size='xs' h='100%' onClick={useMax}>MAX</Button>
      </Flex>
      <Tooltip hasArrow label={cannotClickExplaination}>
        <Flex>
          <Button
            flex='1'
            onClick={() => props.onClick(inputBN)}
            rightIcon={<FontAwesomeIcon color={props.iconColor} icon={props.icon} />}
            disabled={!canClick}
          >{
              typeof props.btnName === 'string'
                ? props.btnName
                : props.btnName(inputBN)
            }</Button>
        </Flex>
      </Tooltip>
    </VStack>
  )
}

VaultInput.defaultProps = {
  currencyIcon: () => 'ERC20'
}
