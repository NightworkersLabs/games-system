# Night Workers © Cross Casino Smartend

## Considerations
- If you wish to deploy on mainnet / testnet, you might want to define the installer mnemo in a `.deploy-config.json` file at root project - following hardhat's `HDAccountsUserConfig` type definition (https://github.com/NomicFoundation/hardhat/blob/main/packages/hardhat-core/src/types/config.ts) - before running `pnpm deploy[scriptPrefix] --network [blockhainNetworkName]`