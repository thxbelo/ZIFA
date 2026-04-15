import cors from 'cors';
import express from 'express';
import { createAuthRouter } from './routes/auth.js';
import { createApiRouter } from './routes/api.js';

export function createServerApp(dbWrapper: any) {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get('/api/health', (req, res) => {
    res.json({ ok: true, dbType: process.env.DB_TYPE || 'sqlite' });
  });
  app.get('/.netlify/functions/api/health', (req, res) => {
    res.json({ ok: true, dbType: process.env.DB_TYPE || 'sqlite' });
  });

  // Mount standard paths (Local / Rewrites that preserve origin path)
  app.use('/api/auth', createAuthRouter(dbWrapper));
  app.use('/api', createApiRouter(dbWrapper));

  // Mount Netlify explicit paths (Rewrites that pass the target path)
  app.use('/.netlify/functions/api/auth', createAuthRouter(dbWrapper));
  app.use('/.netlify/functions/api', createApiRouter(dbWrapper));

  return app;
}
