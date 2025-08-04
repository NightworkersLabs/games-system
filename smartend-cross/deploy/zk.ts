import { Deployer } from '@matterlabs/hardhat-zksync-deploy'
import { Wallet } from 'ethers'
import deployConfig from '../.deploy-config.json'
import { parseEther } from 'ethers'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

export default async function deploy (hre: HardhatRuntimeEnvironment) {
  const args = [
    '0x544a3AC7FF74F1f7AD6e41FcAc4CF98d657675B2', // trustedValidatorAddress, TO FILL
    parseEther('0.0001') // SingleChipValue, TO FILL
  ]
  const depl = Deployer.fromEthWallet(hre, Wallet.fromMnemonic(deployConfig.mnemonic))
  const contract = await depl.deploy(await depl.loadArtifact('CasinoBank'), args)
  await contract.deployed()
  console.log('contract encoded args: ' + contract.interface.encodeDeploy(args))
  console.log('contract address: ' + contract.address)
  // https://v2-docs.zksync.io/api/tools/block-explorer/contract-verification.html
}
