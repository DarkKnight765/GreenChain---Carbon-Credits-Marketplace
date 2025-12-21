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

export default function handler(req, res) {
  if (req.method === "POST") {
    const {
      listingId,
      listingName,
      quantity,
      pricePerUnit,
      buyerId,
      sellerId,
      buyerEmail,
      sellerEmail,
      tokenIds,
    } = req.body;

    const db = readDB();

    if (!db.transactions) {
      db.transactions = [];
    }

    const transaction = {
      id: Date.now(),
      listingId,
      listingName,
      quantity,
      pricePerUnit,
      buyerId,
      sellerId,
      buyerEmail,
      sellerEmail,
      tokenIds: tokenIds || [],
      timestamp: new Date().toISOString(),
    };

    db.transactions.push(transaction);
    writeDB(db);
    res.status(201).json(transaction);
  } else if (req.method === "GET") {
    const db = readDB();
    const transactions = db.transactions || [];

    // Add otherPartyEmail for display
    const enriched = transactions.map((tx) => ({
      ...tx,
      otherPartyEmail: tx.buyerEmail || tx.sellerEmail,
    }));

    res.status(200).json(enriched);
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
}
