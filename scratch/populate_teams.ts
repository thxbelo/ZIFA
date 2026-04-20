import dotenv from 'dotenv';
import { getNeonPool, initializeNeon } from '../server/db/neon.js';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const teams = [
  "Hwange FC",
  "Blackrock FC",
  "Nkayi Vision FC",
  "Megawatt FC",
  "Bulawayo Warriors",
  "Jordan FC",
  "Mosi Rovers FC",
  "Vic Falls Herentals",
  "Imbizo FC",
  "Casmyn FC",
  "Zim Saints FC",
  "Bulawayo City",
  "Aqua Stars FC",
  "Njube Spurs FC",
  "Khami United FC",
  "Zebra Revolution FC",
  "Talen Vision FC",
  "Bosso 90 FC"
];

async function populate() {
  await initializeNeon();
  const pool = getNeonPool();

  console.log(`Starting population of ${teams.length} teams...`);

  for (const name of teams) {
    const id = 'team-' + name.toLowerCase().replace(/[^a-z0-0]/g, '-');
    const nameUpper = name.toUpperCase();
    
    try {
      await pool.query(
        `INSERT INTO public.teams (id, name) 
         VALUES ($1, $2) 
         ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name 
         RETURNING id`,
        [id, nameUpper]
      );
      console.log(`✓ Added/Verified: ${name}`);
    } catch (err) {
      // In case the ID was taken or name was taken but schema differs
      try {
          await pool.query(
            `INSERT INTO public.teams (id, name) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING`,
            [id, nameUpper]
          );
           console.log(`✓ Added/Verified: ${name}`);
      } catch (err2) {
          console.error(`✗ Failed to add ${name}:`, err2);
      }
    }
  }

  console.log('Population complete.');
  process.exit(0);
}

populate().catch(console.error);
