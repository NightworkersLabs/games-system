/* eslint-disable no-unused-expressions */
import 'test/_context'

import { expect } from 'chai'
import { step } from 'mocha-steps'

import { mineTimeWarpSecs } from 'test/_helpers'
import { BigNumber, ContractReceipt, Event } from 'ethers'
import { formatEther, parseEther, parseUnits } from 'ethers/lib/utils'

export const redLightDistrict = () =>
  describe('Red Light District', () => {
    before(async function () {
      //
      this.oneDay = 60 * 60 * 24
      const secsHookerEarnings = await this.redLightDistrict.SEC_LOLLY_RATE() as BigNumber
      this.dailyEarnings = secsHookerEarnings.mul(this.oneDay)

      //
      await this.redLightDistrict.allowStaking(true).then(e => e.wait())
      await this.redLightDistrict.doUnpause().then(e => e.wait())

      // generate 2 hookers
      await this.candyMachine.$_defineGenerationMode(1).then(e => e.wait())
      await this.mintOrderer.unchecked({ howMany: 2 })
      let latest = await this.nightworkersGame.minted() as number
      this.hookers = [
        latest - 1,
        latest
      ]

      // generate 2 pimps
      await this.candyMachine.$_defineGenerationMode(2).then(e => e.wait())
      await this.mintOrderer.unchecked({ howMany: 2 })
      latest = await this.nightworkersGame.minted() as number
      this.pimps = [
        latest - 1,
        latest
      ]

      //
      await this.candyMachine.$_defineGenerationMode(0).then(e => e.wait())
    })

    describe('Scenario n°1: Stake 1 token, and unstake ASAP (no preleminary gains staked)', () => {
      describe('Hooker', () => {
        step('should be able to stake', async function () {
          await this.redLightDistrict
            .putManyToWork([this.hookers[0]])
            .then(e => e.wait())
        })

        step('should NOT be able to stake with incorrect claim tax', async function () {
          // no tax
          await expect(
            this.redLightDistrict.unstakeMany([this.hookers[0]], [0, 0])
          ).to.be.revertedWith('InvalidClaimTaxAmount')

          // too much tax
          await expect(
            this.redLightDistrict.unstakeMany([this.hookers[0]], [0, 0], {
              value: await this.redLightDistrict.getClaimTax(2)
            })
          ).to.be.revertedWith('InvalidClaimTaxAmount')
        })

        step('should NOT be able to unstake ASAP', async function () {
          //
          await expect(
            this.redLightDistrict.unstakeMany([this.hookers[0]], [0, 0], {
              value: await this.redLightDistrict.getClaimTax(1)
            })
          ).to.be.revertedWith('HookerStillVesting')
        })

        step('Warp 1 day, still should NOT be able to unstake', async function () {
          // mine next block to move block timestamp to the next day
          await mineTimeWarpSecs(this.oneDay)

          //
          await expect(
            this.redLightDistrict.unstakeMany([this.hookers[0]], [0, 0], {
              value: await this.redLightDistrict.getClaimTax(1)
            })
          ).to.be.revertedWith('HookerStillVesting')
        })

        step('should be able to unstake after 2 days (maybe with gains)', async function () {
          // mine next block to move block timestamp to the next 2 days
          await mineTimeWarpSecs(this.oneDay)

          //
          const rcpt: ContractReceipt = await this.redLightDistrict
            .unstakeMany([this.hookers[0]], [0, 0], {
              value: await this.redLightDistrict.getClaimTax(1)
            })
            .then(e => e.wait())
          const [{ args }] = await this.tvd.injectAndWait(rcpt)

          //
          const [amountWon] = args.givenAmounts as BigNumber[]
          expect(amountWon).to.not.be.null
          if (!amountWon.isZero()) {
            expect(amountWon).to.be.closeTo(parseEther('20000'), parseUnits('1', 'gwei'))
          }
        })
      })

      describe('Pimp', () => {
        step('should be able to stake', async function () {
          await this.redLightDistrict
            .putManyToWork([this.pimps[0]])
            .then(e => e.wait())
        })

        step('should NOT be able to stake with incorrect claim tax', async function () {
          // no tax
          await expect(
            this.redLightDistrict
              .unstakeMany([this.pimps[0]], [0, 0])
          ).to.be.revertedWith('InvalidClaimTaxAmount')

          // too much tax
          await expect(
            this.redLightDistrict
              .unstakeMany([this.pimps[0]], [0, 0], {
                value: await this.redLightDistrict.getClaimTax(2)
              })
          ).to.be.revertedWith('InvalidClaimTaxAmount')
        })

        step('should be able to claim instantly (maybe with gains of previously)', async function () {
          //
          const unaccounted = await this.redLightDistrict.unaccountedRewards() as BigNumber

          //
          const rcpt: ContractReceipt = await this.redLightDistrict
            .claimMany([this.pimps[0]], [0, 0], {
              value: await this.redLightDistrict.getClaimTax(1)
            })
            .then(e => e.wait())

          //
          expectEarnedFromEvts(rcpt.events, [{
            tokenId: this.pimps[0],
            exepectedEther: unaccounted.isZero() ? '0' : '2000'
          }])

          //
          const newUnaccounted = await this.redLightDistrict.unaccountedRewards() as BigNumber
          expect(newUnaccounted).to.be.eq(BigNumber.from(0))
        })

        step('should be able to unstake instantly (without gains)', async function () {
          //
          const rcpt: ContractReceipt = await this.redLightDistrict
            .unstakeMany([this.pimps[0]], [0, 0], {
              value: await this.redLightDistrict.getClaimTax(1)
            })
            .then(e => e.wait())

          //
          expectEarnedFromEvts(rcpt.events, [{
            tokenId: this.pimps[0],
            exepectedEther: '0'
          }])
        })
      })
    })

    describe('Scenario n°2: staking hookers, claiming gains, staking pimps, claiming gains', async function () {
      step('should be able to stake hooker then claim gains 1 days after', async function () {
        //
        await this.redLightDistrict
          .putManyToWork([this.hookers[0]])
          .then(e => e.wait())

        //
        await mineTimeWarpSecs(this.oneDay)

        //
        const rcpt: ContractReceipt = await this.redLightDistrict
          .claimMany([this.hookers[0]], [0, 0], {
            value: await this.redLightDistrict.getClaimTax(1)
          })
          .then(e => e.wait())

        //
        this.hookerEarned = rcpt.events.filter(x => x.event === 'TokenClaimed')[0].args.earned as BigNumber
        const expectedWinnings = (this.dailyEarnings as BigNumber).mul(80).div(100)
        expect(this.hookerEarned).to.be.closeTo(expectedWinnings, parseEther('1'))

        //
        expectEarnedFromEvts(rcpt.events, [{
          tokenId: this.hookers[0],
          exepectedEther: '0'
        }])
      })

      step('should be able to stake pimp, then claim all that was waiting in the pot', async function () {
        //
        await this.redLightDistrict
          .putManyToWork([this.pimps[0]])
          .then(e => e.wait())

        //
        await mineTimeWarpSecs(this.oneDay)

        //
        const balanceBefore = await this.lolly.balanceOf(this.users.owner.address)

        //
        await this.redLightDistrict
          .claimMany([this.pimps[0]], [0, 0], {
            value: await this.redLightDistrict.getClaimTax(1)
          })
          .then(e => e.wait())

        //
        const balanceAfter = await this.lolly.balanceOf(this.users.owner.address)

        //
        const pimpWon = (balanceAfter as BigNumber).sub(balanceBefore as BigNumber)
        const expectedPimpEarnings = (this.hookerEarned as BigNumber).div(4)

        //
        expect(expectedPimpEarnings).to.be.closeTo(pimpWon, parseEther('1'))
      })

      step('should be able to claim gains-less, then unstake gains-less', async function () {
        //
        const balanceBefore = await this.lolly.balanceOf(this.users.owner.address)

        //
        await this.redLightDistrict
          .claimMany([this.pimps[0]], [0, 0], {
            value: await this.redLightDistrict.getClaimTax(1)
          })
          .then(e => e.wait())

        //
        const balanceAfter = await this.lolly.balanceOf(this.users.owner.address)

        //
        expect(balanceAfter).to.be.eq(balanceBefore)

        //
        await this.redLightDistrict
          .unstakeMany([this.pimps[0]], [0, 0], {
            value: await this.redLightDistrict.getClaimTax(1)
          })
          .then(e => e.wait())

        //
        const balanceAfter2 = await this.lolly.balanceOf(this.users.owner.address)

        //
        expect(balanceAfter).to.be.eq(balanceAfter2)
      })
    })

    describe('Scenario n°3: moving pimps', async function () {
      step('should be able to stake 1x pimp + 1x hooker', async function () {
        //
        await this.redLightDistrict
          .putManyToWork([this.pimps[0], this.hookers[1]])
          .then(e => e.wait())
      })

      step('should be able to claim both after 1 day, for full rewards', async function () {
        //
        await mineTimeWarpSecs(this.oneDay)

        //
        const rcpt: ContractReceipt = await this.redLightDistrict
          .claimMany([this.pimps[0], this.hookers[1]], [0, 0], {
            value: await this.redLightDistrict.getClaimTax(2)
          })
          .then(e => e.wait())

        //
        expectEarnedFromEvts(rcpt.events, [{
          tokenId: this.pimps[0],
          exepectedEther: '2000'
        }, {
          tokenId: this.hookers[1],
          exepectedEther: '8000'
        }])
      })

      step('wait 1 day, claim hooker, stake +1x pimp : the older should get the reward, not the newer', async function () {
        // TODO may throw on specific configuration, handle it

        //
        await mineTimeWarpSecs(this.oneDay)

        //
        await this.redLightDistrict
          .claimMany([this.hookers[1]], [0, 0], {
            value: await this.redLightDistrict.getClaimTax(1)
          })
          .then(e => e.wait())

        //
        await this.redLightDistrict
          .putManyToWork([this.pimps[1]])
          .then(e => e.wait())

        const rcpt: ContractReceipt = await this.redLightDistrict
          .claimMany([this.pimps[0], this.pimps[1]], [0, 0], {
            value: await this.redLightDistrict.getClaimTax(2)
          })
          .then(e => e.wait())

        //
        expectEarnedFromEvts(rcpt.events, [{
          tokenId: this.pimps[0],
          exepectedEther: '2000'
        }, {
          tokenId: this.pimps[1],
          exepectedEther: '0'
        }])
      })

      step('wait 1 day, claim hooker + both pimps, both pimps should gain the same thing', async function () {
        //
        await mineTimeWarpSecs(this.oneDay)

        //
        const rcpt: ContractReceipt = await this.redLightDistrict
          .claimMany([this.pimps[0], this.pimps[1], this.hookers[1]], [0, 0], {
            value: await this.redLightDistrict.getClaimTax(3)
          })
          .then(e => e.wait())

        //
        expectEarnedFromEvts(rcpt.events, [{
          tokenId: this.hookers[1],
          exepectedEther: '8000'
        }, {
          tokenId: this.pimps[0],
          exepectedEther: '1000'
        }, {
          tokenId: this.pimps[1],
          exepectedEther: '1000'
        }])
      })

      step('wait 2x1 day, claim hooker each day, claim pimp 1 day 1, claim both pimps day 2: pimp 2 should gain 2 days of rewards', async function () {
        //
        await mineTimeWarpSecs(this.oneDay)

        //
        let rcpt: ContractReceipt = await this.redLightDistrict
          .claimMany([this.pimps[0], this.hookers[1]], [0, 0], {
            value: await this.redLightDistrict.getClaimTax(2)
          })
          .then(e => e.wait())

        //
        expectEarnedFromEvts(rcpt.events, [{
          tokenId: this.hookers[1],
          exepectedEther: '8000'
        }, {
          tokenId: this.pimps[0],
          exepectedEther: '1000'
        }])

        //
        await mineTimeWarpSecs(this.oneDay)

        //
        rcpt = await this.redLightDistrict
          .claimMany([this.pimps[0], this.pimps[1], this.hookers[1]], [0, 0], {
            value: await this.redLightDistrict.getClaimTax(3)
          })
          .then(e => e.wait())

        //
        expectEarnedFromEvts(rcpt.events, [{
          tokenId: this.hookers[1],
          exepectedEther: '8000'
        }, {
          tokenId: this.pimps[0],
          exepectedEther: '1000'
        }, {
          tokenId: this.pimps[1],
          exepectedEther: '2000'
        }])
      })
    })
  })

// HELPER
function expectEarnedFromEvts (events: Event[], config: { tokenId: number, exepectedEther: string | BigNumber }[]) {
  config.forEach(({ tokenId, exepectedEther }) => {
    //
    const ev = events.find(x => x.args.tokenId === tokenId && x.event === 'TokenClaimed')
    expect(ev).to.not.be.null

    //
    console.log(formatEther(ev.args.earned))

    //
    expect(ev.args.earned).to.be.closeTo(
      typeof exepectedEther === 'string' ? parseEther(exepectedEther) : exepectedEther,
      parseUnits('1', 'gwei')
    )
  })
}
