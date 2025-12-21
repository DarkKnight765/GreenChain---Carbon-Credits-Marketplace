import fs from "fs";
import path from "path";

const dbPath = path.join(process.cwd(), "database", "db.json");

function readDB() {
  const db = fs.readFileSync(dbPath, "utf8");
  return JSON.parse(db);
}

export default function handler(req, res) {
  if (req.method === "GET") {
    const db = readDB();
    res.status(200).json(db.users);
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
}
