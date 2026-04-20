
import { addMatch } from '../server/db/remote-wrapper.js';
import crypto from 'crypto';

const matches = [
  { teamA: 'MOSI ROVERS FC', teamB: 'ZIM SAINTS FC', scoreA: 0, scoreB: 0 },
  { teamA: 'BOSSO 90 FC', teamB: 'CASMYN FC', scoreA: 0, scoreB: 1 },
  { teamA: 'AQUA STARS FC', teamB: 'KHAMI UNITED FC', scoreA: 0, scoreB: 1 },
  { teamA: 'NJUBE SPURS FC', teamB: 'ZEBRA REVOLUTION FC', scoreA: 1, scoreB: 0 },
  { teamA: 'MOSI ROVERS FC', teamB: 'BLACKROCK FC', scoreA: 0, scoreB: 0 },
  { teamA: 'MEGAWATT FC', teamB: 'BULAWAYO CITY', scoreA: 0, scoreB: 0 },
  { teamA: 'IMBIZO FC', teamB: 'TALEN VISION FC', scoreA: 0, scoreB: 2 },
  { teamA: 'JORDAN FC', teamB: 'ZIM SAINTS FC', scoreA: 2, scoreB: 0 },
];

async function run() {
  console.log('Adding Week 5 matches...');
  const competition_id = 'comp-division-one';
  const match_week = 'WEEK 5';
  const date = '2026-04-19';

  for (const m of matches) {
    const id = 'match-' + crypto.randomBytes(4).toString('hex');
    await addMatch({
      id,
      competition_id,
      match_week,
      date,
      teamA: m.teamA,
      teamB: m.teamB,
      home_score: m.scoreA,
      away_score: m.scoreB,
      played: true,
      status: 'finished',
      venue: 'TBA',
      time: '15:00 HRS'
    });
    console.log(`Added: ${m.teamA} ${m.scoreA}-${m.scoreB} ${m.teamB}`);
  }
  console.log('Finished adding matches.');
}

run().catch(console.error);
