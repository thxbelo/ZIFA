import Database from 'better-sqlite3';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getNeonPool } from '../db/neon.js';

dotenv.config();

const NEON_DATABASE_URL = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL || '';
if (!NEON_DATABASE_URL) {
  console.error('Please provide NEON_DATABASE_URL (or DATABASE_URL) in .env');
  process.exit(1);
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '..', '..', 'zifa.db');

if (!fs.existsSync(dbPath)) {
  console.log('No local zifa.db found to migrate.');
  process.exit(0);
}

const sqliteDb = new Database(dbPath);

async function migrate() {
  console.log('🔄 Starting migration from SQLite to Neon (Postgres)...');

  const pool = getNeonPool();

  const hasTable = (tableName: string) => {
    try {
      return (
        sqliteDb.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").get(tableName) !== undefined
      );
    } catch (error: any) {
      console.error(`Error checking if ${tableName} exists:`, error.message);
      return false;
    }
  };

  console.log('Migrating users...');
  if (hasTable('users')) {
    const users = sqliteDb.prepare('SELECT * FROM users').all();
    for (const u of users as any[]) {
      await pool.query(
        `INSERT INTO public.users (id, username, password_hash, role)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (id) DO UPDATE SET
           username = EXCLUDED.username,
           password_hash = EXCLUDED.password_hash,
           role = EXCLUDED.role`,
        [u.id, u.username, u.password_hash, u.role || 'admin'],
      );
    }
    if (users.length > 0) console.log(`✅ Migrated ${users.length} users.`);
  } else {
    console.log('⚠️ No users table found locally. Skipping.');
  }

  console.log('Migrating matches...');
  if (hasTable('matches')) {
    const matches = sqliteDb.prepare('SELECT * FROM matches').all();
    for (const m of matches as any[]) {
      await pool.query(
        `INSERT INTO public.matches (id, date, "teamA", "teamB", venue, time, category)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO UPDATE SET
           date = EXCLUDED.date,
           "teamA" = EXCLUDED."teamA",
           "teamB" = EXCLUDED."teamB",
           venue = EXCLUDED.venue,
           time = EXCLUDED.time,
           category = EXCLUDED.category`,
        [m.id, m.date, m.teamA, m.teamB, m.venue, m.time, m.category || 'League'],
      );
    }
    if (matches.length > 0) console.log(`✅ Migrated ${matches.length} matches.`);
  } else {
    console.log('⚠️ No matches table found locally. Skipping.');
  }

  console.log('Migrating payments...');
  if (hasTable('payments')) {
    const payments = sqliteDb.prepare('SELECT * FROM payments').all();
    for (const p of payments as any[]) {
      await pool.query(
        `INSERT INTO public.payments (id, team, amount, category, date, field_fee, admin_fee, ref_fee)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (id) DO UPDATE SET
           team = EXCLUDED.team,
           amount = EXCLUDED.amount,
           category = EXCLUDED.category,
           date = EXCLUDED.date,
           field_fee = EXCLUDED.field_fee,
           admin_fee = EXCLUDED.admin_fee,
           ref_fee = EXCLUDED.ref_fee`,
        [p.id, p.team, p.amount, p.category, p.date, p.field_fee, p.admin_fee, p.ref_fee],
      );
    }
    if (payments.length > 0) console.log(`✅ Migrated ${payments.length} payments.`);
  }

  console.log('Migrating fixtures...');
  if (hasTable('fixtures')) {
    const fixtures = sqliteDb.prepare('SELECT * FROM fixtures').all();
    for (const f of fixtures as any[]) {
      const data = typeof f.data === 'string' ? JSON.parse(f.data) : f.data;
      await pool.query(
        `INSERT INTO public.fixtures (id, week, data)
         VALUES ($1, $2, $3::jsonb)
         ON CONFLICT (id) DO UPDATE SET
           week = EXCLUDED.week,
           data = EXCLUDED.data`,
        [f.id, f.week, JSON.stringify(data)],
      );
    }
    if (fixtures.length > 0) console.log(`✅ Migrated ${fixtures.length} fixtures.`);
  }

  await pool.end();
  console.log('🎉 Migration completed.');
  process.exit(0);
}

migrate();

