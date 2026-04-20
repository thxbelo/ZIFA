
import { getNeonPool } from '../server/db/neon.js';

async function run() {
  const pool = getNeonPool();
  console.log('Deleting all matches for competition comp-division-one...');
  const res = await pool.query('DELETE FROM public.matches WHERE competition_id = $1', ['comp-division-one']);
  console.log(`Deleted ${res.rowCount} matches.`);
}

run().catch(console.error);
