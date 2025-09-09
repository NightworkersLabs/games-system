import "#/test/_context";

import { expect } from "chai";
import type { BigNumber, ContractTransaction } from "ethers";
import { parseEther } from "ethers/lib/utils";

export const lottery = () =>
  describe("Lottery", () => {
    describe("When the lottery is paused", () => {
      it("should NOT be able to buy tickets", async function () {
        await expect(this.lottery.buyTickets([0, 0])).to.be.revertedWith(
          "Pausable: paused",
        );
      });
    });

    describe("When the lottery is active", () => {
      before(async function () {
        await this.lottery.doUnpause().then((e) => e.wait());
        this.ticketPrice = (await this.lottery.ticketCost()) as BigNumber;
      });

      it("should have correct ticket price (0.05 ETH)", async function () {
        expect(this.ticketPrice).to.be.equal(parseEther("0.05"));
      });

      it("should NOT be able to buy a ticket without funds", async function () {
        await expect(this.lottery.buyTickets([0, 0])).to.be.revertedWith(
          "incorrect expected price",
        );
      });

      it("should NOT be able to buy a ticket with incorrect funds", async function () {
        //
        await expect(
          this.lottery.buyTickets([0, 0], {
            value: (this.ticketPrice as BigNumber).mul(9).add(1),
          }),
        ).to.be.revertedWith("incorrect expected price");

        //
        await expect(
          this.lottery.buyTickets([0, 0], {
            value: (this.ticketPrice as BigNumber).mul(11).sub(1),
          }),
        ).to.be.revertedWith("incorrect expected price");
      });

      it("should not ba able to buy more than 255 tickets by tx", async function () {
        await expect(
          this.lottery.buyTickets([0, 0], {
            value: this.ticketPrice.mul(256),
          }),
        ).to.be.reverted;
      });

      it("should be able to buy a ticket otherwise", async function () {
        await this.lottery.buyTickets([0, 0], {
          value: this.ticketPrice,
        });
      });

      it("should be able to end the lottery", async function () {
        const tx =
          await (this.lottery.doPause() as Promise<ContractTransaction>);
        const rcpt = await tx.wait();
        await this.tvd.injectAndWait(rcpt);
      });

      it("should be able to restart with the same ruleset", async function () {
        // unpause
        const tx =
          await (this.lottery.doUnpause() as Promise<ContractTransaction>);
        await tx.wait();

        //
        expect(await this.lottery.ticketCost()).to.be.equal(this.ticketPrice);
      });

      it("should pick 10 winner or the number of player if it's below", async function () {
        await this.lottery.buyTickets([0, 0], {
          value: (this.ticketPrice as BigNumber).mul(100),
        });
        const tx =
          await (this.lottery.doPause() as Promise<ContractTransaction>);
        const events = await this.tvd.injectAndWait(await tx.wait());

        const [{ args: eventArgs }] = events.filter(
          (x) => x.event === "WinnersPicked",
        );
        expect(eventArgs.winners.length).to.be.eq(10);

        await this.lottery.doUnpause().then((e) => e.wait());
      });
      // todo test with 10 wallets and more

      it("should allow to redefine the ruleset immediately", async function () {
        const nexRuleset = {
          ticketCost: parseEther("0.03"),
          lotteryDuration: 48 * 3600, // time in sec
          maximumWinners: 10,
          newWinnerEveryXPartakers: 10,
        };
        await this.lottery
          .defineNextRuleset(nexRuleset, true)
          .then((e) => e.wait());
        expect(await this.lottery.ticketCost()).to.be.equal(parseEther("0.03"));
      });

      it("should allow to redefine the ruleset for the next game", async function () {
        const nexRuleset = {
          ticketCost: parseEther("0.05"),
          lotteryDuration: 48 * 3600, // time in sec
          maximumWinners: 10,
          newWinnerEveryXPartakers: 10,
        };

        await this.lottery
          .defineNextRuleset(nexRuleset, false)
          .then((e) => e.wait());
        expect(await this.lottery.ticketCost()).to.be.equal(parseEther("0.03"));
        await this.lottery
          .defineNextRuleset(nexRuleset, true)
          .then((e) => e.wait());
        expect(await this.lottery.ticketCost()).to.be.equal(parseEther("0.05"));
      });
    });

    // TODO MORE TESTS
  });
