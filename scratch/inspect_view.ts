
import { getNeonPool } from '../server/db/neon.js';

async function run() {
  const pool = getNeonPool();
  const { rows } = await pool.query(`
    SELECT pg_get_viewdef('standings_view', true) as definition;
  `);
  console.log(rows[0].definition);
}

run().catch(console.error);
