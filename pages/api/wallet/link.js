import fs from "fs";
import path from "path";

const dbPath = path.join(process.cwd(), "database", "db.json");

function readDB() {
  const db = fs.readFileSync(dbPath, "utf8");
  return JSON.parse(db);
}

function writeDB(db) {
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
}

function normalizeAddress(address) {
  return address.trim().toLowerCase();
}

function ensureWalletFields(user) {
  if (!Array.isArray(user.wallets)) {
    user.wallets = user.walletAddress
      ? [
          {
            address: normalizeAddress(user.walletAddress),
            linkedAt: new Date().toISOString(),
            lastConnectedAt: new Date().toISOString(),
            connectionCount: 1,
          },
        ]
      : [];
  }

  if (!Array.isArray(user.walletHistory)) {
    user.walletHistory = [];
  }
}

/**
 * Link a wallet address to a user account
 * POST /api/wallet/link
 * Body: { userId, walletAddress }
 *
 * Rules:
 * - A user can have multiple wallets
 * - A wallet can only belong to one user at a time
 */
export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { userId, walletAddress } = req.body;

  if (!userId || !walletAddress) {
    return res
      .status(400)
      .json({ message: "userId and walletAddress required" });
  }

  try {
    const db = readDB();
    const normalizedWalletAddress = normalizeAddress(walletAddress);

    // Find the user
    const user = db.users.find((u) => u.id === userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    ensureWalletFields(user);

    // Check if this wallet is already linked to a different user
    const existingUser = db.users.find(
      (u) =>
        u.id !== userId &&
        ((Array.isArray(u.wallets) &&
          u.wallets.some(
            (wallet) =>
              wallet.address &&
              wallet.address.toLowerCase() === normalizedWalletAddress,
          )) ||
          (u.walletAddress &&
            u.walletAddress.toLowerCase() === normalizedWalletAddress)),
    );
    if (existingUser) {
      return res.status(400).json({
        message: "This wallet is already linked to another user",
        linkedEmail: existingUser.email,
      });
    }

    const now = new Date().toISOString();
    const existingWallet = user.wallets.find(
      (wallet) => wallet.address.toLowerCase() === normalizedWalletAddress,
    );

    if (existingWallet) {
      existingWallet.lastConnectedAt = now;
      existingWallet.connectionCount =
        (existingWallet.connectionCount || 0) + 1;
      user.walletHistory.push({
        address: normalizedWalletAddress,
        action: "connected",
        timestamp: now,
      });
    } else {
      user.wallets.push({
        address: normalizedWalletAddress,
        linkedAt: now,
        lastConnectedAt: now,
        connectionCount: 1,
      });
      user.walletHistory.push({
        address: normalizedWalletAddress,
        action: "linked",
        timestamp: now,
      });
    }

    user.walletAddress = normalizedWalletAddress;
    writeDB(db);

    res.status(200).json({
      message: "Wallet linked successfully",
      user,
    });
  } catch (error) {
    console.error("Error linking wallet:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
