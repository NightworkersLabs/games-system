import HHConfig from "#/hardhat.config";
import { HISTORIZED_NETWORKS_IGNORED } from "#/scripts/deploy/framework/NWContracts";

//
interface ConfigurableNetworkBase {
  url?: string;
  chainId?: string;
}

interface ConfigurableNetwork {
  [networkName: string]: Required<ConfigurableNetworkBase>;
}

//
export const getHandledNetworks = (): ConfigurableNetwork =>
  Object.fromEntries(
    Object.entries(HHConfig.networks)
      // not in ignored networks
      .filter(
        ([networkName]) => !HISTORIZED_NETWORKS_IGNORED.includes(networkName),
      )
      // inject hardhat network config
      .map(([networkName, config]) => [
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
      ])
      // has rpc url and chain id
      .filter(
        ([, config]) =>
          (config as ConfigurableNetworkBase).chainId &&
          (config as ConfigurableNetworkBase).url,
      )
      // formated to expected
      .map(([networkName, config]) => [
        networkName,
        {
          chainId: (config as ConfigurableNetworkBase).chainId,
          url: (config as ConfigurableNetworkBase).url,
        } as Required<ConfigurableNetworkBase>,
      ]),
  );
