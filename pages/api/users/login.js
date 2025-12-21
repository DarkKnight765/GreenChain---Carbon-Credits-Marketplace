
import fs from 'fs';
import path from 'path';

const dbPath = path.join(process.cwd(), 'database', 'db.json');

function readDB() {
  const db = fs.readFileSync(dbPath, 'utf8');
  return JSON.parse(db);
}

export default function handler(req, res) {
  if (req.method === 'POST') {
    const { email, password } = req.body;
    const db = readDB();
    const user = db.users.find(user => user.email === email && user.password === password);
    if (user) {
      res.status(200).json(user);
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
