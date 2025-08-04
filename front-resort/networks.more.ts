import { HandledNetworksDefinition } from 'env/networksCompiler'

//
// Here defined network MUST EXIST in networks.json
// Will be compiled into networks.compiled.json (w/ networks.json) using env/networksCompiler.exec.ts
//

//
const moreNetworksInfos : HandledNetworksDefinition = {
  hardhat: {
    networkName: 'Local Hardhat',
    color: 'yellow',
    logo: '/resources/icons/hardhat.svg',
    currencyName: 'ETH',
    debugNetwork: true
  },
  avalanche: {
    networkName: 'Avalanche Mainnet',
    explorer: 'https://snowtrace.io/',
    color: '#cb2222',
    logo: '/resources/icons/avalanche.svg',
    currencyName: 'AVAX'
  },
  fuji: {
    networkName: 'Avalanche FUJI',
    forkOf: 'avalanche',
    explorer: 'https://testnet.snowtrace.io/',
    faucet: 'https://faucet.avax.network/'
  }
}

export default moreNetworksInfos
