import { formatEther, parseEther } from 'ethers/lib/utils'
import { BigNumber } from 'ethers'

/** @dev consider any number as ether-like decimal pointed */
export function formatEtherFixed (number: BigNumber | number, decimal?: number) {
  //
  if (typeof number === 'number') {
    number = parseEther(number.toString())
  }

  //
  const asNum = formatEther(number || 0)

  //
  return decimal
    ? parseFloat(asNum).toFixed(decimal)
    : asNum
}

/** "1 000 000" - like */
export function toCurrency (number: BigNumber | number) {
  return formatEtherFixed(number, 0)
    .split('').reverse().join('')
    .match(/.{1,3}/g).join(' ')
    .split('').reverse().join('')
}
