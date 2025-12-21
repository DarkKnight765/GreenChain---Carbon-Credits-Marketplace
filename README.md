# 🌱 GreenChain

A blockchain-based carbon credit marketplace built with Next.js, Solidity, and Web3. NGOs can mint and sell carbon credits as ERC721 tokens, while companies can purchase them using cryptocurrency on the Sepolia testnet.

## 🚀 Features

### For NGOs

- **Create Carbon Credit Listings** - Mint multiple ERC721 tokens representing carbon credits
- **Set Custom Prices** - Define pricing in ETH for each credit
- **Manage Inventory** - Track active listings and sales history
- **Relist & Update** - Modify prices and availability of existing credits

### For Companies

- **Browse Marketplace** - View all available carbon credits
- **Purchase Credits** - Buy credits directly with ETH via MetaMask
- **Partial Purchases** - Buy specific quantities from multi-unit listings
- **Portfolio Dashboard** - Track owned credits and purchase history

### Security & UX

- **Wallet Association** - System remembers which wallet belongs to each email account
- **Account Mismatch Warning** - Alert banner when wrong MetaMask account is connected
- **Transaction History** - Complete audit trail of all purchases and sales
- **Real-time Sync** - Automatic on-chain status updates every 10 seconds

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React, TailwindCSS
- **Smart Contracts**: Solidity 0.8.x, OpenZeppelin ERC721
- **Web3**: ethers.js, Web3React v8, MetaMask
- **Database**: JSON file storage (for demo purposes)
- **Network**: Sepolia Testnet

## 📦 Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/greenchain.git
cd greenchain
```

2. Install dependencies:

```bash
npm install
```

3. Run the development server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## 🎯 Getting Started

### 1. Deploy the Smart Contract

1. Navigate to `/deploy`
2. Connect your MetaMask wallet
3. Click **Deploy Contract**
4. Confirm the transaction in MetaMask
5. Contract address will be saved automatically

### 2. Create an Account

- **NGO Account**: For selling carbon credits
- **Company Account**: For buying carbon credits

### 3. Setup Wallets

- Each email should use a consistent MetaMask account
- The system will remember your wallet association
- Use different accounts for NGO and Company testing

### 4. Start Trading

**As NGO:**

1. Go to **Create Listing**
2. Enter credit name, price (ETH), and quantity
3. Confirm minting transactions
4. View your listings in the Marketplace

**As Company:**

1. Go to **Marketplace**
2. Browse available credits
3. Enter quantity to purchase
4. Confirm purchase transaction
5. View owned credits in **Dashboard**

## 🔧 Smart Contract Functions

### `createCredit(uint256 price)`

Mints a new carbon credit NFT with specified price and sets it for sale.

### `buyCredit(uint256 id)`

Transfers ownership of a credit from seller to buyer, handles ETH payment.

### `updateCredit(uint256 id, uint256 newPrice, bool isForSale)`

Owner can update price and availability status of their credits.

## 📁 Project Structure

```
greenchain/
├── components/
│   ├── WalletConnect.js      # Wallet connection component
│   └── WalletChecker.js      # Account verification warning
├── contracts/
│   ├── GreenChain.sol        # Main ERC721 contract
│   ├── abi.json              # Contract ABI
│   └── bytecode.txt          # Compiled bytecode
├── database/
│   └── db.json               # Local data storage
├── pages/
│   ├── index.js              # Landing page
│   ├── login.js              # Authentication
│   ├── register.js           # User registration
│   ├── market.js             # Marketplace UI
│   ├── dashboard.js          # User dashboard
│   ├── deploy.js             # Contract deployment
│   ├── settings.js           # Account settings
│   └── listings/
│       └── new.js            # Create listing form
└── pages/api/
    ├── listings/             # Listing CRUD endpoints
    ├── transactions.js       # Transaction logging
    └── users/               # User authentication
```

## 🌐 Network Configuration

- **Chain ID**: 11155111 (Sepolia Testnet)
- **Currency**: SepoliaETH
- **RPC**: Available through MetaMask
- **Faucet**: [https://sepoliafaucet.com/](https://sepoliafaucet.com/)

## 🔐 Environment Variables

No environment variables needed for local development. Contract address is stored in browser localStorage.

## 🧪 Testing

1. Use two different MetaMask accounts for NGO and Company roles
2. Get test ETH from Sepolia faucet
3. Test full purchase flow:
   - NGO creates listing with quantity 3
   - Company buys 1 credit
   - Verify DB updates correctly
   - Check dashboard shows purchased credit

## 📝 Key Implementation Details

### Multi-Token Inventory System

- One ERC721 token minted per unit of quantity
- Listing tracks array of `tokenIds`
- Purchases remove bought tokens from available pool

### Wallet-Email Association

- First connection saves wallet address to localStorage
- Subsequent visits verify correct wallet is connected
- Reset button allows changing associated wallet

### Transaction Tracking

- Each purchase logs: buyer, seller, quantity, price, token IDs
- Dashboard displays relevant history based on user role
- Token ownership verified on-chain before display

## 🚧 Known Limitations

- Local JSON database (for demo only, not production)
- Single contract deployment per browser session
- No backend authentication (localStorage only)
- Test network only (Sepolia)

## 🌟 Future Improvements

- Integrate a real backend database (e.g., PostgreSQL, MongoDB) for production-ready storage
- Add user authentication with JWT or OAuth
- Email notifications for transactions
- Admin dashboard for NGOs
- Advanced filtering and search in marketplace
- Support for ERC1155 multi-token standard

---

## 🔗 Links

- [Next.js Documentation](https://nextjs.org/docs)
- [ethers.js Documentation](https://docs.ethers.io/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [Sepolia Testnet](https://sepolia.dev/)
