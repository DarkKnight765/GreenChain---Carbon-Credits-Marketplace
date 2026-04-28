import fs from "fs";
import path from "path";

const dbPath = path.join(process.cwd(), "database", "db.json");

function readDB() {
  const db = fs.readFileSync(dbPath, "utf8");
  return JSON.parse(db);
}

function normalizeUser(user) {
  const walletAddress = user.walletAddress
    ? user.walletAddress.toLowerCase()
    : null;
  const wallets = Array.isArray(user.wallets)
    ? user.wallets.map((wallet) => ({
        ...wallet,
        address: wallet.address.toLowerCase(),
      }))
    : walletAddress
      ? [
          {
            address: walletAddress,
            linkedAt: new Date().toISOString(),
            lastConnectedAt: new Date().toISOString(),
            connectionCount: 1,
          },
        ]
      : [];

  const { password, ...safeUser } = user;

  return {
    ...safeUser,
    walletAddress,
    wallets,
    walletHistory: Array.isArray(user.walletHistory) ? user.walletHistory : [],
  };
}

export default function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { userId } = req.query;
  if (!userId) {
    return res.status(400).json({ message: "userId required" });
  }

  const db = readDB();
  const user = db.users.find((entry) => String(entry.id) === String(userId));

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  return res.status(200).json(normalizeUser(user));
}
