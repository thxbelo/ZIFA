import dotenv from 'dotenv';
import pg from 'pg';
const { Pool } = pg;

dotenv.config();

async function test() {
  const connectionString = process.env.NEON_DATABASE_URL;
  console.log('Testing connection to:', connectionString ? 'URL present' : 'MISSING');
  
  const pool = new Pool({ 
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Querying public.fixtures...');
    const { rows } = await pool.query('SELECT * FROM public.fixtures LIMIT 1');
    console.log('Success! Found', rows.length, 'fixtures.');
  } catch (err) {
    console.error('FAILED TO QUERY FIXTURES:');
    console.error('Error name:', err.name);
    console.error('Error message:', err.message);
    console.error('Full error:', JSON.stringify(err));
  } finally {
    await pool.end();
  }
}

test();
