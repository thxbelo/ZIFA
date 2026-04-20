import dotenv from 'dotenv';
import { getNeonPool } from '../server/db/neon';

dotenv.config();

async function main() {
  const pool = getNeonPool();
  try {
    const { rows } = await pool.query('SELECT id, name FROM public.teams ORDER BY name ASC');
    console.log(JSON.stringify(rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

main();
