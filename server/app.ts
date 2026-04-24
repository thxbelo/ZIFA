import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createAuthRouter } from './routes/auth.js';
import { createApiRouter } from './routes/api.js';
import { getJsonLimit, isOriginAllowed } from './config/security.js';

export function createServerApp(dbWrapper: any) {
  const app = express();
  app.disable('x-powered-by');
  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  }));
  app.use(cors({
    origin(origin, callback) {
      if (isOriginAllowed(origin)) return callback(null, true);
      return callback(new Error('CORS origin is not allowed'));
    },
    credentials: true,
  }));
  app.use(express.json({ limit: getJsonLimit() }));

  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many login attempts. Please try again later.' },
  });

  const writeLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 120,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.method === 'GET' || req.path.endsWith('/health'),
    message: { error: 'Too many requests. Please slow down.' },
  });

  app.get('/api/health', (req, res) => {
    res.json({ ok: true, dbType: process.env.DB_TYPE || 'sqlite' });
  });
  app.get('/.netlify/functions/api/health', (req, res) => {
    res.json({ ok: true, dbType: process.env.DB_TYPE || 'sqlite' });
  });

  // Mount standard paths (Local / Rewrites that preserve origin path)
  app.use('/api/auth/login', loginLimiter);
  app.use('/api', writeLimiter);
  app.use('/api/auth', createAuthRouter(dbWrapper));
  app.use('/api', createApiRouter(dbWrapper));

  // Mount Netlify explicit paths (Rewrites that pass the target path)
  app.use('/.netlify/functions/api/auth/login', loginLimiter);
  app.use('/.netlify/functions/api', writeLimiter);
  app.use('/.netlify/functions/api/auth', createAuthRouter(dbWrapper));
  app.use('/.netlify/functions/api', createApiRouter(dbWrapper));

  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (res.headersSent) return next(err);
    console.error('[API middleware error]', err);
    const status = err?.code === 'LIMIT_FILE_SIZE' || err?.type === 'entity.too.large' ? 413 : err?.status || 500;
    const message =
      status === 413 ? 'Request body or uploaded file is too large' :
      status < 500 ? err.message :
      'Internal server error';
    res.status(status).json({ error: message });
  });

  return app;
}
