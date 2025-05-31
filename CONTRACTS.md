# Smart Contract Development

The smart contract dependencies are kept separate from the main frontend app to avoid deployment conflicts.

## Setup for Smart Contract Development

1. **Install contract dependencies:**
   ```bash
   cp hardhat-package.json package-contracts.json
   npm install --prefix . --package-lock-only --package-lock=package-contracts-lock.json --production=false -f hardhat-package.json
   ```

2. **Or manually install:**
   ```bash
   npm install --save-dev @nomicfoundation/hardhat-toolbox@^5.0.0 @nomiclabs/hardhat-ethers@^2.2.3 hardhat@^2.24.1
   ```

3. **Deploy contract:**
   ```bash
   npx hardhat run scripts/deploy.js --network monadTestnet
   ```

4. **Interact with contract:**
   ```bash
   npx hardhat console --network monadTestnet
   ```

## Current Deployed Contract

- **Address:** `0x4610c9df4d3add1960b465138eb75183ba734381`
- **Network:** Monad Testnet
- **Cost:** 5 MON per feedback submission

## Frontend Integration

The frontend (`src/lib/contract.ts`) uses the deployed contract address and doesn't need the Hardhat dependencies for production builds. 