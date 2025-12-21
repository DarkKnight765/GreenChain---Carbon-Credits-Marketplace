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
    const { name, price, quantity, tokenIds, sellerId } = req.body;
    const db = readDB();

    const listingId = Date.now();
    const newListing = {
      id: listingId,
      name,
      price,
      quantity,
      tokenIds: tokenIds || [],
      sellerId,
      isForSale: true,
    };

    db.listings.push(newListing);
    writeDB(db);
    res.status(201).json(newListing);
  } else if (req.method === "PUT") {
    const { id, price, isForSale, quantity, tokenIds } = req.body;
    if (id === undefined) {
      return res.status(400).json({ message: "Listing id is required" });
    }

    const db = readDB();
    const index = db.listings.findIndex((l) => l.id === id);
    if (index === -1) {
      return res.status(404).json({ message: "Listing not found" });
    }

    if (price !== undefined) db.listings[index].price = price;
    if (isForSale !== undefined) db.listings[index].isForSale = isForSale;
    if (quantity !== undefined) db.listings[index].quantity = quantity;
    if (tokenIds !== undefined) db.listings[index].tokenIds = tokenIds;

    writeDB(db);
    res.status(200).json(db.listings[index]);
  } else if (req.method === "GET") {
    const db = readDB();
    res.status(200).json(db.listings);
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
}
