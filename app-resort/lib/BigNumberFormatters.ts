import { formatEther, parseEther } from 'ethers/lib/utils'
import { BigNumber } from 'ethers'

//
export function formatEtherFixed (number: BigNumber | number, decimal: number = 2) {
  if (typeof number === 'number') {
    number = parseEther(number.toString())
  }
  return (+formatEther(number || 0)).toFixed(decimal)
}

/** "1 000 000" - like */
export function toCurrency (number: BigNumber | number) {
  return formatEtherFixed(number, 0)
    .split('').reverse().join('')
    .match(/.{1,3}/g).join(' ')
    .split('').reverse().join('')
}
