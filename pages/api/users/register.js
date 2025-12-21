
import fs from 'fs';
import path from 'path';

const dbPath = path.join(process.cwd(), 'database', 'db.json');

function readDB() {
  const db = fs.readFileSync(dbPath, 'utf8');
  return JSON.parse(db);
}

function writeDB(db) {
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
}

export default function handler(req, res) {
  if (req.method === 'POST') {
    const { email, password, role } = req.body;
    const db = readDB();
    const userExists = db.users.find(user => user.email === email);
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }
    const newUser = { id: Date.now(), email, password, role };
    db.users.push(newUser);
    writeDB(db);
    res.status(201).json(newUser);
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
