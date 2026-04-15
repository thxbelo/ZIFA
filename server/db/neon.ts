import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

const connectionString = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL || '';
let poolSingleton: Pool | null = null;

function shouldUseSsl(conn: string) {
  if (!conn) return false;
  if (conn.includes('sslmode=require')) return true;
  if (conn.includes('ssl=true')) return true;
  if (conn.includes('localhost') || conn.includes('127.0.0.1')) return false;
  return true;
}

export function getNeonPool() {
  if (!connectionString) {
    throw new Error('Missing NEON_DATABASE_URL (or DATABASE_URL) in environment');
  }

  const ssl = shouldUseSsl(connectionString) ? { rejectUnauthorized: false } : undefined;
  if (!poolSingleton) {
    poolSingleton = new Pool({ connectionString, ssl });
  }
  return poolSingleton;
}

// Idempotent schema bootstrap — safe to run on every startup.
// Uses CREATE TABLE IF NOT EXISTS so existing tables are never touched.
async function ensureNeonSchema(pool: Pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS public.users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'admin',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS public.matches (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      "teamA" TEXT NOT NULL,
      "teamB" TEXT NOT NULL,
      venue TEXT NOT NULL,
      time TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'League',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS public.payments (
      id TEXT PRIMARY KEY,
      team TEXT NOT NULL,
      amount REAL NOT NULL,
      category TEXT NOT NULL,
      date TEXT NOT NULL,
      field_fee REAL NOT NULL,
      admin_fee REAL NOT NULL,
      ref_fee REAL NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS public.fixtures (
      id TEXT PRIMARY KEY,
      week TEXT NOT NULL,
      data JSONB NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS public.weekly_results (
      id TEXT PRIMARY KEY,
      week TEXT NOT NULL,
      division TEXT NOT NULL,
      data JSONB NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS public.players (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      team TEXT NOT NULL,
      position TEXT NOT NULL,
      yellow_cards INTEGER DEFAULT 0,
      red_cards INTEGER DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);
  console.log('[ZIFA] Neon schema verified — all tables present.');
}

export async function ensureNeonAdmin(pool: Pool) {
  const { rows } = await pool.query('SELECT id FROM public.users WHERE username = $1 LIMIT 1', ['admin']);
  if (rows.length > 0) return;

  const bcrypt = await import('bcryptjs');
  const hash = bcrypt.default.hashSync('admin', 10);
  await pool.query(
    `INSERT INTO public.users (id, username, password_hash, role)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (id) DO NOTHING`,
    ['admin-user-1', 'admin', hash, 'admin'],
  );
  console.log('[ZIFA] Admin user seeded: admin/admin');
}

export async function initializeNeon() {
  const pool = getNeonPool();

  // Verify connectivity first
  try {
    const client = await pool.connect();
    client.release();
    console.log('[ZIFA] Connected to Neon PostgreSQL.');
  } catch (err) {
    console.error('Failed to connect to Neon database during initializeNeon:', err);
    throw err;
  }

  // Create any missing tables (idempotent — CREATE TABLE IF NOT EXISTS)
  await ensureNeonSchema(pool);

  // Seed default admin user if not present
  await ensureNeonAdmin(pool);
}
