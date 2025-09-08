import { Contract } from 'ethers'
import { formatEther, parseEther } from 'ethers/lib/utils'
import { ethers } from 'hardhat'
import logUpdate = require('log-update')
import { TraitsPack, readNFTAssetsRepositoryPacker } from '@nightworkerslabs/nft-assets/utilities'
import { IgniteParameters, NightworkersContractsFactory } from './NWContractsFactory'

export class NightworkersContext extends NightworkersContractsFactory {
  //
  nftAssets: TraitsPack[]

  constructor (deploymentHistoryPath: string, useExposedContractVariations: boolean) {
    super(deploymentHistoryPath, useExposedContractVariations)
    this.nftAssets = readNFTAssetsRepositoryPacker('./nft-assets')
  }

  protected async _deploy (params: IgniteParameters) {
    //
    let i = -1
    let getLog = (done: boolean = false) => {
      i++
      return `- Deploying contracts... (${i} / ${done ? i : '...'})`
    }
    logUpdate(getLog())

    //
    // checks for required parameters...
    //

    // eg, considered as "release mode"
    if (!this._useExposedContractVariations) {
      //
      if (params.taxesAndRevenueRecipientAddress == null || params.taxesAndRevenueRecipientAddress.length === 0) {
        throw new Error('Not supplying the marketing multisig address in release mode is forbidden !')
      }

      //
      if (params.trustedValidatorAddress == null || params.trustedValidatorAddress.length === 0) {
        throw new Error('Not supplying a trusted validator address in release mode is forbidden !')
      }

      if (params.tokenURIBase == null || params.tokenURIBase.length === 0) {
        throw new Error('Not supplying the tokenURI base of the associated dApp is forbidden in release mode !')
      }
    } else /* ... else, if in debug mode */ {
      //
      const [deployer] = await ethers.getSigners()

      // if no team pay account provided, use the ERC20 contract as holder
      if (params.taxesAndRevenueRecipientAddress == null || params.taxesAndRevenueRecipientAddress.length === 0) {
        params.taxesAndRevenueRecipientAddress = deployer.address
      }

      // define owner as trusted validator
      if (params.trustedValidatorAddress == null || params.trustedValidatorAddress.length === 0) {
        params.trustedValidatorAddress = deployer.address
      }
    }

    //
    // Deploy all required contracts
    //

    // if no address provider, generate new ERC20
    if (params.ERC20TokenContractAddress == null) {
      // standard deploy
      await this.lolly.deployW()
      logUpdate(getLog())
    } else {
      // check it exists
      try {
        // get default provider
        const [{ provider }] = await ethers.getSigners()

        // get contract code
        const code = await provider.getCode(params.ERC20TokenContractAddress)

        // if empty, does not exist => throw
        if (code == null || code.length === 0 || code === '0x') {
          throw new Error()
        }

        // if it does, add interface
        this.lolly.contract = new Contract(
          params.ERC20TokenContractAddress,
          this.lolly.builder.interface,
          this.lolly.builder.signer
        )

        // checks that "isController" and "invalidReceiver" exists, if it does not, ethers will throw
        await this.lolly.contract.isController(this.lolly.contract.address)
        await this.lolly.contract.invalidReceiver(this.lolly.contract.address)

      //
      } catch (e) {
        throw new Error('Could not find appropriate ERC20 on the network. Please check that the address is a valid contract with expected interface.')
      }
    }

    //
    await this.candyMachine.deployW(
      params.tokenURIBase ?? ''
    )
    logUpdate(getLog())

    //
    await this.backroom.deployW(
      this.lolly.contract.address
    )
    logUpdate(getLog())

    //
    await this.lottery.deployW(
      params.trustedValidatorAddress,
      params.taxesAndRevenueRecipientAddress
    )
    logUpdate(getLog())

    //
    await this.tableGames.deployW(
      params.trustedValidatorAddress,
      params.taxesAndRevenueRecipientAddress
    )
    logUpdate(getLog())

    //
    await this.redLightDistrict.deployW(
      params.trustedValidatorAddress,
      this.lolly.contract.address,
      params.taxesAndRevenueRecipientAddress,
      params.ERC20WiningsPerDayStaking ?? parseEther((10_000).toString()), // 10k LOLLY by default
      params.minimumVestingPeriodInSecs ?? 60 * 60 * 48 // 48h by default
    )
    logUpdate(getLog())

    //
    await this.nightworkersGame.deployW(
      params.trustedValidatorAddress,
      this.lolly.contract.address,
      this.candyMachine.contract.address,
      this.redLightDistrict.contract.address,
      params.taxesAndRevenueRecipientAddress,
      params.maxMints ?? 50_000,
      params.defaultPayableMintPrice ?? parseEther('1.5')
    )
    logUpdate(getLog(true))
    logUpdate.done()

    //
    //
    //

    //
    i = -1
    getLog = (done: boolean = false) => {
      if (!done) i++
      return `- Configuring contracts... (${i} / ${done ? i : '...'})`
    }

    //
    logUpdate(getLog())

    // Initial setup and linking
    await this.redLightDistrict.contract.setMintingGame(this.nightworkersGame.contract.address).then(e => e.wait())
    await this.candyMachine.contract.setMintingGame(this.nightworkersGame.contract.address).then(e => e.wait())
    logUpdate(getLog())

    // define coin controllers
    const mayAddAsERC20Controller = async (address: string) => {
      const isAlreadyController: boolean = await this.lolly.contract.isController(address)
      if (isAlreadyController) return
      await this.lolly.contract.addController(address).then(e => e.wait())
    }
    await mayAddAsERC20Controller(this.nightworkersGame.contract.address)
    await mayAddAsERC20Controller(this.redLightDistrict.contract.address)
    logUpdate(getLog())

    // may define backroom as invalid receiver of LOLLY
    const mayInvalidateAsERC20Receiver = async () => {
      //
      const brAddr = this.backroom.contract.address
      const lollyCtr = this.lolly.contract

      //
      const isBRAlreadyInvalidated: boolean = await lollyCtr.invalidReceiver(brAddr)
      if (isBRAlreadyInvalidated) return

      //
      await lollyCtr.defineAsInvalidReceiver(brAddr).then(e => e.wait())
    }
    await mayInvalidateAsERC20Receiver()
    logUpdate(getLog())

    // may unpause claim + unstake + staking of NFTs
    if (params.allowWorkingAndSneaking) {
      await this.redLightDistrict.contract.doUnpause().then(e => e.wait())
      await this.redLightDistrict.contract.allowStaking(true).then(e => e.wait())
      logUpdate(getLog())
    }

    // may public launch ASAP
    if (params.publicLaunch) {
      await this.nightworkersGame.contract.declarePublicLaunch().then(e => e.wait())
    }

    //
    logUpdate(getLog(true))
    logUpdate.done()
  }

  /**
   * push NFT assets to contract
   * @param deployWithEmptyData if testing, do not upload NFT files on-chain but only metadata, save a lot of gas
   */
  async uploadAllAssets (deployWithEmptyData?: boolean) {
    // get deployer signer
    const [deployer] = await ethers.getSigners()
    const balanceBeforeDeploy = await deployer.getBalance()

    //
    let i = 0
    const getLog = () => `- Uploading assets... (${i} / ${this.nftAssets.length})`
    logUpdate(getLog())

    //
    for (const e of this.nftAssets) {
      //
      await this.candyMachine.contract.uploadTraits(
        e.isHooker,
        e.traitTypeIndex,
        e.assetsIndices,
        e.traits.map(i => [
          i.assetName,
          deployWithEmptyData ? '' : i.assetData.toString('base64')
        ])
      ).then(e => e.wait())

      //
      i++

      //
      logUpdate(getLog())
    }

    //
    logUpdate.done()

    // calculate price
    const balanceAfterDeploy = await deployer.getBalance()
    const deploymentCost = formatEther(balanceBeforeDeploy.sub(balanceAfterDeploy))
    console.log(`>> Assets upload cost : ${deploymentCost} ETH <<`)
  }
}
