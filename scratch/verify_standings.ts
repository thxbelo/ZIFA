
import { getStandings, getMatches } from '../server/db/remote-wrapper.js';

async function run() {
  const competition_id = 'comp-division-one';
  const standings = await getStandings(competition_id);
  console.log('Current Standings:');
  console.table(standings.map(s => ({
    Team: s.team_name,
    P: s.mp,
    W: s.w,
    D: s.d,
    L: s.l,
    F: s.gf,
    A: s.ga,
    GD: s.gd,
    Pts: s.pts
  })));
  
  const matches = await getMatches();
  const week5 = matches.filter(m => m.match_week === 'WEEK 5');
  console.log('Week 5 Matches in DB:', week5.length);
  week5.forEach(m => console.log(`${m.teamA} ${m.home_score}-${m.away_score} ${m.teamB}`));
}

run().catch(console.error);
