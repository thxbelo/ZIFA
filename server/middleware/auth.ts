import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'zifa-southern-region-secret-2026';

export function requireAuth(req: any, res: any, next: any) {
  const auth = req.headers['authorization'];
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  
  try {
    const decoded = jwt.verify(auth.split(' ')[1], JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}
