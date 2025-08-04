-- CreateTable
CREATE TABLE "CasinoBank_ChipsConverted" (
    "chainId" INT4 NOT NULL,
    "block" INT4 NOT NULL,
    "bts" TIMESTAMP(3) NOT NULL,
    "grantedTo" CHAR(42) NOT NULL,
    "coinsAmount" INT4 NOT NULL,
    "convertedAmount" DECIMAL(40,0) NOT NULL,

    CONSTRAINT "CasinoBank_ChipsConverted_pkey" PRIMARY KEY ("chainId","block","grantedTo")
);
