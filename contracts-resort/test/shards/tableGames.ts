import "#/test/_context";

import { expect } from "chai";
import type { BigNumber } from "ethers";
import { parseEther } from "ethers/lib/utils";
import { step } from "mocha-steps";

export const tableGames = () =>
  describe("Table Games", () => {
    before(async function () {
      this.minBet = (await this.tableGames.CURRENCY_MIN_BET()) as BigNumber;
      this.maxBet = (await this.tableGames.CURRENCY_MAX_BET()) as BigNumber;
    });

    it("should have minimum bet set to .05 ETH", async function () {
      expect(this.minBet).to.be.equal(parseEther("0.05"));
    });

    it("should have maximum bet set to 1 ETH", async function () {
      expect(this.maxBet).to.be.equal(parseEther("1"));
    });

    step("should NOT be able to play without minimum funds", async function () {
      await expect(this.tableGames.flipCoin(true, [0, 0])).to.be.revertedWith(
        "minimum rolling liquidities not met",
      );
      await expect(this.tableGames.betOnGreen([0, 0])).to.be.revertedWith(
        "minimum rolling liquidities not met",
      );
      await expect(this.tableGames.betOnRed([0, 0])).to.be.revertedWith(
        "minimum rolling liquidities not met",
      );
      await expect(this.tableGames.betOnBlack([0, 0])).to.be.revertedWith(
        "minimum rolling liquidities not met",
      );
    });

    step("feeding rolling funds...", async function () {
      //
      const targetRolling =
        (await this.tableGames.MINIMUM_ROLLING()) as BigNumber;

      //
      await this.users.owner
        .sendTransaction({
          to: this.tableGames.address,
          value: targetRolling,
        })
        .then((e) => e.wait());

      //
      const rolling = await this.tableGames.provider.getBalance(
        this.tableGames.address,
      );
      expect(rolling).to.be.eq(targetRolling);
    });

    step("should NOT be able to play for free", async function () {
      await expect(this.tableGames.flipCoin(true, [0, 0])).to.be.reverted;
      await expect(this.tableGames.flipCoin(false, [0, 0])).to.be.reverted;
      await expect(this.tableGames.betOnGreen([0, 0])).to.be.reverted;
      await expect(this.tableGames.betOnRed([0, 0])).to.be.reverted;
      await expect(this.tableGames.betOnBlack([0, 0])).to.be.reverted;
    });

    step(
      "should NOT be able to play with < than minimum bet",
      async function () {
        const tx = { value: (this.minBet as BigNumber).sub(1) };
        await expect(this.tableGames.flipCoin(true, [0, 0], tx)).to.be.reverted;
        await expect(this.tableGames.flipCoin(false, [0, 0])).to.be.reverted;
        await expect(this.tableGames.betOnGreen([0, 0], tx)).to.be.reverted;
        await expect(this.tableGames.betOnRed([0, 0], tx)).to.be.reverted;
        await expect(this.tableGames.betOnBlack([0, 0], tx)).to.be.reverted;
      },
    );

    step("should be able to play with EXACTLY minimum bet", async function () {
      const tx = { value: this.minBet };
      await this.tableGames.flipCoin(true, [0, 0], tx);
      await this.tableGames.flipCoin(false, [0, 0]);
      await this.tableGames.betOnGreen([0, 0], tx);
      await this.tableGames.betOnRed([0, 0], tx);
      await this.tableGames.betOnBlack([0, 0], tx);
    });

    step("should be able to play with EXACTLY maximum bet", async function () {
      const tx = { value: this.maxBet };
      await this.tableGames.flipCoin(true, [0, 0], tx);
      await this.tableGames.flipCoin(false, [0, 0]);
      await this.tableGames.betOnGreen([0, 0], tx);
      await this.tableGames.betOnRed([0, 0], tx);
      await this.tableGames.betOnBlack([0, 0], tx);
    });

    step(
      "should NOT be able to play with > than maximum bet",
      async function () {
        const tx = { value: (this.maxBet as BigNumber).add(1) };
        await expect(this.tableGames.flipCoin(true, [0, 0], tx)).to.be.reverted;
        await expect(this.tableGames.flipCoin(false, [0, 0])).to.be.reverted;
        await expect(this.tableGames.betOnGreen([0, 0], tx)).to.be.reverted;
        await expect(this.tableGames.betOnRed([0, 0], tx)).to.be.reverted;
        await expect(this.tableGames.betOnBlack([0, 0], tx)).to.be.reverted;
      },
    );
  });
