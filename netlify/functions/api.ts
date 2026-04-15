import serverless from 'serverless-http';
import dotenv from 'dotenv';
import { createServerApp } from '../../server/app.js';
import { initializeNeon } from '../../server/db/neon.js';
import * as dbWrapper from '../../server/db/remote-wrapper.js';

dotenv.config();
if (!process.env.DB_TYPE) process.env.DB_TYPE = 'neon';

// Netlify proxies /api/* to this function. Since we use a 200 rewrite in netlify.toml,
// the event.path remains /api/* rather than /.netlify/functions/api/*.
// Therefore, we mount the routes at the standard /api prefix.
const app = createServerApp(dbWrapper);
const baseHandler = serverless(app);

let initPromise: Promise<void> | null = null;
async function ensureInitialized() {
  if (process.env.DB_TYPE !== 'neon') return;
  if (!initPromise) initPromise = initializeNeon();
  await initPromise;
}

export const handler = async (event: any, context: any) => {
  try {
    await ensureInitialized();
    return await baseHandler(event, context);
  } catch (error: any) {
    console.error('[ZIFA] Netlify function error:', error);
    return {
      statusCode: 500,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
