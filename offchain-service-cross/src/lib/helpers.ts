import { type ContractReceipt } from 'ethers'
import { formatEther, formatUnits } from 'ethers/lib/utils.js'

/** should not be logged */
export class UserError extends Error {
  constructor (msg: string) {
    super(msg)

    // Set the prototype explicitly.
    Object.setPrototypeOf(this, UserError.prototype)
  }
}

//
export function getGasCostOfTx (rcpt: ContractReceipt) {
  // if all data available...
  if (rcpt.gasUsed != null && rcpt.effectiveGasPrice != null) {
    return _getGasCostOfTx(rcpt)
  } else if (rcpt.gasUsed != null) {
    return `-${rcpt.gasUsed.toNumber().toLocaleString()} gas`
  } else {
    return '==NO COST ESTIMATION AVAILABLE=='
  }
}

//
function _getGasCostOfTx ({ gasUsed, effectiveGasPrice }: ContractReceipt) {
  //
  const ethCost = parseFloat(
    formatEther(gasUsed.mul(effectiveGasPrice))
  ).toFixed(5)

  //
  const gasCost = gasUsed.toNumber().toLocaleString()

  //
  const gasPrice = parseFloat(
    formatUnits(effectiveGasPrice, 'gwei')
  ).toFixed(2)

  //
  return `-${ethCost} ETH = ${gasCost} gas * ${gasPrice} gwei`
}

//
//
//

//
export function packUnoverlapped (start: number, end: number, packBy: number): [number, number][] {
  // count how many instances must be packed
  let instances = end - start + 1

  //
  if (packBy <= 0 || instances <= 1 || packBy >= instances) return [[start, end]]

  //
  const out: [number, number][] = []
  let from = start
  let delta: number

  //
  while (instances > 0) {
    delta = (instances < packBy ? instances : packBy)
    out.push([from, from + delta - 1])
    instances -= delta
    from = from + delta
  }

  //
  return out
}
