import type { BaseContract, ContractFactory } from "ethers";
import { formatEther } from "ethers";
import {
  existsSync,
  outputFileSync,
  readJSONSync,
  writeJSONSync,
} from "fs-extra";
import { ethers, network } from "hardhat";
import { EOL } from "os";
import { resolve } from "path";

/** standardized network name. Since 'hardhat' configuration is used when deploying on 'localhost' network, rename detected network for linearity */
const sNetworkName = network.name === "localhost" ? "hardhat" : network.name;

//
class NightworkersContractsBase {
  //
  public readonly deploymentHistoryPath: string;

  //
  constructor(deploymentHistoryPath: string) {
    //
    console.log(`== Deploying on [${sNetworkName}] ! ==`);

    //
    const fullpath = resolve(deploymentHistoryPath);

    //
    if (!existsSync(deploymentHistoryPath)) {
      console.log(`== Creating file [${fullpath}] ==`);
      outputFileSync(deploymentHistoryPath, "{}", { flag: "w" });
    } else {
      console.log(`== Using file [${fullpath}] ==`);
    }

    //
    this.deploymentHistoryPath = deploymentHistoryPath;
  }
}

//
export const HISTORIZED_NETWORKS_IGNORED = [
  "local",
  // 'hardhat',
  "localhost",
];

//
export class ContractContext {
  readonly contractName: string;
  builder?: ContractFactory;
  contract?: BaseContract;
  /** @dev if filled, means that a succesful deployment occured during this context lifespan */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  deployArgs?: any[];

  //
  private readonly _superContext: NightworkersContractsBase;

  //
  constructor(contractName: string, superContext: NightworkersContractsBase) {
    this.contractName = contractName;
    this._superContext = superContext;
  }

  //
  private _logIntoHistory(historyPath: string, contractAddress: string) {
    //
    const history = readJSONSync(historyPath);

    // create Contract name space if does not exist
    if (history[this.contractName] == null) {
      history[this.contractName] = {};
    }

    // create network name space if does not exist / if was not an array...
    if (!Array.isArray(history[this.contractName][sNetworkName])) {
      // turn into one
      history[this.contractName][sNetworkName] = [];
    }

    // checks that address already exists
    const cAlreadyExists =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (history[this.contractName][sNetworkName] as any[]).indexOf(
        contractAddress,
      );

    // if exists...
    if (cAlreadyExists !== -1) {
      // remove element
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (history[this.contractName][sNetworkName] as any[]).splice(
        cAlreadyExists,
        1,
      );
    }

    // make deployed address as first
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (history[this.contractName][sNetworkName] as any[]).unshift(
      contractAddress,
    );

    // rewrite file
    writeJSONSync(historyPath, history, { flag: "w", spaces: 2, EOL });
  }

  /** @dev Deploy wrapper, can store deploy args which can be used to verify contracts later
   * @param deployArgs contract constructor args
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async deployW(...deployArgs: any[]) {
    //
    if (this.builder == null) {
      throw new Error("Trying to deploy, but no builder defined.");
    }

    //
    this.contract = await this.builder.deploy(...deployArgs);

    //
    await this.contract?.waitForDeployment();

    // if current network is NOT to be ignored
    if (!HISTORIZED_NETWORKS_IGNORED.includes(sNetworkName)) {
      // log into history file
      this._logIntoHistory(
        this._superContext.deploymentHistoryPath,
        await this.contract.getAddress(),
      );
    }

    //
    this.deployArgs = deployArgs ?? [];
  }
}

//
export class NightworkersContracts extends NightworkersContractsBase {
  //
  private _createContext = (name: string) => new ContractContext(name, this);

  //
  casinoBank = this._createContext("CasinoBank");

  //
  ALL_CONTEXTS = [this.casinoBank];

  //
  //
  //

  //
  private async _transferOwnership(
    expectedNewOwner: string,
    contractContexts: ContractContext[],
  ) {
    //
    console.log(
      `- May transfer ownership of ${contractContexts.length} contracts to ${expectedNewOwner}...`,
    );

    //
    for (const { contract, contractName } of contractContexts) {
      //
      if (contract == null) {
        console.log(
          ` > Contract "${contractName}" : skipped because undefined`,
        );
        continue;
      }

      //
      // eslint-disable-next-line no-prototype-builtins
      if (!contract.hasOwnProperty("owner")) {
        console.log(
          ` > Contract "${contractName}" : skipped because un-ownable`,
        );
        continue;
      }

      try {
        //
        const previousOwner = (await contract.getFunction("owner")()) as string;
        if (expectedNewOwner.toLowerCase() === previousOwner.toLowerCase()) {
          console.log(
            ` > Contract "${contractName}" : skipped because "${expectedNewOwner}" already owns it`,
          );
          continue;
        }

        //
        const tx = await contract
          .getFunction("transferOwnership")
          .send(expectedNewOwner);
        await tx.wait();
        //
      } catch (e) {
        console.log(
          ` > Contract "${contractName}" : error-ed while transfering ownership >> ${e}`,
        );
        continue;
      }

      //
      const newOwner = (await contract.getFunction("owner")()) as string;
      if (expectedNewOwner.toLowerCase() !== newOwner.toLowerCase()) {
        console.log(
          ` > Contract "${contractName}" error while checking new owner (expected: "${expectedNewOwner}", got: "${newOwner}")`,
        );
        continue;
      }

      //
      console.log(
        ` > Contract "${contractName}" : Successfully transfered to "${expectedNewOwner}"`,
      );
    }
  }

  //
  async transferOwnershipTo(newOwnerAddress: string) {
    // get deployer signer
    const [deployer] = await ethers.getSigners();
    const balanceBeforeDeploy = await ethers.provider.getBalance(
      deployer.address,
    );

    //
    if (newOwnerAddress.length === 0)
      throw new Error("New owner address not supplied !");

    //
    await this._transferOwnership(newOwnerAddress, this.ALL_CONTEXTS);

    // calculate price
    const balanceAfterDeploy = await await ethers.provider.getBalance(
      deployer.address,
    );
    const deploymentCost = formatEther(
      balanceBeforeDeploy.sub(balanceAfterDeploy).toBigInt(),
    );
    console.log(`>> Ownership transfer cost : ${deploymentCost} ETH <<`);
  }
}
