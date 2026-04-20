import dotenv from 'dotenv';
import { getNeonPool } from '../server/db/neon';

dotenv.config();

async function main() {
  const pool = getNeonPool();
  try {
    console.log("Starting team merge process...");

    const updates = [
      { bad: 'team-64rhcqvp', good: 'team-megawatt-fc', goodName: 'MEGAWATT FC' },
      { bad: 'team-cosdcz4m', good: 'team-mosi-rovers-fc', goodName: 'MOSI ROVERS FC' },
      { bad: 'team-8iqtxge8', good: 'team-njube-spurs-fc', goodName: 'NJUBE SPURS FC' },
      { bad: 'team-nkayi-vision-fc', good: 'team-u4vuf0ba', goodName: 'NKAYI UNITED FC' },
    ];

    for (const update of updates) {
      console.log(`Merging ${update.bad} into ${update.good}...`);
      
      await pool.query(
        `UPDATE public.matches SET home_team_id = $1, "teamA" = $2 WHERE home_team_id = $3`,
        [update.good, update.goodName, update.bad]
      );
      
      await pool.query(
        `UPDATE public.matches SET away_team_id = $1, "teamB" = $2 WHERE away_team_id = $3`,
        [update.good, update.goodName, update.bad]
      );

      // Now delete the bad team
      await pool.query(
        `DELETE FROM public.teams WHERE id = $1`,
        [update.bad]
      );
    }

    console.log("Cleanup complete!");
  } catch (err) {
    console.error("Error during cleanup:", err);
  } finally {
    pool.end();
  }
}

main();
