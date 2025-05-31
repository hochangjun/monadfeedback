# Deployment Instructions

## Prerequisites
1. Have a wallet with MON tokens on Monad Testnet
2. Get your private key from your wallet

## Steps to Deploy

1. **Create .env file:**
```bash
cp env.example .env
```

2. **Add your private key to .env:**
```
PRIVATE_KEY=your_actual_private_key_without_0x_prefix
```

3. **Deploy the contract:**
```bash
npx hardhat run scripts/deploy.js --network monadTestnet
```

4. **The deployment will:**
   - Deploy the FeedbackPayment contract
   - Save contract address to `deployment.json`
   - Show you the deployed contract address

## After Deployment
The frontend will automatically use the deployed contract address from `deployment.json`.

## Test the deployment
```bash
npx hardhat console --network monadTestnet
```

Then in the console:
```javascript
const contract = await ethers.getContractAt("FeedbackPayment", "DEPLOYED_ADDRESS");
await contract.hasPaid("0xYourAddress");
``` 