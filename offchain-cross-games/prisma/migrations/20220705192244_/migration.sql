-- CreateEnum
CREATE TYPE "CoinBet" AS ENUM ('Tails', 'Heads');

-- CreateEnum
CREATE TYPE "ColorBet" AS ENUM ('Green', 'Red', 'Black');

-- CreateTable
CREATE TABLE "ChipsBalance" (
    "address" CHAR(42) NOT NULL,
    "chainId" INT4 NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tBought" INT4 NOT NULL DEFAULT 0,
    "tAirdropped" INT4 NOT NULL DEFAULT 0,
    "tWithdrawed" INT4 NOT NULL DEFAULT 0,
    "withdrawable" INT4 NOT NULL DEFAULT 0,
    "sluggish" INT4 NOT NULL DEFAULT 0,
    "playsWithoutWD" INT4 NOT NULL DEFAULT 0,

    CONSTRAINT "ChipsBalance_pkey" PRIMARY KEY ("chainId","address")
);

-- CreateTable
CREATE TABLE "CoinflipPlays" (
    "id" INT8 NOT NULL DEFAULT unique_rowid(),
    "address" CHAR(42) NOT NULL,
    "chainId" INT4 NOT NULL,
    "ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "betted" INT4 NOT NULL,
    "bettedOn" "CoinBet" NOT NULL,
    "won" INT4 NOT NULL,
    "pf" BOOL NOT NULL,

    CONSTRAINT "CoinflipPlays_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoulettePlays" (
    "id" INT8 NOT NULL DEFAULT unique_rowid(),
    "address" CHAR(42) NOT NULL,
    "chainId" INT4 NOT NULL,
    "ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "betted" INT4 NOT NULL,
    "bettedOn" "ColorBet" NOT NULL,
    "got" "ColorBet" NOT NULL,
    "gotNumber" INT2 NOT NULL,
    "won" INT4 NOT NULL,
    "pf" BOOL NOT NULL,

    CONSTRAINT "RoulettePlays_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CasinoBank_ChipsBought" (
    "block" INT4 NOT NULL,
    "chainId" INT4 NOT NULL,
    "bts" TIMESTAMP(3) NOT NULL,
    "buyer" CHAR(42) NOT NULL,
    "trackerId" INT2 NOT NULL,
    "amount" INT4 NOT NULL,
    "taxes" DECIMAL(40,0) NOT NULL,

    CONSTRAINT "CasinoBank_ChipsBought_pkey" PRIMARY KEY ("chainId","block","buyer")
);

-- CreateTable
CREATE TABLE "CasinoBank_TaxRevenueTransfered" (
    "block" INT4 NOT NULL,
    "chainId" INT4 NOT NULL,
    "bts" TIMESTAMP(3) NOT NULL,
    "receiver" CHAR(42) NOT NULL,
    "sponsorId" INT2 NOT NULL,
    "amount" DECIMAL(40,0) NOT NULL,

    CONSTRAINT "CasinoBank_TaxRevenueTransfered_pkey" PRIMARY KEY ("chainId","block","receiver")
);

-- CreateTable
CREATE TABLE "CasinoBank__sync" (
    "eventName" STRING NOT NULL,
    "chainId" INT4 NOT NULL,
    "blockCreated" INT4 NOT NULL,
    "blockSync" INT4 NOT NULL,

    CONSTRAINT "CasinoBank__sync_pkey" PRIMARY KEY ("chainId","eventName")
);

-- CreateIndex
CREATE INDEX "CasinoBank_ChipsBought_trackerId_idx" ON "CasinoBank_ChipsBought"("trackerId");

-- CreateIndex
CREATE INDEX "CasinoBank_TaxRevenueTransfered_sponsorId_idx" ON "CasinoBank_TaxRevenueTransfered"("sponsorId");
