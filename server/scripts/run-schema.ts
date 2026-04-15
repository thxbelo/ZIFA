import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Client } = pg;

// Connection string structured from the provided details
const connectionString = 'postgresql://postgres:thabelo123%40@db.dbkwgvgxjhqkfznxstiv.supabase.co:5432/postgres';

async function runSchema() {
  const client = new Client({
    connectionString,
  });

  try {
    await client.connect();
    console.log('✅ Connected to Supabase PostgreSQL database.');

    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const schemaPath = path.join(__dirname, '..', '..', 'supabase_schema.sql');
    
    console.log('Reading schema from:', schemaPath);
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    console.log('Executing schema...');
    await client.query(schemaSql);
    
    console.log('✅ Schema executed successfully! Tables created.');

  } catch (err: any) {
    console.error('❌ Error executing schema:', err.message);
  } finally {
    await client.end();
  }
}

runSchema();
