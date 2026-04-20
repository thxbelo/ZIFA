import dotenv from 'dotenv';
import { getNeonPool } from '../server/db/neon';

dotenv.config();

async function main() {
  const pool = getNeonPool();
  try {
    const res = await pool.query('SELECT * FROM public.matches ORDER BY date, time');
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error("Error:", err);
  } finally {
    pool.end();
  }
}

main();
