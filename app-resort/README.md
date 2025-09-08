# NightWorkersLabs | Resort (P2E+) App

Using `Visual Studio Code` + `Google Chrome` as the default IDE + debug browser combo is highly recommended.

## Getting Started
- `docker` and `docker-compose` MUST be installed locally (https://docs.docker.com/get-docker/) to allow local database deployment and auto-configuration.
- Make sure `docker` daemon is running
- `git clone {this repo URL}` 
- `pnpm`
- Run the VSCode Tasks through the Command Palette (https://www.alphr.com/open-command-vs-code/) > `Tasks: Run Tasks`
    - `.) Fetch submodules recursively`
    - `..) pnpm install (smartend & children)`

## How to debug locally with Hardhat (in VSCode)

> :warning: **Make sure that no instance of Chrome is launched before your first attempt of debugging !** ... or you might encounter issues like "Unable to attach to browser"

- Go in the `Execute and Debug` side-panel
- Select the `A) Full-stack (hardhat)` configuration from the dropdown widget
- Press `F5` or click on `Start Debugging`
- Your prefered browser should pop up once everything is setup correctly

### Considerations
- Debugging full-stack means that multiple HTTP-based processes are to be launched in order :
    - the Hardhat Runtime Environment, alongside auto-installed contracts
    - the Trusted Validation Daemon with its auto-configured bot, which can be requested for secret hashes for Provably Fairness
    - the Next.js dApp
- Check `smartend/hardhat.config.ts` for more informations about networks configurations which will be parsed into `.env.local` file.
- Everytime we expect changes in API from the smartend, we need to :
    - Obviously synchronize all depending submodules 
    - Run a debug session through `A) Full-stack (hardhat)`
        - It will basically re-configure the frontend (eg. duplicate all required resources for the frontend to work independently from the smartend)