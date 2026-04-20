
import { getMatches, getTeams } from '../server/db/remote-wrapper.js';

async function run() {
  try {
    const teams = await getTeams();
    console.log('Teams in DB:', teams.length);
    
    const matches = await getMatches();
    console.log('Total matches in DB:', matches.length);
    
    const week5Matches = matches.filter(m => m.match_week === 'WEEK 5');
    console.log('Week 5 matches:', JSON.stringify(week5Matches, null, 2));
  } catch (err) {
    console.error('Error:', err);
  }
}

run();
