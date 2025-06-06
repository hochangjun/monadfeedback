# Monad Feedback

A feedback collection platform for Monad Testnet applications with smart contract-based payment verification to prevent spam.

> **Note:** This project is forked from [mega-feedback](https://github.com/mega-feedback/mega-feedback) and adapted for the Monad ecosystem.

## Features

- 🌐 **Monad Testnet Integration** - Built specifically for Monad blockchain
- 🔗 **Wallet Authentication** - Privy-powered wallet connection
- 💰 **Smart Contract Payment** - 1.1 MON payment required to submit feedback
- 🎨 **Modern UI** - Beautiful dark/light mode interface with purple theme
- 📱 **Responsive Design** - Works on desktop and mobile
- 📊 **Feedback History** - View all your submitted feedback
- 🔒 **Anonymous Feedback** - No personal information required

## Tech Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS
- **Authentication**: Privy (wallet-only login)
- **Blockchain**: Monad Testnet (Chain ID: 10143)
- **Database**: Neon PostgreSQL (serverless PostgreSQL)
- **Smart Contracts**: Hardhat, Solidity ^0.8.13
- **Wallet Integration**: Wagmi, Viem

## Quick Start

### 1. Clone and Install
```bash
git clone https://github.com/hochangjun/monadfeedback.git
cd monadfeedback
npm install
```

### 2. Environment Setup
```bash
cp env.example .env
# Add your private key to .env for contract deployment
```

### 3. Deploy Smart Contract
```bash
npm run deploy:contract
```

### 4. Start Development Server
```bash
npm run dev
```

Visit `http://localhost:3000` to see the app!

## Smart Contract

The feedback system uses a simple smart contract deployed on Monad Testnet:

```solidity
contract FeedbackPayment {
    mapping(address => bool) public hasPaid;
    
    function pay() external payable {
        require(msg.value >= 1.1 ether, "Insufficient payment");
        hasPaid[msg.sender] = true;
    }
}
```

### Contract Features
- Requires exactly 1.1 MON payment
- Tracks payment status per address
- Owner can withdraw collected funds
- Prevents spam through economic incentive

## Project Structure

```
monadfeedback/
├── src/
│   ├── app/                 # Next.js app router
│   ├── components/          # React components
│   │   ├── ui/             # UI primitives
│   │   ├── feedback-form.tsx
│   │   ├── feedback-history.tsx
│   │   └── header.tsx
│   └── lib/                # Utilities
│       ├── config.ts       # App configuration
│       └── contract.ts     # Smart contract interaction
├── contracts/              # Solidity contracts
├── scripts/               # Deployment scripts
└── hardhat.config.js      # Hardhat configuration
```

## Configuration

### Monad Testnet Settings
- **Chain ID**: 10143
- **RPC URL**: https://testnet-rpc.monad.xyz
- **Native Token**: MON

### Feedback Form Fields
- Project Name (required)
- Features Tried (required)
- What Worked Well
- What Didn't Work
- Suggested Improvements
- Rating (1-5)
- Additional Comments

## Deployment

### Contract Deployment
1. Ensure you have MON tokens for gas fees
2. Add your private key to `.env`
3. Run deployment:
```bash
npm run deploy:contract
```

### Frontend Deployment
Deploy to Vercel, Netlify, or any static hosting:
```bash
npm run build
```

## Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run deploy:contract` - Deploy smart contract
- `npm run contract:console` - Open Hardhat console

### Environment Variables
```bash
# Required for contract deployment
PRIVATE_KEY=your_private_key_here

# Privy configuration (sign up at https://privy.io)
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id_here
PRIVY_APP_SECRET=your_privy_app_secret_here

# Database configuration (for production deployment)
# Uses Neon PostgreSQL (serverless PostgreSQL)
DATABASE_URL=your_neon_postgresql_url_here
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Security

⚠️ **Important Security Notes:**

- **Never commit private keys or secrets** to version control
- Use environment variables for all sensitive configuration
- The `.env.example` file provides templates - copy to `.env` and fill with your actual values
- Always verify your `.gitignore` is working before committing
- For production deployment, use secure environment variable management (e.g., Vercel's environment variables)

### Environment Variables Setup
1. Copy `env.example` to `.env`
2. Fill in your actual values:
   - Get `PRIVATE_KEY` from your wallet (for contract deployment only)
   - Create a Privy account at https://privy.io for the Privy variables
   - Set up a PostgreSQL database (like Neon) for `DATABASE_URL`

## Support

For issues and questions:
- Open an issue on GitHub
- Contact: [Your contact information]

## Roadmap

- [ ] Multi-language support
- [ ] Advanced analytics dashboard
- [ ] Integration with more Monad dApps
- [ ] Mobile app
- [ ] Feedback rewards system
