import dotenv from 'dotenv';
import { initializeNeon } from './db/neon.js';
import { createServerApp } from './app.js';

import { createServer } from 'http';
import { Server } from 'socket.io';

dotenv.config();
const DB_TYPE = process.env.DB_TYPE || 'sqlite';
let app: any;
let io: Server;

async function bootstrap() {
  let dbWrapper;
  
  if (DB_TYPE === 'sqlite') {
    const sqlite = await import('./db/sqlite-wrapper.js');
    sqlite.initializeSqlite();
    dbWrapper = sqlite;
  } else {
    await initializeNeon();
    dbWrapper = await import('./db/remote-wrapper.js');
  }

  console.log('[ZIFA] DB Wrapper loaded. Keys:', Object.keys(dbWrapper));
  console.log('[ZIFA] getUserByUsername type:', typeof dbWrapper.getUserByUsername);

  app = createServerApp(dbWrapper);
  const httpServer = createServer(app);

  io = new Server(httpServer, {
    cors: {
      origin: '*', // Allow all origins for dev; refine for production
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log(`[ZIFA] Client connected: ${socket.id}`);
    socket.on('disconnect', () => {
      console.log(`[ZIFA] Client disconnected: ${socket.id}`);
    });
  });

  // Attach io to app for easy access in routes
  app.set('io', io);

  const PORT = process.env.PORT || 3001;
  httpServer.listen(PORT, () => {
    console.log(`[ZIFA] Professional backend (with WebSockets) running on http://localhost:${PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error('[ZIFA] Failed to start backend:', err);
  process.exit(1);
});
