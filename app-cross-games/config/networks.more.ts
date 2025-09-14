import type { HandledNetworksDefinition } from '#/contrib/networksCompiler'

//
// Here defined network MUST EXIST in networks.json
// Will be compiled into networks.compiled.json (w/ networks.json) using env/networksCompiler.exec.ts
//

//
const moreNetworksInfos : HandledNetworksDefinition = {
  hardhat: {
    networkName: 'Hardhat',
    color: 'yellow',
    subcolor: '#e7c80e',
    logo: '/resources/icons/bc/hardhat.png',
    currencyName: 'ETH',
    debugNetwork: true
  },
  avalanche: {
    networkName: 'Avalanche',
    explorer: 'https://snowtrace.io',
    color: 'red',
    subcolor: '#cb2222',
    logo: '/resources/icons/bc/avalanche.svg',
    currencyName: 'AVAX',
    dappOptions: {
      validatorBrokeBelow: '0.1',
      showBankBalanceAbove: '20'
    }
  },
  fuji: {
    networkName: 'Avalanche FUJI',
    forkOf: 'avalanche',
    explorer: 'https://testnet.snowtrace.io',
    faucet: 'https://faucet.avax.network'
  },
  bitgertTestnet: {
    networkName: 'Bitgert Testnet',
    faucet: 'https://faucet.brisescan.com',
    explorer: 'https://testnet-explorer.brisescan.com',
    color: '#DDD',
    currencyName: 'BRISE',
    subcolor: '#222',
    logo: '/resources/icons/bc/bitgert.png'
  },
  binanceTestnet: {
    forkOf: 'bsc',
    networkName: 'Binance Testnet',
    faucet: 'https://testnet.binance.org/faucet-smart',
    explorer: 'https://testnet.bscscan.com',
    currencyName: 'tBNB'
  },
  polygonTestnet: {
    networkName: 'Polygon Mumbai',
    faucet: 'https://faucet.polygon.technology',
    explorer: 'https://mumbai.polygonscan.com',
    forkOf: 'polygon'
  },
  polygon: {
    networkName: 'Polygon',
    currencyName: 'MATIC',
    explorer: 'https://polygonscan.com',
    color: 'black',
    subcolor: '#222',
    logo: '/resources/icons/bc/polygon.png'
  },
  dogechainTestnet: {
    forkOf: 'dogechain',
    networkName: 'Dogechain Testnet',
    currencyName: 'wDOGE',
    faucet: 'https://faucet.dogechain.dog',
    explorer: 'https://explorer-testnet.dogechain.dog'
  },
  dogechain: {
    networkName: 'Dogechain',
    currencyName: 'DOGE',
    explorer: 'https://explorer.dogechain.dog',
    color: 'black',
    subcolor: '#222',
    logo: '/resources/icons/bc/dogechain.png',
    dappOptions: {
      validatorBrokeBelow: '0.1',
      showBankBalanceAbove: '5000'
    }
  },
  goerliTestnet: {
    forkOf: 'mainnet',
    networkName: 'Ethereum Goerli',
    currencyName: 'gETH',
    faucet: 'https://goerlifaucet.com',
    explorer: 'https://goerli.etherscan.io',
    dappOptions: {
      validatorBrokeBelow: '0.01',
      showBankBalanceAbove: '0.5'
    }
  },
  mainnet: {
    networkName: 'Ethereum',
    currencyName: 'ETH',
    color: '#DDD',
    subcolor: '#222',
    logo: '/resources/icons/bc/ethereum.png',
    explorer: 'https://etherscan.io',
    dappOptions: {
      validatorBrokeBelow: '0.01',
      showBankBalanceAbove: '0.5'
    }
  },
  ftmTestnet: {
    forkOf: 'opera',
    networkName: 'Fantom Testnet',
    currencyName: 'tFTM',
    faucet: 'https://faucet.fantom.network',
    explorer: 'https://testnet.ftmscan.com',
    dappOptions: {
      validatorBrokeBelow: '0.01',
      showBankBalanceAbove: '0.5'
    }
  },
  opera: {
    color: 'blue',
    subcolor: 'blue',
    logo: '/resources/icons/bc/fantom.png',
    networkName: 'Fantom Opera',
    currencyName: 'FTM',
    explorer: 'https://ftmscan.com',
    dappOptions: {
      validatorBrokeBelow: '0.01',
      showBankBalanceAbove: '0.5'
    }
  },
  bsc: {
    networkName: 'Binance Smart Chain',
    explorer: 'https://bscscan.com',
    color: 'black',
    currencyName: 'BNB',
    subcolor: '#222',
    logo: '/resources/icons/bc/binance.png',
    dappOptions: {
      validatorBrokeBelow: '0.01',
      showBankBalanceAbove: '5'
    }
  },
  optimisticGoerli: {
    networkName: 'Optimism Goerli',
    explorer: 'https://goerli-optimism.etherscan.io',
    color: 'red',
    currencyName: 'ETH',
    subcolor: '#cb2222',
    faucet: 'https://optimismfaucet.xyz',
    logo: '/resources/icons/bc/optimism.webp',
    dappOptions: {
      validatorBrokeBelow: '0.01',
      showBankBalanceAbove: '0.5'
    }
  },
  qnetworkTestnet: {
    logo: '/resources/icons/bc/q-network.png',
    currencyName: 'QNT',
    networkName: 'Q Network Testnet',
    color: 'black',
    subcolor: '#222',
    faucet: 'https://faucet.qtestnet.org/',
    explorer: 'https://explorer.qtestnet.org/'
  },
  arbitrumTestnet: {
    logo: '/resources/icons/bc/arbitrum.png',
    currencyName: 'ETH',
    networkName: 'Arbitrum Goerli Testnet',
    color: 'black',
    subcolor: '#222',
    faucet: 'https://faucet.quicknode.com/arbitrum/goerli',
    explorer: 'https://goerli.arbiscan.io'
  },
  mantleTestnet: {
    logo: '/resources/icons/bc/mantle.png',
    currencyName: 'MNT',
    networkName: 'Mantle Goerli Testnet',
    color: 'black',
    subcolor: '#222',
    faucet: 'https://faucet.testnet.mantle.xyz',
    explorer: 'https://explorer.testnet.mantle.xyz'
  }
}

export default moreNetworksInfos
