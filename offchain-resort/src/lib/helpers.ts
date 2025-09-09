import { type ContractReceipt } from "ethers";
import { formatEther, formatUnits } from "ethers/lib/utils.js";

export const getGasCostOfTx = (receipt: ContractReceipt) => {
  //
  const ethCost = parseFloat(
    formatEther(receipt.cumulativeGasUsed.mul(receipt.effectiveGasPrice)),
  ).toFixed(5);

  //
  const gasCost = receipt.cumulativeGasUsed.toNumber().toLocaleString();

  //
  const gasPrice = parseFloat(
    formatUnits(receipt.effectiveGasPrice, "gwei"),
  ).toFixed(2);

  //
  return `-${ethCost} ETH = ${gasCost} gas * ${gasPrice} gwei`;
};

export const packUnoverlapped = (
  start: number,
  end: number,
  packBy: number,
): [number, number][] => {
  // count how many instances must be packed
  let instances = end - start + 1;

  //
  if (packBy <= 0 || instances <= 1 || packBy >= instances)
    return [[start, end]];

  //
  const out: [number, number][] = [];
  let from = start;
  let delta: number;

  //
  while (instances > 0) {
    delta = instances < packBy ? instances : packBy;
    out.push([from, from + delta - 1]);
    instances -= delta;
    from = from + delta;
  }

  //
  return out;
};
