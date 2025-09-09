import "#/test/_context";

import { expect, use } from "chai";
import type { BigNumber } from "ethers";
import { parseEther, randomBytes } from "ethers/lib/utils";
import { ethers } from "hardhat";
import { step } from "mocha-steps";

import { TVLogger } from "@nightworkerslabs/offchain-resort/src/lib/params";
import { SecretsStorage } from "@nightworkerslabs/offchain-resort/src/lib/provably-fair/secrets-provider";

import TVDInstance from "#/scripts/deploy/framework/TVDHelper";
import { MintOrderer } from "#/test/_helpers";
import { backroom } from "#/test/shards/backroom";
import { lottery } from "#/test/shards/lottery";
import { mintPrices } from "#/test/shards/mintPrices";
import { redLightDistrict } from "#/test/shards/redLightDistrict";
import { rewardEstimation } from "#/test/shards/rewardEstimation";
import { royalties } from "#/test/shards/royalties";
import { tableGames } from "#/test/shards/tableGames";
import { tokenMetadata } from "#/test/shards/tokenMetadata";

// use default BigNumber
// eslint-disable-next-line @typescript-eslint/no-require-imports
use(require("chai-bignumber")());

export const testGame = () =>
  describe("Game itself", () => {
    //
    before(async function () {
      // deploy...
      await this.nwContext.deployAndIgnite({});

      // rebind to helpers
      this.lolly = this.nwContext.lolly.contract;
      this.nightworkersGame = this.nwContext.nightworkersGame.contract;
      this.redLightDistrict = this.nwContext.redLightDistrict.contract;
      this.candyMachine = this.nwContext.candyMachine.contract;
      this.lottery = this.nwContext.lottery.contract;
      this.tableGames = this.nwContext.tableGames.contract;
      this.backroom = this.nwContext.backroom.contract;

      // start validator daemon
      TVLogger.mustLog = false;
      this.secretStorage = new SecretsStorage();
      this.tvd = await TVDInstance.fromContracts(
        this.nwContext,
        this.secretStorage,
        await this.nightworkersGame.provider.getBlockNumber(),
      );
      this.tvdJob = this.tvd.exec();

      //
      const [owner, wl] = await ethers.getSigners();
      this.users = {
        owner,
        wl,
        broke: ethers.Wallet.createRandom().connect(ethers.provider),
      };

      // define the default expected mint price
      this.payableMintPrice = {
        base: await this.nightworkersGame.getBasePayableMintPrice(),
        wl: await this.nightworkersGame.getWhitelistedPayableMintPrice(),
        scarce: await this.nightworkersGame.getScarcePayableMintPrice(),
      };

      // mint helper
      this.mintOrderer = new MintOrderer(
        this.users.owner,
        this.nightworkersGame,
        this.tvd,
        this.payableMintPrice,
      );
    });

    after(async function () {
      if (this.tvd == null) return;

      // stop the daemon
      this.tvd.stop();

      // await for the job to end
      await this.tvdJob;
    });

    //
    // ONCHAIN CASINO
    //

    describe("On-chain Casino", function () {
      tableGames();
      lottery();
    });

    describe("Default state right after deployment", () => {
      it("should have correct max token pool (50k)", async function () {
        const maxToken = (await this.nightworkersGame.MAX_TOKENS()) as number;
        expect(maxToken).to.equals(50_000);
      });

      it("should have correct initial payable token pool (10K)", async function () {
        const payableToken =
          (await this.nightworkersGame.PAYABLE_TOKENS_UNTIL()) as number;
        expect(payableToken).to.equals(10_000);
      });

      it("should have correct $LOLLY base price (20k)", async function () {
        const payableToken =
          (await this.nightworkersGame.MINT_BASE_PRICE()) as BigNumber;
        expect(payableToken).to.equals(parseEther("20000"));
      });

      it("should give at which number of Gen 0 token a token starts to be scarce (9k - +20% price)", async function () {
        const scarceAt =
          (await this.nightworkersGame.PAYABLE_TOKENS_SCARCE_AT()) as number;
        expect(scarceAt).to.equals(9000);
      });

      it("should NOT allow staking", async function () {
        const isAllowed =
          (await this.redLightDistrict.isStakingAllowed()) as boolean;
        expect(isAllowed).to.be.false;
      });

      it("should have no token minted", async function () {
        const minted = (await this.nightworkersGame.minted()) as number;
        expect(minted).to.equals(0);
      });

      it("should have possible notoriety score for Pimp between appropriate values", async function () {
        const minPimpNotoriety =
          (await this.nightworkersGame.MIN_PIMP_NOTORIETY_SCORE()) as number;
        const maxPimpNotoriety =
          (await this.nightworkersGame.MAX_PIMP_NOTORIETY_SCORE()) as number;
        expect(minPimpNotoriety).to.equals(5);
        expect(maxPimpNotoriety).to.equals(8);
      });

      it("should have a mint-at-once security defined (30 max mint per call)", async function () {
        const maxMint = (await this.nightworkersGame.MAX_MINT()) as number;
        expect(maxMint).to.equals(30);
      });

      //
      mintPrices();

      //
      describe("Changing payable Price (Gen0, AVAX)", () => {
        before(async function () {
          //
          this.newPrice = parseEther("1");

          //
          await this.nightworkersGame
            .changeBasePayableMintPrice(this.newPrice)
            .then((tr) => tr.wait());
        });
        after(async function () {
          await this.nightworkersGame
            .changeBasePayableMintPrice(this.payableMintPrice.base)
            .then((tr) => tr.wait());
        });

        //
        it("price should have effectively changed", async function () {
          const basePrice =
            (await this.nightworkersGame.getBasePayableMintPrice()) as BigNumber;
          expect(basePrice).to.equals(this.newPrice as BigNumber);
        });

        it("should get correct whitelisted price (-20% on the newly-set price)", async function () {
          const payableMintPrice =
            await this.nightworkersGame.getWhitelistedPayableMintPrice();
          const newWLPrice = (this.newPrice as BigNumber).mul(80).div(100);
          expect(payableMintPrice).to.eq(newWLPrice);
        });

        it('should get correct "scarce" price (+20% on the newly-set price)', async function () {
          const payableMintPrice =
            await this.nightworkersGame.getScarcePayableMintPrice();
          const newScarcePrice = (this.newPrice as BigNumber).mul(120).div(100);
          expect(payableMintPrice).to.eq(newScarcePrice);
        });
      });
    });

    backroom();

    describe("When assets are imported", () => {
      before(async function () {
        await this.nwContext.uploadAllAssets();
        this.getRandomUInt16 = () =>
          randomBytes(2).reduce((a, b) => (a << 8) + b);
      });

      it("should not pick a trait index above uploaded assets limit (TraitPack x Assets)", async function () {
        //
        for (const { isHooker, traitTypeIndex, assetsIndices } of this.nwContext
          .nftAssets) {
          //
          const howManyAssets = assetsIndices.length;

          //
          const tries = Array.from({ length: howManyAssets }).map(
            () =>
              this.candyMachine.$_randomPickTrait(
                this.getRandomUInt16(),
                isHooker,
                traitTypeIndex,
              ) as Promise<number>,
          );

          //
          await Promise.all(tries);

          //
          tries.forEach((r) => {
            expect(r).to.below(howManyAssets);
          });
        }
      });

      describe("Whitelist...", () => {
        describe("Before being in whitelist mode", () => {
          describe("As Non WL", () => {
            it("should NOT be whitelisted by default", async function () {
              const wlLeft =
                (await this.nightworkersGame.usableWhitelistTicketsLeft()) as number;
              expect(wlLeft).to.be.eq(0);
            });
          });

          describe("As WL", () => {
            step("inserting as WL with 5 tickets", async function () {
              //
              await this.nightworkersGame
                .grantManyWhitelistTickets([this.users.wl.address], 5)
                .then((tr) => tr.wait());
            });

            step(
              "should have correct initial buyable token count (5)",
              async function () {
                //
                const howManyTickets = (await this.nightworkersGame
                  .connect(this.users.wl)
                  .usableWhitelistTicketsLeft()) as number;

                //
                expect(howManyTickets).to.equals(5);
              },
            );
          });
        });

        describe("When being in whitelist mode", () => {
          before(async function () {
            await this.nightworkersGame
              .declareWhitelistPeriod()
              .then((e) => e.wait());
          });

          describe("As Whitelisted", () => {
            it("should be able to get the conditionally deduced AVAX price as WL", async function () {
              //
              const payableMintPrice = (await this.nightworkersGame
                .connect(this.users.wl)
                .estimatePayableMintPrice()) as BigNumber;

              //
              expect(payableMintPrice).to.be.equal(this.payableMintPrice.wl);
            });

            step(
              "whitelisted address should be able to mint 1 immediately",
              async function () {
                await this.mintOrderer.checked({
                  signer: this.users.wl,
                  amount: "wl",
                });
              },
            );

            step(
              "should be able to mint the 4 tokens remaining",
              async function () {
                await this.mintOrderer.checked({
                  signer: this.users.wl,
                  amount: "wl",
                  howMany: 4,
                });
              },
            );

            step(
              "should NOT be able to mint after reaching the 5 tokens minting limit",
              async function () {
                await expect(
                  this.mintOrderer.raw({ signer: this.users.wl, amount: "wl" }),
                ).to.be.revertedWith("trying to mint too much wl tokens");
              },
            );
          });

          describe("As Non-Whitelisted", () => {
            it("should be able to get the conditionally deduced AVAX price", async function () {
              expect(
                await this.nightworkersGame.estimatePayableMintPrice(),
              ).not.to.be.equal(this.payableMintPrice.wl);
            });

            it("should NOT be able to mint any tokens", async function () {
              await expect(
                this.mintOrderer.raw({ amount: "wl" }),
              ).to.be.revertedWith("trying to mint too much wl tokens");
            });
          });
        });
      });

      describe("When game is in public mode", () => {
        before(async function () {
          // open classically for launch
          await this.nightworkersGame
            .declarePublicLaunch()
            .then((e) => e.wait());
        });

        it("should allow 1 mint", async function () {
          //
          const recap = await this.mintOrderer.checked();

          //
          expect(
            await this.nightworkersGame.ownerOf(recap.lastExpectedTokenId),
          ).to.be.equal(this.users.owner.address);
        });

        describe("As Broke", () => {
          it("should NOT allow to mint if no balance", async function () {
            // TODO HOW DO WE DO THIS ?
            await expect(this.mintOrderer.raw({ signer: this.users.broke })).to
              .be.reverted;
          });
        });

        rewardEstimation();
        tokenMetadata();
        redLightDistrict();
        royalties();

        it("whitelisted discount should be disabled", async function () {
          await expect(
            this.mintOrderer.raw({ amount: "wl" }),
          ).to.be.revertedWith("invalid payment amount");
        });

        it("whitelisted address which reached his WL token limit should be able to mint again at least at NORMAL PRICE", async function () {
          await this.mintOrderer.raw({ signer: this.users.wl });
        });

        it("should NOT be able to mint more than 30 tokens at once", async function () {
          await expect(
            this.mintOrderer.raw({ howMany: 31 }),
          ).to.be.revertedWith("minting too much or too little");
        });

        describe("Pricing lifecycle", () => {
          before(async function () {
            //
            await this.lolly.addController(this.users.owner.address);

            //
            this.mintingLOLLY = async (howMuch: string) => {
              await this.lolly.mint(
                this.users.owner.address,
                parseEther(howMuch),
              );
            };

            //
            this.checkEmptyLOLLYBalance = async () => {
              await expect(
                this.lolly.balanceOf(this.users.owner.address),
              ).to.be.eq(0);
            };
          });
          after(async function () {
            await this.lolly.removeController(await this.users.owner.address);
          });

          step("Gen 0 going scarce", async function () {
            await this.nightworkersGame.$_setMinted(8_998);
          });
          step(
            "should NOT be able to acheive multiple mints if the price goes from standard to scarce",
            async function () {
              await expect(
                this.mintOrderer.raw({ howMany: 3 }),
              ).to.be.revertedWith("token price differ within tx");
            },
          );

          step("Gen 0 scarce", async function () {
            await this.nightworkersGame.$_setMinted(9_000);
          });
          step(
            "should notice a pricing go up when reaching 9/10 of Gen 0 of +20%",
            async function () {
              expect(
                (await this.nightworkersGame.estimatePayableMintPrice()) as BigNumber,
              ).to.be.equal(this.payableMintPrice.scarce);
            },
          );

          step("Before Gen 0 exhaust", async function () {
            await this.nightworkersGame.$_setMinted(9_998);
          });
          step(
            "should NOT be able to acheive multiple mints if the price goes from AVAX to $LOLLY",
            async function () {
              await expect(
                this.mintOrderer.raw({ amount: "scarce", howMany: 3 }),
              ).to.be.revertedWith("on-sale tokens soldout");
            },
          );

          step("Gen 1+ Pt. 1", async function () {
            await this.nightworkersGame.$_setMinted(10_000);
          });
          step(
            "should NOT pay in AVAX once Gen 0 is depleted",
            async function () {
              await expect(this.mintOrderer.raw()).to.be.revertedWith(
                "cannot spend AVAX on Gen 1",
              );
            },
          );
          step("should NOT be able to mint without $LOLLY", async function () {
            await this.checkEmptyLOLLYBalance();
            await expect(
              this.mintOrderer.raw({ amount: "free" }),
            ).to.be.revertedWith("not owning enough LOLLY");
          });
          step("should be able to mint with $LOLLY at 20k", async function () {
            await this.mintingLOLLY("20000");
            await this.mintOrderer.checked({ amount: "free" });
            await this.checkEmptyLOLLYBalance();
          });

          step("Gen 1+ (inbetween $LOLLY price transition)", async function () {
            await this.nightworkersGame.$_setMinted(19_999);
          });
          step(
            "should be able to mint 2 NFT with $LOLLY at 20k + 40k",
            async function () {
              await this.mintingLOLLY("60000");
              await this.mintOrderer.checked({ amount: "free", howMany: 2 });
              await this.checkEmptyLOLLYBalance();
            },
          );

          step("Gen 1+ Pt.2", async function () {
            await this.nightworkersGame.$_setMinted(20_001);
          });
          step(
            "should be able to mint 1 NFT with $LOLLY 40k",
            async function () {
              await this.mintingLOLLY("40000");
              await this.mintOrderer.checked({ amount: "free" });
              await this.checkEmptyLOLLYBalance();
            },
          );

          step("Gen 1+ Pt.3", async function () {
            await this.nightworkersGame.$_setMinted(40_000);
          });
          step(
            "should be able to mint 1 NFT with $LOLLY 60k",
            async function () {
              await this.mintingLOLLY("60000");
              await this.mintOrderer.checked({ amount: "free" });
              await this.checkEmptyLOLLYBalance();
            },
          );

          step("DEPLETED", async function () {
            await this.nightworkersGame.$_setMinted(50_000);
          });
          step(
            "should NOT be able to mint once limit is reached",
            async function () {
              await expect(this.mintOrderer.raw()).to.be.revertedWith(
                "not enough tokens left",
              );
            },
          );
        });
      });
    });
  });
