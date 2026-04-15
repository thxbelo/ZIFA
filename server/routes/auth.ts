import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'zifa-southern-region-secret-2026';

type DbWrapper = {
  getUserByUsername: (username: string) => Promise<any>;
};

export function createAuthRouter(dbWrapper: DbWrapper) {
  const router = Router();

  router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
      const user = await dbWrapper.getUserByUsername(username);

      if (!user || !bcrypt.compareSync(password, user.password_hash)) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '12h' });

      res.json({
        token,
        user: { id: user.id, username: user.username, role: user.role },
      });
    } catch (err: any) {
      console.error('Login Error:', err);
      res.status(500).json({ error: 'Internal server error during login' });
    }
  });

  return router;
}
