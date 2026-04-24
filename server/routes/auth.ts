import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getJwtSecret } from '../config/security.js';
import { sendError, validateBody } from '../utils/http.js';
import { loginSchema } from '../validation/schemas.js';

type DbWrapper = {
  getUserByUsername: (username: string) => Promise<any>;
};

export function createAuthRouter(dbWrapper: DbWrapper) {
  const router = Router();

  router.post('/login', async (req, res) => {
    try {
      const { username, password } = validateBody(loginSchema, req.body);
      if (!dbWrapper.getUserByUsername) {
        console.error('[Auth] Error: getUserByUsername is missing on dbWrapper!', Object.keys(dbWrapper));
        throw new Error('Database adapter misconfiguration: getUserByUsername missing');
      }

      const user = await dbWrapper.getUserByUsername(username);

      if (!user || !bcrypt.compareSync(password, user.password_hash)) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, getJwtSecret(), { expiresIn: '12h' });

      res.json({
        token,
        user: { id: user.id, username: user.username, role: user.role },
      });
    } catch (err: any) {
      sendError(res, err, 'Auth login', err?.status || 500);
    }
  });

  return router;
}
