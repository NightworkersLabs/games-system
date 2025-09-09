import HHConfig from "hardhat.config";

import { HISTORIZED_NETWORKS_IGNORED } from "#/scripts/deploy/framework/NWContracts";

//
interface ConfigurableNetworkBase {
  url?: string;
  chainId?: string;
  /** @dev flags whenever this blockchain configuration is to be considered "cheap", eg everything not "mainnet" with market value */
  cheap?: true;
}

interface ConfigurableNetwork {
  [networkName: string]: Required<ConfigurableNetworkBase>;
}

//
export const getHandledNetworks = (): ConfigurableNetwork =>
  HHConfig.networks == null
    ? {}
    : Object.fromEntries(
        Object.entries(HHConfig.networks)
          // not in ignored networks
          .filter(
            ([networkName]) =>
              !HISTORIZED_NETWORKS_IGNORED.includes(networkName),
          )
          // inject hardhat network config
          .map(
            ([networkName, config]) =>
              [
                networkName,
                networkName === "hardhat"
                  ? {
                      ...config,
                      ...{
                        url: "http://127.0.0.1:8545",
                        chainId: 31337,
                      },
                    }
                  : config,
              ] as const,
          )
          // has rpc url and chain id
          .filter(
            ([, config]) =>
              config != null && "chainId" in config && "url" in config,
          )
          // formated to expected
          .map(
            ([networkName, config]) =>
              [
                networkName,
                {
                  chainId: (config as ConfigurableNetworkBase).chainId,
                  url: (config as ConfigurableNetworkBase).url,
                } as Required<ConfigurableNetworkBase>,
              ] as const,
          )
          // try to findout if this network is cheap or not
          .map(
            ([networkName, config]) =>
              [
                networkName,
                {
                  ...config,
                  ...(checkCheapness(networkName, config)
                    ? { cheap: true }
                    : null),
                } as Required<ConfigurableNetworkBase>,
              ] as const,
          ),
      );

//
const checkCheapness = (name: string, rpcConfig: ConfigurableNetworkBase) => {
  if (
    name.toLowerCase().includes("test") ||
    name.toLowerCase().includes("oerli") ||
    ["hardhat"].includes(name)
  )
    return true;
  if (rpcConfig.url == null) return false;

  const url = rpcConfig.url.toLowerCase();

  //
  return (
    url.includes("test") ||
    url.includes("localhost") ||
    url.includes("127.0.0.1") ||
    url.startsWith("http://")
  );
};
