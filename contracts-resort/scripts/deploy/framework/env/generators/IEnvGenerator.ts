import { ethers } from "hardhat";

import HHConfig from "#/hardhat.config";
import type { NightworkersContext } from "#/scripts/deploy/framework/NWContext";

export abstract class IEnvGenerator<BaseEnv> {
  public abstract generate(context: NightworkersContext): BaseEnv;
}

export const getCurrentRPCUrl = () => {
  switch (ethers.provider.network.chainId) {
    case HHConfig.networks.avalanche.chainId:
      return HHConfig.networks.avalanche.url;
    case HHConfig.networks.fuji.chainId:
      return HHConfig.networks.fuji.url;
    case HHConfig.networks.local.chainId:
    default:
      return ethers.provider.connection.url;
  }
};
