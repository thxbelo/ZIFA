import dotenv from 'dotenv';
import { getNeonPool } from '../server/db/neon';

dotenv.config();

async function main() {
  const pool = getNeonPool();
  try {
    const fixRes = await pool.query('SELECT * FROM public.fixtures');
    console.log("Fixtures:", fixRes.rows.length);
    
    // Check if results table exists
    const resTableCheck = await pool.query("SELECT to_regclass('public.results')");
    if (resTableCheck.rows[0].to_regclass) {
       const resRes = await pool.query('SELECT * FROM public.results');
       console.log("Results:", resRes.rows.length);
    } else {
       console.log("No results table.");
    }
  } catch (err) {
    console.error("Error:", err);
  } finally {
    pool.end();
  }
}

main();
