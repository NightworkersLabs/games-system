import 'test/_context'

import { mineTimeWarpSecs } from 'test/_helpers'

import { expect } from 'chai'

export const rewardEstimation = () =>
  describe('Staking reward estimation', () => {
    before(async function () {
      //
      this.perSec = await this.redLightDistrict.SEC_LOLLY_RATE()
    })

    describe('For Hookers', () => {
      before(async function () {
        // generate hookers only
        await this.candyMachine.$_defineGenerationMode(1).then(e => e.wait())

        // mint a single hooker
        await this.mintOrderer.unchecked()

        // TODO STACK !

        this.latestMintedToken = await this.nightworkersGame.minted()
      })

      after(async function () {
        // go back to random generation
        await this.candyMachine.$_defineGenerationMode(0).then(e => e.wait())
      })

      describe('Right after minting', () => {
        function getTs () {
          return (new Date().getTime() / 1000).toFixed()
        }

        it('should have null default estimation', async function () {
          const reward = await this.redLightDistrict.estimateReward(this.latestMintedToken, 0)
          expect(reward).to.equal(0)
        })

        it('should NOT be able to give an estimation too soon', async function () {
          const reward = this.redLightDistrict.estimateReward(this.latestMintedToken, getTs())
          await expect(reward).to.be.revertedWith('invalid custom timestamp')
        })

        it('should have correct estimation with supplied timestamp when +15 secs', async function () {
          const ts = getTs() + 15 // 15 seconds from now
          const reward = await this.redLightDistrict.estimateReward(this.latestMintedToken, ts)
          expect(reward).to.not.equal(0)
        })
      })

      describe('After some time and more mints from other players', () => {
        before(async function () {
          // mine next block to move block timestamp
          this.ts = await mineTimeWarpSecs(10)

          // emulate activity on blockchain, update earnings
          await this.redLightDistrict.$_forceUpdateEarnings().then(e => e.wait())
        })

        it('should have default estimation', async function () {
          const reward = await this.redLightDistrict.estimateReward(this.latestMintedToken, 0)
          // formatEther(reward);
          expect(reward).to.not.equal(0)
        })
      })
    })

    describe('For Pumps', () => {
      before(async function () {
        // generate hookers only
        await this.candyMachine.$_defineGenerationMode(2).then(e => e.wait())

        // mint a single hooker
        await this.mintOrderer.unchecked()

        // TODO STACK !

        this.latestMintedToken = await this.nightworkersGame.minted()
      })

      after(async function () {
        // go back to random generation
        await this.candyMachine.$_defineGenerationMode(0).then(e => e.wait())
      })

      describe('Right after minting', () => {
        function getTs () {
          return (new Date().getTime() / 1000).toFixed()
        }

        it('should have null default estimation', async function () {
          const reward = await this.redLightDistrict.estimateReward(this.latestMintedToken, 0)
          expect(reward).to.equal(0)
        })

        it('should NOT be able to give an estimation too soon', async function () {
          const ts = getTs() //
          const reward = await this.redLightDistrict.estimateReward(this.latestMintedToken, ts)
          expect(reward).to.equal(0)
        })
      })

      describe('After some time and some hooker rewards staked', () => {
        it('should have default estimation')
      })
    })
  })
