import { initializeNeon } from '../server/db/neon.ts';

async function verify() {
  try {
    await initializeNeon();
    console.log('✅ Success: Neon schema initialized and verified.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error during schema verification:', err);
    process.exit(1);
  }
}

verify();
