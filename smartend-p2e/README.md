# Night Workers © Smartend
Smart-contracts suite of the official Nightworkers Casino, P2E and NFT trading game. 
Includes EVM contracts, tests, deployment scripts and off-chain service integration.

> :information_source: As package maintainer, often run `pnpm upgrade --latest` 

## Compile contracts + unit tests
- `git clone {this repo URL}` 
- `npm install -g pnpm ethlint`
- `pnpm`
- `pnpm test`

## Deploy contracts on a local Avalanche node for testing
- Download the appropriate `avanlanchego` daemon ZIP file from https://github.com/ava-labs/avalanchego/releases
- Unzip it
- `./build/avalanchego --network-id=local --staking-enabled=false --snow-sample-size=1 --snow-quorum-size=1 --public-ip=127.0.0.1`

If you want to deploy
- `pnpm deploy:dev --network local`
- If you do not want to generate a default whitelisted address list, call `deployWLess` instead of `deploy:dev`

If you want to unit test against local node
- `pnpm test -- network local` 

## Enable gas price reporting
- uncomment `// import "hardhat-gas-reporter"` in `hardhat.config.ts`
- `pnpm test`

## Print logs on test inside smart contracts
- include inside contract to debug `import { console } from "hardhat/console.sol";`
- call `console.log(whatever)` whenever you need it
- `pnpm test`

## Multisig on local node

### Setup
- Make sure you have a local `avalanchego` node running
- Go to https://multisig.pangolin.exchange/#/wallets
- Go to `Settings`, and change `Ethereum Node` to `Custom node`
  - Once there, replace the content of the dropbox with `http://127.0.0.1:9650/ext/bc/C/rpc`
- Connect to Metamask
  - Make sure you have some AVAX on your EOA, since creation of a wallet have a cost
- Create / Restore a multisig contract, with appropriate parameters
- Copy this wallet address and feed it to the `pnpm deploy:prod --network local` script
- Run it
  - Once deployment successful, make sure to keep the logs, since it contains the addresses we need to feed the dApp for transactions delegation
- Add theses addresses into dApp's `Address Book`

### Request a multi-sig transaction
- Make sure that `hardhat-abi-exporter` has generated contracts ABI informations into the root `abi` directory.
  - If not, `pnpm compile` should produce them automatically
- In the dApp, go to `Wallet` and click on a wallet name. Then, in `Multisig transactions`, click on `Add`
- Write the contract address of which contract you wish to manipulate with the wallet
- Copy the content of the appropriate `.json` file from the `abi` into the `ABI String` dApp field
  - Ex: If we want to manipulate NightworkersGame, copy `abi/NightworkersGame.json` content
- Select in the dropdown the appropriate function you wish to call
  - You might also want to add appropriate arguments
- Pay your transaction fees
- Wait for validation of others wallet owners
- Et voilà !

## Going livenet / Fuji

### Setup
- Create Multi-sigs
  - Main Multisig : with 3 internal + 1 external members
  - Marketing Multisig
- Deploy contracts on targeted network with `pnpm deploy:prod --network {target}` 
  - Make sure the correct parameters are filled in the `scripts/deploy/prod.ts` script
    - Main Multisig address
    - Marketing Multisig address
    - Number of whitelisted addresses to generate and register
    - ...
  - Set temporarily the private key of the address which will deploy the contract in `hardhat.config.ts`, in the appropriate target field. 
    - You obviously need some ether to do so on this account
- Add $LOLLY ERC20 Contract metadata to any Dex we like
  - https://github.com/pangolindex/tokenlists, fill the .json depending on Live or Fuji target
  - ...
- With Multisig : Create Pool to determine initial pair price ratio
  - AVAX / LOLLY
- With Multisig : Push whitelisted users with `nightworkersGame.grantManyWhitelistTickets()`
- With Multisig : Allow miting for whitelisted by calling `nightworkersGame.declareWhitelistPeriod()`
- Once Liquidity cap reached, create a LOLLY/wAVAX pool
  - With Multisig : transfer liquidity from main game contract to pool
    - By calling `nightworkersGame.withdraw()` first
- With Multisig : Allow claim by calling `redLightDistrict.doUnpause()`
- With Multisig : Allow public minting by calling `nightworkersGame.declarePublicLaunch()`

### Advices
- Feed the Backroom wAVAX pool once in a while 
