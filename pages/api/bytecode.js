import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  const bytecodePath = path.join(process.cwd(), 'contracts', 'bytecode.txt');
  try {
    const bytecode = fs.readFileSync(bytecodePath, 'utf8').trim();
    res.status(200).json({ bytecode });
  } catch (error) {
    res.status(500).json({ error: 'Failed to read bytecode' });
  }
}
