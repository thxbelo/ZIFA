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
    CREATE TABLE IF NOT EXISTS public.teams (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      district TEXT,
      stadium TEXT,
      coach TEXT,
      logo_url TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS public.seasons (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      is_active BOOLEAN DEFAULT false,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS public.competitions (
      id TEXT PRIMARY KEY,
      season_id TEXT REFERENCES public.seasons(id),
      name TEXT NOT NULL,
      type TEXT DEFAULT 'league',
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Ensure matches table has new columns
    CREATE TABLE IF NOT EXISTS public.matches (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL, -- Keep for legacy
      "teamA" TEXT NOT NULL, -- Keep for legacy
      "teamB" TEXT NOT NULL, -- Keep for legacy
      venue TEXT NOT NULL,
      time TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'League',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    ALTER TABLE public.matches ALTER COLUMN date DROP NOT NULL;
    ALTER TABLE public.matches ALTER COLUMN "teamA" DROP NOT NULL;
    ALTER TABLE public.matches ALTER COLUMN "teamB" DROP NOT NULL;
    ALTER TABLE public.matches ALTER COLUMN venue DROP NOT NULL;
    ALTER TABLE public.matches ALTER COLUMN time DROP NOT NULL;
    ALTER TABLE public.matches ALTER COLUMN category DROP NOT NULL;

    ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS competition_id TEXT REFERENCES public.competitions(id);
    ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS home_team_id TEXT REFERENCES public.teams(id);
    ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS away_team_id TEXT REFERENCES public.teams(id);
    ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS match_week TEXT;
    ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'not_started';
    ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS home_score INTEGER DEFAULT 0;
    ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS away_score INTEGER DEFAULT 0;
    ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS played BOOLEAN DEFAULT false;

    CREATE TABLE IF NOT EXISTS public.match_events (
      id TEXT PRIMARY KEY,
      match_id TEXT REFERENCES public.matches(id),
      player_id TEXT NOT NULL,
      team_id TEXT REFERENCES public.teams(id),
      event_type TEXT NOT NULL,
      minute INTEGER,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- STANDINGS VIEW (Automatic calculation)
    CREATE OR REPLACE VIEW public.standings_view AS
    WITH match_stats AS (
      -- Home results
      SELECT 
        competition_id,
        home_team_id AS team_id,
        1 AS played,
        CASE WHEN home_score > away_score THEN 1 ELSE 0 END AS won,
        CASE WHEN home_score = away_score THEN 1 ELSE 0 END AS drawn,
        CASE WHEN home_score < away_score THEN 1 ELSE 0 END AS lost,
        home_score AS gf,
        away_score AS ga,
        (home_score - away_score) AS gd,
        CASE 
          WHEN home_score > away_score THEN 3 
          WHEN home_score = away_score THEN 1 
          ELSE 0 
        END AS points
      FROM public.matches
      WHERE played = true AND competition_id IS NOT NULL
      
      UNION ALL
      
      -- Away results
      SELECT 
        competition_id,
        away_team_id AS team_id,
        1 AS played,
        CASE WHEN away_score > home_score THEN 1 ELSE 0 END AS won,
        CASE WHEN away_score = home_score THEN 1 ELSE 0 END AS drawn,
        CASE WHEN away_score < home_score THEN 1 ELSE 0 END AS lost,
        away_score AS gf,
        home_score AS ga,
        (away_score - home_score) AS gd,
        CASE 
          WHEN away_score > home_score THEN 3 
          WHEN away_score = home_score THEN 1 
          ELSE 0 
        END AS points
      FROM public.matches
      WHERE played = true AND competition_id IS NOT NULL
    )
    SELECT 
      t.id AS team_id,
      t.name AS team_name,
      ms.competition_id,
      SUM(ms.played) AS mp,
      SUM(ms.won) AS w,
      SUM(ms.drawn) AS d,
      SUM(ms.lost) AS l,
      SUM(ms.gf) AS gf,
      SUM(ms.ga) AS ga,
      SUM(ms.gd) AS gd,
      SUM(ms.points) AS pts
    FROM public.teams t
    JOIN match_stats ms ON t.id = ms.team_id
    GROUP BY t.id, t.name, ms.competition_id
    ORDER BY pts DESC, gd DESC, gf DESC;

    -- Legacy tables (kept for migration)
    CREATE TABLE IF NOT EXISTS public.users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'admin',
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
      nationality TEXT,
      jersey_number INTEGER,
      age INTEGER,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    ALTER TABLE public.players ADD COLUMN IF NOT EXISTS nationality TEXT;
    ALTER TABLE public.players ADD COLUMN IF NOT EXISTS jersey_number INTEGER;
    ALTER TABLE public.players ADD COLUMN IF NOT EXISTS age INTEGER;
    ALTER TABLE public.players ADD COLUMN IF NOT EXISTS team_id TEXT REFERENCES public.teams(id);

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
