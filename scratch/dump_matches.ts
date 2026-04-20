import dotenv from 'dotenv';
import { getNeonPool } from '../server/db/neon';
import fs from 'fs';

dotenv.config();

async function main() {
  const pool = getNeonPool();
  try {
    const res = await pool.query('SELECT * FROM public.matches ORDER BY match_week, date, time');
    fs.writeFileSync('scratch/all_matches.json', JSON.stringify(res.rows, null, 2));
    console.log("Matches dumped to scratch/all_matches.json");
  } catch (err) {
    console.error("Error:", err);
  } finally {
    pool.end();
  }
}

main();
