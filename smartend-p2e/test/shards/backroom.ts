/* eslint-disable no-unused-expressions */
import 'test/_context'

import { expect } from 'chai'

import { step } from 'mocha-steps'
import { parseEther, parseUnits } from 'ethers/lib/utils'
import { BigNumber, ContractTransaction } from 'ethers'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'

import { mineTimeWarpSecs } from 'test/_helpers'

export const backroom = () =>
  describe.only('Backroom (LOLLY > AVAX yield aggregator)', () => {
    before(async function () {
      //
      this.mintLOLLYAndDeposit = async (staker: SignerWithAddress, howMuch: BigNumber) => {
        // give LOLLY to owner
        await this.lolly.$_mint(
          staker.address,
          howMuch
        ).then(e => e.wait())

        // As Owner, increaseAllowance full deposit
        await this.lolly
          .connect(staker)
          .increaseAllowance(
            this.backroom.address,
            howMuch
          )
          .then(e => e.wait())

        // As staker, deposit <=> the owner stake his LOLLY balance
        await this.backroom
          .connect(staker)
          .deposit(howMuch)
          .then(e => e.wait())
      }
    })

    describe('Specific interactions', () => {
      before(async function () {
        // give LOLLY to owner
        await this.lolly.$_mint(
          this.users.owner.address,
          parseEther('10000')
        ).then(e => e.wait())

        //
        await this.lolly
          .connect(this.users.owner)
          .increaseAllowance(
            this.users.owner.address,
            parseEther('10000')
          )
          .then(e => e.wait())
      })

      after(async function () {
        // burn the minted tokens
        await this.lolly.$_burn(
          this.users.owner.address,
          parseEther('10000')
        ).then(e => e.wait())

        //
        await this.lolly
          .connect(this.users.owner)
          .decreaseAllowance(
            this.users.owner.address,
            parseEther('10000')
          )
          .then(e => e.wait())
      })

      it('should not be able to send LOLLY directly to backroom', async function () {
        const staker = this.users.owner
        const howMany = parseEther('10000')

        //
        await expect(
          this.lolly
            .connect(staker)
            .transfer(this.backroom.address, howMany)
        ).to.be.revertedWith('InvalidReceiver')

        //
        await expect(
          this.lolly
            .connect(staker)
            .transferFrom(staker.address, this.backroom.address, howMany)
        ).to.be.revertedWith('InvalidReceiver')
      })
    })

    describe('Basic schedule', () => {
      step('must be able to deposit with no round scheduled', async function () {
        //
        await this.mintLOLLYAndDeposit(this.users.owner, parseEther('10000'))
      })

      step('must be able to schedule a round', async function () {
        //
        const roundReward = parseEther('6')

        //
        this.roundBlock = await (
            this.backroom.scheduleRound(
              parseEther('0.1'),
              0,
              60,
              { value: roundReward }
            ) as Promise<ContractTransaction>
        )
          .then(x => x.wait())
          .then(r => r.blockNumber)

        //
        const balance = await this.backroom.provider.getBalance(this.backroom.address)
        expect(balance).to.be.eq(roundReward)
      })

      step('estimate correct rewards after 20 seconds', async function () {
        // wait 20 secs
        await mineTimeWarpSecs(21)

        //
        const er = await this.backroom.estimateRewards() as BigNumber
        expect(er).to.be.closeTo(parseEther('2'), parseUnits('1', 'gwei'))
      })

      step('should NOT be able to withdraw', async function () {
        await expect(
          this.backroom.mayClaimDoWithdraw(0)
        ).to.be.revertedWith('WithdrawForbidden')
      })

      step('should NOT be able to claim with more than staked', async function () {
        await expect(
          this.backroom.mayClaimDoWithdraw(parseEther('10000'))
        ).to.be.revertedWith('WithdrawForbidden')

        //
        await expect(
          this.backroom.mayClaimDoWithdraw(parseEther('10001'))
        ).to.be.revertedWith('WithdrawingTooMuch')
      })

      step('should be able to stake more', async function () {
        await this.mintLOLLYAndDeposit(this.users.owner, parseEther('10000'))
      })

      step('jump until end of round', async function () {
        await mineTimeWarpSecs(35)
      })

      step('prevent player who did not stake to claim any rewards', async function () {
        //
        await this.mintLOLLYAndDeposit(this.users.wl, parseEther('10000'))

        //
        await mineTimeWarpSecs(10)

        //
        const rcpt = await (
            this.backroom
              .connect(this.users.wl)
              .mayClaimDoWithdraw(parseEther('10000')) as Promise<ContractTransaction>
        ).then(e => e.wait())

        //
        const ev = rcpt.events.find(x => x.event === 'RewardsClaimed')
        expect(ev).to.be.undefined
      })

      step('should NOT be able to claim with much more than staked', async function () {
        //
        const rcpt = await (
            this.backroom.mayClaimDoWithdraw(parseEther('20000')) as Promise<ContractTransaction>
        ).then(e => e.wait())

        //
        const ev = rcpt.events.find(x => x.event === 'RewardsClaimed')
        expect(ev.args.claimed).to.be.eq(parseEther('6'))
      })
    })
  })
