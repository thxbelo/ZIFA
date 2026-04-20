import dotenv from 'dotenv';
import { getNeonPool } from '../server/db/neon';

dotenv.config();

async function main() {
  const pool = getNeonPool();
  try {
    const { rows } = await pool.query(`
      SELECT match_week, COUNT(*) 
      FROM public.matches 
      WHERE played = true 
      GROUP BY match_week 
      ORDER BY match_week;
    `);
    console.log("Played Matches by Week:", rows);
  } catch (err) {
    console.error("Error:", err);
  } finally {
    pool.end();
  }
}

main();
