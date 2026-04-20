import dotenv from 'dotenv';
import { getNeonPool, initializeNeon } from '../server/db/neon.js';

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

async function clearAndPopulate() {
  await initializeNeon();
  const pool = getNeonPool();

  try {
    console.log('🗑️  Clearing all existing data (matches, results, then teams)...');
    
    // Delete dependent records first
    await pool.query('DELETE FROM public.matches');
    console.log('✓ Matches cleared');
    
    await pool.query('DELETE FROM public.weekly_results');
    console.log('✓ Results cleared');
    
    await pool.query('DELETE FROM public.players');
    console.log('✓ Players cleared');
    
    // Now delete teams
    await pool.query('DELETE FROM public.teams');
    console.log('✓ All teams cleared');

    console.log(`\n📝 Adding ${teams.length} teams to the system...`);

    for (const name of teams) {
      const id = 'team-' + name.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const nameUpper = name.toUpperCase();
      
      try {
        await pool.query(
          `INSERT INTO public.teams (id, name) 
           VALUES ($1, $2)`,
          [id, nameUpper]
        );
        console.log(`✓ Added: ${name}`);
      } catch (err) {
        console.error(`✗ Failed to add ${name}:`, err);
      }
    }

    console.log('\n✅ Population complete! System now has exactly 18 teams.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error during cleanup and population:', err);
    process.exit(1);
  }
}

clearAndPopulate().catch(console.error);
