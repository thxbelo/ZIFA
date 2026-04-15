import dotenv from 'dotenv';
import { initializeNeon } from './db/neon.js';
import { createServerApp } from './app.js';

dotenv.config();
const DB_TYPE = process.env.DB_TYPE || 'sqlite';
let app: any;

async function bootstrap() {
  let dbWrapper;
  
  if (DB_TYPE === 'sqlite') {
    // Dynamic import to avoid loading better-sqlite3 when not needed (e.g. in web production)
    const sqlite = await import('./db/sqlite-wrapper.js');
    sqlite.initializeSqlite();
    dbWrapper = sqlite;
  } else {
    // Default to neon / remote wrapper for web
    await initializeNeon();
    dbWrapper = await import('./db/remote-wrapper.js');
  }

  app = createServerApp(dbWrapper);

  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`[ZIFA] Professional backend running on http://localhost:${PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error('[ZIFA] Failed to start backend:', err);
  process.exit(1);
});
