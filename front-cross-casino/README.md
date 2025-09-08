# NightWorkersLabs | Cross-Chain Games App

NextJS based-app for NightWorkers DAO Web3 Games. Needs 

## Running the project locally
Using `Visual Studio Code` + `Google Chrome` as the default IDE + debug browser combo is highly recommended.

### Prerequisites
- Docker (or equivalent) MUST be installed and running (https://docs.docker.com/get-docker/)
- NodeJS v22+ MUST be installed (https://nodejs.org/en/download/)

### Getting Started
In a terminal:
- `git clone {this repo URL}` (https://git-scm.com/book/en/v2/Getting-Started-Installing-Git)
- `pnpm install` (https://classic.pnpmpkg.com/lang/en/docs/install/#mac-stable)

### How to debug locally with Hardhat (in VSCode)
Assuming you are using VSCode:
- Go in the `Execute and Debug` side-panel
- Select the `A) Full-stack` configuration from the dropdown widget
- Press `F5` or click on `Start Debugging`
- Wait a bit, multiple workers and debug terminals will spawn:
  - `1) Hardhat : Run EVM` : The temporary, debug blockchain on which the contracts will be installed
  - `1+) Nightworkers : Run Database` : The database holding balances data and stats
  - `1++) Nightworkers : Run Server` : The instance that provides the game API
  - `1++*) Nightworkers : Run Scraper` : The instance that will write into database every interesting events happening on the blockchain
  - `1++**) Nightworkers : Run Data Provider` : The instance that provides all data related API
  - `2) Next.js : Run` : The dApp web server
  - `2+) Chrome : Attach to Next.js` : user session agnostic browser that launches the dApp
- Once Chrome pops up, you are good to go (kinda).

### Considerations
- Careful when the Chrome window pops, the full dApp experience might not be fully warmed-up yet (database, events scraper, API endpoint...). have a look at `.vscode/launch.json` and check that every expected terminals and environments are spawned and fully functionnal.
- On the first launch, a debug-specific profile will be created at repository root (`.chrome-vscode-debug-profile`). You will need to install and setup Metamask once ; this configuration will be used for every debug session after that point.
- If you ever close the Chrome window that is currently debuging the dApp, you can respawn a new one by launching `2+) Chrome : Attach to Next.js` debug task. It will attach a new Chrome session to the current setup without needing to shutdown every workers and relaunch `A) Full-stack`.
- On a brand new Metamask setup, you might want to use the debug-account that is automatically shipped with 20.000 ETH to test the dApp. To install it, watch out for `1) Hardhat : Run EVM` logs in the Terminals and get the Private Key associated with `Account #0`. (https://metamask.zendesk.com/hc/en-us/articles/360015489331-How-to-import-an-account). Its balance and history will be reset everytime `A) Full-stack` is freshly invoked.
- When you use a brand new `A) Full-stack` after having successfully registered transactions on the previous EVM worker, Metamask will probably complain that your nonce are not synced. To fix that, you need to reset your account before submitting new transactions. (https://metamask.zendesk.com/hc/en-us/articles/360015488891-How-to-reset-your-account)
- Be careful with using NodeJS version 17+, can cause ECONNREFUSED when using `localhost` manual binding (mainly because of this changed behavior : https://github.com/nodejs/node/issues/40702) Please prefer the usage of explicit `127.0.0.1` when possible

## Extend the app

### Deploying on a brand new EVM-compatible (stardard Layer 2) blockchain (testnet / mainnet)
How it should go, for each new Blockchain :

1. You'll need to deploy a single casino contract on this blockchain, (verified*, if possible) :
  - Search on the official documentation of the blockchain the appropriate configuration to communicate with the targeted testnet / mainnet. You should at least find 1+ `RPC URL`, a unique `chainId` (it will be different for each testnet / mainnet), and most probably an official `block explorer URL`. YOU WILL NEED ALL OF THESE. You'll mostly working examples of these in `smartend/hardhat.config.ts`
  - *We make use of hardhat-verify plugin to automatize contract verification after a successful deployment (https://hardhat.org/hardhat-runner/plugins/nomicfoundation-hardhat-verify). To leverage this technology, you'll need to fill `smartend/hardhat.config.ts:config.etherscan` object configuration appropriately to acknoledge for the new blockchain. Depending on how "standard" the associated official block explorer is, this might or might not work, might or might not require an API key. You are on your own on this one, just take a look at existing configuration, tweek yourself, or browse the internet to find a solution. 
  - Make sure that you have / created locally a `smartend/.deploy-config.json` file. It expects an object with a single `mnemonic` property, which should contain the account mnemonic that will deploy the contract on the blockchain. IT WONT BE PUSHED TO REPO thanks to `.gitignore` configuration. For security concerns and just to be safe, make sure that Git wont try to commit this file.
    - Also make sure that you can obtain / mint some native token to allow you to deploy on the blockchain. Deploying a single contract is quite cheap, just make sure to have enough token to try and fail deployment a bunch of times, just to be safe. Cost of deployment might be around 300k gas. 
    - If you are trying to deploy on a testnet, you'll most probably will find in official documentation / on Google information about official / unofficial `faucet URL`. Once you tried any of those and you confirm it to work, please keep it in mind, you'll pass it as config for dApp configuration later on.
  - Ask any Nightworkers Project Lead (Hervé, Amphaal...) for the initial cost of the casino token, since it will be immutable later-on. You'll configure how the smart contract will behave once deployed by (temporarly) change `smartend/scripts/deploy/prod.ts` file. PLEASE DO NOT TRY TO COMMIT YOUR CHANGES ON THIS FILE !
     - `singleChipPrice` initial cost of the casino token
     - `trustedValidatorAddress` is OK by default, do not change it.
  - Update `smartend/hardhat.config.ts` file for Hardhat to acknoledge a new blockchain configuration. Pick any (id / name) you like, we'll reuse this later on, referred as `[blockhainNetworkName]`. If you also configure `smartend/hardhat.config.ts:config.etherscan.customChain`, make sure that naming is the same as `[blockhainNetworkName]`.
  - Open a terminal, now we'll attempt to deploy
    - `cd smartend`
    - `pnpm deployProd --network [blockhainNetworkName]`
    - Now wait and pray that it works. If not, ask Amphaal for help.
      - A lot of unexpected failures might lie in an inappropriate `RPC URL` used. If you can find another one, try again by changing it.
      - If automatic verification of contract is missconfigured, `pnpm deployProd` might fail halfway, after sucessfully deploying. If deployment is sucessful, YOU DO NOT NEED TO use `pnpm deployProd` again ! Prefer tweeking `smartend/scripts/deploy/verify.ts` file, then running `pnpm verifyProd` instead.
      - If deployment is sucessful, you'll find out in `pnpm deployProd` logs obviously, which will give you the newly deployed contract address. Check on block explorer that it exists. 

2. You'll need to update the app front-end configuration :
  - After sucessfully deploying on a new blockchain, `deployed.json` & `networks.json` should have been automatically updated and must be pushed.
  - For each new blockchain to handle inside the app, you'll need to propose 2 independent Pull Requests for the repos maintainer to validate :
    - In a first time, one on `smartend` repository. See this commit https://github.com/NightworkersLabs/smartend/commit/e71ef4cabe5bb3f625499ca683bac82ef40fc3a0 as testnet blockchain example.
      - must include updated `deployed.json` with the new blockchain name and contract address.
      - must include updated `hardhat.config.ts` with the new blockchain configuration done in 1.
        - may include `customChains` and/or `etherscan` additionnal configuration
    - In a second time, another one on this repository. See this commit https://github.com/NightworkersLabs/cross-casino/commit/ef6e4176ee80e40465f668cd16903168dac151cb as a testnet blockchain example.
      - must include updated `deployed.json` with the new blockchain name and contract address.
      - must include updated `networks.json` with the new blockchain configuration.
      - must include an updated `networks.more.ts` with additionnal blockchain configuration infos of the new one we want to add, gathered on step 1
      - an icon of the newly configured blockchain, stored in `public/resources/icons/bc/[blockhainNetworkName].{jpg/webp/png}`
  - Once pushed on this repo, Vercel should update the Front UI accordingly

3. You'll need to update the app back-end configuration :
  - Log on backend server using SSH
  - `cd nightworkers-stack`
  - tweek `deployed.json` (mostly the same file that the same-name one generated for `cross-casino`)
  - tweek `networks.json` (mostly the same file that the same-name  generated for `cross-casino`, might need to change RPC URL and / or add configuration for RPC limit call, seek for examples within file itself)
  - `docker compose down`
  - `docker compose up -d`
  - Make sure on Portainer that everything got back up.

### Adding a new partner into the referring system

- You will need to create a Pull Request for each new partner to add to the app.
  - Update `backlink_references.ts` with new partner information, following `BacklinkReferenceBase` interface.
  - Use a unique object key name as partner id. The App expects an image for the partner with the same name in `public/sponsors` with any of png/jpg/webp extension, please also provide one within the same PR.
  - Make sure to pick a `trackerId` between 0 and 255 for new partner, prefer using one that is not already assigned. This ID will be the one that will be bound and visible on-chain for each user buy associated with this partner.
- Commit your changes and wait for validation of your modifications of a repository admin.
- Once your PR is approved, Github+Vercel continuous deployment will automatically push your modifications to testnet / mainnet app within 5-10 minutes.
