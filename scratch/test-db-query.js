import dotenv from 'dotenv';
import pg from 'pg';
const { Pool } = pg;

dotenv.config();

const connectionString = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL || '';

async function test() {
  console.log('Testing connection to:', connectionString.split('@')[1] || connectionString);
  const ssl = connectionString.includes('localhost') ? undefined : { rejectUnauthorized: false };
  const pool = new Pool({ connectionString, ssl });

  try {
    const res = await pool.query('SELECT * FROM public.teams LIMIT 5');
    console.log('Teams query success. Count:', res.rows.length);
    console.log('Sample data:', res.rows[0]);
  } catch (err) {
    console.error('Teams query FAILED:', err.message);
  }

  try {
    const res = await pool.query('SELECT * FROM public.fixtures LIMIT 5');
    console.log('Fixtures query success. Count:', res.rows.length);
  } catch (err) {
    console.error('Fixtures query FAILED:', err.message);
  }

  await pool.end();
}

test();
