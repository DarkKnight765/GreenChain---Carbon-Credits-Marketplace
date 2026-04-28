import fs from "fs";
import path from "path";

const dbPath = path.join(process.cwd(), "database", "db.json");

function readDB() {
  const db = fs.readFileSync(dbPath, "utf8");
  return JSON.parse(db);
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
 * Validate if a wallet belongs to the current user or can be linked to them
 * POST /api/wallet/validate
 * Body: { userId, walletAddress }
 *
 * Returns:
 * - { valid: true } if wallet matches or is new and can be linked
 * - { valid: false, message } if mismatch
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

    const walletOwnedByOtherUser = db.users.find(
      (entry) =>
        entry.id !== userId &&
        ((Array.isArray(entry.wallets) &&
          entry.wallets.some(
            (wallet) =>
              wallet.address &&
              wallet.address.toLowerCase() === normalizedWalletAddress,
          )) ||
          (entry.walletAddress &&
            entry.walletAddress.toLowerCase() === normalizedWalletAddress)),
    );

    if (walletOwnedByOtherUser) {
      return res.status(200).json({
        valid: false,
        message: "Wrong wallet! This wallet is linked to a different account.",
        linkedEmail: walletOwnedByOtherUser.email,
        connectedWallet:
          normalizedWalletAddress.slice(0, 6) +
          "..." +
          normalizedWalletAddress.slice(-4),
      });
    }

    const walletBelongsToUser = user.wallets.some(
      (wallet) => wallet.address.toLowerCase() === normalizedWalletAddress,
    );

    if (walletBelongsToUser) {
      return res.status(200).json({
        valid: true,
        message: "Wallet matches",
      });
    }

    return res.status(200).json({
      valid: true,
      message: "Wallet can be linked to this account",
      requiresLink: true,
    });
  } catch (error) {
    console.error("Error validating wallet:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
