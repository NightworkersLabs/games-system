
import { Contract, Signer } from 'ethers'

import mintAbi from 'public/abi/NightworkersGame.json'
import stakingAbi from 'public/abi/RedLightDistrict.json'
import NWERC20Abi from 'public/abi/LOLLY.json'
import BackroomAbi from 'public/abi/Backroom.json'
import TableGamesAbi from 'public/abi/TableGames.json'
import LotteryAbi from 'public/abi/Lottery.json'

// push hardhat-exposed specific methods into ABI for debug env. only
if (process.env.NODE_ENV === 'development') {
  NWERC20Abi.push({
    inputs: [
      {
        internalType: 'address',
        name: 'to_',
        type: 'address'
      },
      {
        internalType: 'uint256',
        name: 'amount_',
        type: 'uint256'
      }
    ],
    name: '$_mint',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  })
}

export const NWERC20_NAME = '$LOLLY'
export const BLOCKCHAIN_CURRENCY_NAME = 'AVAX'

export function getNWERC721Address () { return process.env.NEXT_PUBLIC_NIGHTWORKERS_GAME }
export function getNWERC20ContractAddress () { return process.env.NEXT_PUBLIC_LOLLY }
export function getStakingContractAddress () { return process.env.NEXT_PUBLIC_RED_LIGHT_DISTRICT }
export function getBackroomContractAddress () { return process.env.NEXT_PUBLIC_BACKROOM }
export function getLotteryContractAddress () { return process.env.NEXT_PUBLIC_LOTTERY }
export function getTableGamesContractAddress () { return process.env.NEXT_PUBLIC_TABLE_GAMES }

export function getNWERC721Contract (signer: Signer) { return new Contract(getNWERC721Address(), mintAbi, signer) }
export function getNWERC20Contract (signer: Signer) { return new Contract(getNWERC20ContractAddress(), NWERC20Abi, signer) }
export function getStakingContract (signer: Signer) { return new Contract(getStakingContractAddress(), stakingAbi, signer) }
export function getBackroomContract (signer: Signer) { return new Contract(getBackroomContractAddress(), BackroomAbi, signer) }
export function getLotteryContract (signer: Signer) { return new Contract(getLotteryContractAddress(), LotteryAbi, signer) }
export function getTableGamesContract (signer: Signer) { return new Contract(getTableGamesContractAddress(), TableGamesAbi, signer) }

// from https://docs.metamask.io/guide/rpc-api.html#unrestricted-methods
interface AddEthereumChainParameter {
    chainId: string; // A 0x-prefixed hexadecimal string
    chainName: string;
    nativeCurrency: {
        name: string;
        symbol: string; // 2-6 characters long
        decimals: 18;
    };
    rpcUrls: string[];
    blockExplorerUrls?: string[];
    iconUrls?: string[]; // Currently ignored.
}

export class NetworkToAdd {
  chainIdAsDecimal: string
  url: string

  private constructor (url: string, chainIdAsDecimal: string) {
    this.url = url
    this.chainIdAsDecimal = chainIdAsDecimal
  }

  /**
     * default network based on environment
     */
  static getDefault () : NetworkToAdd {
    return new NetworkToAdd(
      geEnvRpcUrl(),
      process.env.NEXT_PUBLIC_CHAIN_ID
    )
  }
}

export function getEnvChain () : AddEthereumChainParameter {
  return {
    chainName: process.env.NEXT_PUBLIC_CHAIN_NAME,
    chainId: getEnvChainIdAsHex(),
    rpcUrls: [geEnvRpcUrl()],
    nativeCurrency: {
      decimals: 18,
      name: BLOCKCHAIN_CURRENCY_NAME,
      symbol: BLOCKCHAIN_CURRENCY_NAME
    }
  }
}

export function getValidatorServiceUrl () : string {
  return process.env.NEXT_PUBLIC_SECRET_PROVIDER_URL
}

function geEnvRpcUrl () : string {
  return process.env.NEXT_PUBLIC_RPC_URL
}

/**
 * returns the environment-configured chain ID, formated as 0x-hex value
 */
export function getEnvChainIdAsHex () : string {
  const chainIDAsDecimal = process.env.NEXT_PUBLIC_CHAIN_ID
  if (chainIDAsDecimal == null) {
    throw new Error('Could not determine expected Chain ID from server environment. Please contact the developpers.')
  }
  return '0x' + parseInt(chainIDAsDecimal).toString(16)
}

/**
 * signature that we can feed MetaMask to add NWERC20 token
 */
export function getEnvNWERC20Signature () : any {
  return {
    type: 'ERC20',
    options: {
      address: getNWERC20ContractAddress(),
      symbol: NWERC20_NAME,
      decimals: 18,
      image: `http://${window.location.host}${NWERC20CoinImagePath(true)}`
    }
  }
}

export function NWERC20CoinImagePath (fullRes?: boolean) {
  return `/resources/icons/${NWERC20_NAME}${fullRes ? '' : '_32'}.png`
}

//
function toHex (chainId: number): string {
  return '0x' + (chainId).toString(16)
}

//
export function getChainIDTextDescription (chainId: string) : string | boolean {
  switch (chainId) {
  case toHex(1337):
  case toHex(31337):
    return 'Dev. Blockchain'
  case toHex(43113):
    return 'Avalanche FUJI'
  case toHex(43114):
    return 'Avalanche Mainnet'
  case toHex(43112):
    return 'Avalanche Local'
  default:
    return false
  }
}

export function isTestnet (chainIdHex: string) {
  return toHex(43113) === chainIdHex
}
