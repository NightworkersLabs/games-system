import "@nomiclabs/hardhat-ethers";
import "@nomicfoundation/hardhat-verify";
import "hardhat-abi-exporter";
// https://hardhat.org/guides/typescript#support-for-path-mappings
import "tsconfig-paths/register";

import fs from "fs";
import type { HardhatUserConfig } from "hardhat/config";
import type { HDAccountsUserConfig } from "hardhat/types";

//
//
//

const deployConfigFileName = ".deploy-config.json";

const _tryReadingDeployConfig = (): HDAccountsUserConfig | undefined => {
  const log = `[Hardhat] Deploy configuration informations from project root "${deployConfigFileName}"`;
  try {
    const parsed = JSON.parse(
      fs.readFileSync(deployConfigFileName, "utf-8"),
    ) as HDAccountsUserConfig;
    console.log(`${log} found !`);
    return parsed;
  } catch {
    console.log(
      `${log} could not be parsed. Deploying on mainnet networks will not be possible.`,
    );
    return undefined;
  }
};

const deployConfig = _tryReadingDeployConfig();

//
//
//
/**
 *
 */
const config: HardhatUserConfig = {
  abiExporter: {
    path: "./abi",
    runOnCompile: true,
    clear: true,
    flat: true,
    only: ["contracts/CasinoBank.sol"],
    spacing: 0,
    pretty: false,
  },
  solidity: {
    compilers: [
      {
        version:
          "0.8.15" /** >= 0.8.13 with IR removes "stack too deep" issues */,
        settings: {
          // viaIR: true, /** got production ready at 0.8.13, disable this if downgrading. WARNING, makes compile times x5 longer */
          optimizer: {
            enabled: true,
            // high runs count, because contracts are expected to be ran alot. Higher price to deploy, cheaper to run
            runs: 2000,
          },
        },
      },
    ],
  },
  // https://hardhat.org/hardhat-network/reference/
  networks: {
    hardhat: {
      gasPrice: 225000000000, // 1 Gas == 225 Gwei
      accounts: {
        accountsBalance: "20000000000000000000000", // 20_000 ETH, to be able to mint the whole Gen 0
      },
      /* mining: {
        auto: true,
        interval: 5000
      } */
    },
    fuji: {
      url: "https://api.avax-test.network/ext/bc/C/rpc",
      chainId: 43113,
      accounts: deployConfig,
    },
    avalanche: {
      url: "https://api.avax.network/ext/bc/C/rpc",
      chainId: 43114,
      accounts: deployConfig,
    },
    bitgertTestnet: {
      url: "https://testnet-rpc.brisescan.com",
      chainId: 64668,
      accounts: deployConfig,
    },
    mantleTestnet: {
      url: "https://rpc.testnet.mantle.xyz",
      chainId: 5001,
      accounts: deployConfig,
    },
    binanceTestnet: {
      url: "https://data-seed-prebsc-1-s1.binance.org:8545",
      chainId: 97,
      accounts: deployConfig,
    },
    polygonTestnet: {
      /**
       * deployed on https://rpc-mumbai.maticvigil.com. RPC are historically instable on this BC.
       * offchain dedicated Night Workers RPC : https://rpc-mumbai.maticvigil.com/v1/b2b6f432f9f3c0bdf70ac214d4a7a51c5920d9ab => https://rpc.maticvigil.com/
       */
      url: "https://matic-testnet-archive-rpc.bwarelabs.com",
      chainId: 80001,
      accounts: deployConfig,
    },
    dogechainTestnet: {
      url: "https://rpc-testnet.dogechain.dog",
      chainId: 568,
      accounts: deployConfig,
    },
    dogechain: {
      url: "https://rpc.dogechain.dog",
      chainId: 2000,
      accounts: deployConfig,
    },
    goerliTestnet: {
      url: "https://goerli.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161",
      chainId: 5,
      accounts: deployConfig,
    },
    ftmTestnet: {
      url: "https://rpc.testnet.fantom.network",
      chainId: 4002,
      accounts: deployConfig,
    },
    /** bitgert: {
      url: 'https://mainnet-rpc.brisescan.com',
      chainId: 32520,
      accounts: deployConfig
    }, */
    bsc: {
      url: "https://bscrpc.com",
      chainId: 56,
      accounts: deployConfig,
    },
    mainnet: {
      url: "https://rpc.ankr.com/eth",
      chainId: 1,
      accounts: deployConfig,
    },
    optimisticGoerli: {
      url: "https://goerli.optimism.io",
      chainId: 420,
      accounts: deployConfig,
    },
    opera: {
      url: "https://rpc.fantom.network",
      chainId: 250,
      accounts: deployConfig,
    },
    polygon: {
      url: "https://polygon-rpc.com",
      chainId: 137,
      accounts: deployConfig,
    },
    qnetworkTestnet: {
      url: "https://rpc.qtestnet.org",
      chainId: 35443,
      accounts: deployConfig,
    },
    arbitrumTestnet: {
      chainId: 421613,
      url: "https://goerli-rollup.arbitrum.io/rpc",
      accounts: deployConfig,
    },
  },
  etherscan: {
    apiKey: {
      avalancheFujiTestnet: "", // API KEY GOES HERE
      avalanche: "", // API KEY GOES HERE
      bscTestnet: "", // API KEY GOES HERE
      bsc: "", // API KEY GOES HERE
      polygonMumbai: "", // API KEY GOES HERE
      dogechain: "whatever" /* KEY NEEDED, BUT NOT MEANINGFUL */,
      mantleTestnet: "whatever" /* KEY NEEDED, BUT NOT MEANINGFUL */,
      goerli: "", // API KEY GOES HERE
      ftmTestnet: "", // API KEY GOES HERE
      bitgert: "", // API KEY GOES HERE
      bitgertTestnet: "", // API KEY GOES HERE
      mainnet: "", // API KEY GOES HERE
      optimisticGoerli: "", // API KEY GOES HERE
      opera: "", // API KEY GOES HERE
      polygon: "", // API KEY GOES HERE
      arbitrumTestnet: "", // API KEY GOES HERE
      qnetworkTestnet: "whatever" /* KEY NEEDED, BUT NOT MEANINGFUL */,
    },
    customChains: [
      {
        network: "mantleTestnet",
        chainId: 5001,
        urls: {
          apiURL: "https://explorer.testnet.mantle.xyz/api",
          browserURL: "https://explorer.testnet.mantle.xyz/",
        },
      },
      {
        network: "dogechain",
        chainId: 2000,
        urls: {
          apiURL: "https://explorer.dogechain.dog/api",
          browserURL: "https://explorer.dogechain.dog",
        },
      },
      {
        network: "bitgert",
        chainId: 32520,
        urls: {
          apiURL: "https://mainnet-rpc.brisescan.com",
          browserURL: "https://brisescan.com",
        },
      },
      {
        network: "bitgertTestnet",
        chainId: 64668,
        urls: {
          apiURL: "https://testnet-rpc.brisescan.com",
          browserURL: "https://testnet-explorer.brisescan.com",
        },
      },
      {
        network: "qnetworkTestnet",
        chainId: 35443,
        urls: {
          apiURL: "https://rpc.qtestnet.org",
          browserURL: "https://explorer.qtestnet.org",
        },
      },
      {
        network: "arbitrumTestnet",
        chainId: 421613,
        urls: {
          apiURL: "https://goerli-rollup.arbitrum.io/rpc",
          browserURL: "https://goerli.arbiscan.io",
        },
      },
    ],
  },
};

export default config;
