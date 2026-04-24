import dotenv from 'dotenv';
import pg from 'pg';
const { Pool } = pg;

dotenv.config();

const pool = new Pool({ 
  connectionString: process.env.NEON_DATABASE_URL, 
  ssl: { rejectUnauthorized: false } 
});

async function run() {
  try {
    console.log('Fetching weekly results...');
    const { rows: results } = await pool.query('SELECT id, week, data FROM public.weekly_results');
    
    for (const res of results) {
      console.log(`\nChecking ${res.id} (${res.week}):`);
      for (const day of res.data.days) {
        console.log(`  - Day: ${day.date} | Label: ${day.label}`);
        if (day.label === 'FIXTURE') {
          console.log('    >>> FOUND FIXTURE DAY! <<<');
        }
      }
    }
  } catch (err) {
    console.error('Check failed:', err);
  } finally {
    await pool.end();
  }
}

run();
