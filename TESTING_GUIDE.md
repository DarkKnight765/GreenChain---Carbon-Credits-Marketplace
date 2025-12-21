# GreenChain Testing Guide

## Quick Start

### 1. Deploy the Updated Contract

1. Open `http://localhost:3000/deploy`
2. Connect MetaMask wallet
3. Click **Deploy Contract**
4. Confirm transaction in MetaMask
5. Save the contract address shown (automatically stored in localStorage)

### 2. Create Listings (NGO Only)

1. Log in as NGO: `nihalsharma765@gmail.com` / `ok`
2. Navigate to `/listings/new`
3. Connect wallet
4. Fill in:
   - **Credit Name**: e.g., "Forest Carbon Credit"
   - **Price (in ETH)**: e.g., `0.001` (keep small for testing)
   - **Quantity**: e.g., `10`
5. Click **Create Listing**
6. Confirm transaction
7. Check `/market` to see your listing with "For sale" status

### 3. Buy Credits (Company Only)

1. Log in as Company: `nihaleditz@gmail.com` / `ok`
2. Navigate to `/market`
3. Connect wallet (use different MetaMask account than seller)
4. Click **Buy** on any "For sale" listing
5. Confirm transaction
6. Status should change to "Not for sale"

### 4. Relist Credits (Owner Only)

1. Switch to the wallet that owns the credit
2. Navigate to `/market`
3. Find your owned credit (shows "Owned by you (not for sale)")
4. Enter new price in ETH in the relist input
5. Click **Relist**
6. Confirm transaction
7. Status should return to "For sale" with updated price

## Key Features Implemented

### Contract Features

- ✅ `createCredit(price)` - Mint new carbon credits (NGO only)
- ✅ `buyCredit(id)` - Purchase credits with ETH
- ✅ `updateCredit(id, newPrice, isForSale)` - Owner can relist/update price
- ✅ Price validation (must be > 0)
- ✅ Owner-only checks on updates

### UI Features

- ✅ On-chain status sync (auto-refresh every 10s)
- ✅ Price displayed in ETH from on-chain data
- ✅ Buy button disabled for:
  - Not for sale items
  - Items you already own
  - Non-existent tokens
- ✅ Relist form shows only for owned items
- ✅ DB sync on buy/relist operations
- ✅ Input validation on price entry

## Troubleshooting

### "This credit is not for sale"

- The item was already sold or never minted
- Refresh the page to get latest on-chain status
- Check if you're the owner (can't buy your own credits)

### "Insufficient funds"

- Your wallet balance is too low
- Get test ETH from Sepolia faucet
- Or create listings with smaller prices (e.g., 0.0001 ETH)

### Contract not deployed

- Visit `/deploy` first
- Check `/settings` for saved contract address
- Redeploy if address is missing

### Stale listings showing

- Old DB entries from pre-update contracts
- They'll show as "Not minted" or "Not for sale"
- Clear `database/db.json` listings array and re-mint

## Test Scenarios

### Happy Path

1. Deploy contract as admin
2. NGO creates listing with 0.001 ETH price
3. Company buys credit
4. NGO (now owner) relists at 0.002 ETH
5. Different company buys again

### Edge Cases

- Try buying your own credit → Blocked
- Try buying without wallet → Alert shown
- Try buying with insufficient funds → Transaction fails
- Try relisting with 0 price → Validation error
- Try updating someone else's credit → Contract revert

## Network Info

- **Chain ID**: 11155111 (Sepolia Testnet)
- **Faucet**: https://sepoliafaucet.com/

## User Accounts

- **NGO**: nihalsharma765@gmail.com / ok
- **Company**: nihaleditz@gmail.com / ok

## Files Modified

- `contracts/GreenChain.sol` - Added updateCredit, validations
- `contracts/abi.json` - Regenerated with updateCredit
- `contracts/bytecode.txt` - Recompiled with new features
- `pages/market.js` - Relist UI, status sync, owner checks
- `pages/listings/new.js` - Price validation
- `pages/api/listings/index.js` - PUT endpoint for updates
