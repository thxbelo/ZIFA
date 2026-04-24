import jwt from 'jsonwebtoken';
import { getJwtSecret } from '../config/security.js';

export function requireAuth(req: any, res: any, next: any) {
  const auth = req.headers['authorization'];
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  
  try {
    const decoded = jwt.verify(auth.split(' ')[1], getJwtSecret());
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}
