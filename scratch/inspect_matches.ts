
import { getMatches, getTeams } from '../server/db/remote-wrapper.js';

async function run() {
  const matches = await getMatches();
  const teams = await getTeams();
  
  console.log('--- Matches for ZIM SAINTS FC ---');
  matches.filter(m => m.teamA.includes('ZIM SAINTS') || m.teamB.includes('ZIM SAINTS'))
    .forEach(m => console.log(`[${m.match_week}] ${m.teamA} ${m.home_score}-${m.away_score} ${m.teamB}`));

  console.log('\n--- Matches for MOSI ROVERS FC ---');
  matches.filter(m => m.teamA.includes('MOSI ROVERS') || m.teamB.includes('MOSI ROVERS'))
    .forEach(m => console.log(`[${m.match_week}] ${m.teamA} ${m.home_score}-${m.away_score} ${m.teamB}`));
}

run().catch(console.error);
