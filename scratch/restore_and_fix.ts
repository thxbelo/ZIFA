
import { getNeonPool } from '../server/db/neon.js';
import { addMatch } from '../server/db/remote-wrapper.js';
import fs from 'fs';
import path from 'path';

async function run() {
  const pool = getNeonPool();
  const competition_id = 'comp-division-one';

  console.log('Cleaning up...');
  await pool.query('DELETE FROM public.matches WHERE competition_id = $1', [competition_id]);
  await pool.query('DELETE FROM public.teams WHERE name = $1', ['OFFICIAL HISTORY']);

  console.log('Loading history from all_matches.json...');
  const history = JSON.parse(fs.readFileSync('scratch/all_matches.json', 'utf8'));
  for (const m of history) {
    await addMatch({
      id: m.id,
      competition_id,
      match_week: m.match_week,
      date: m.date,
      teamA: m.teamA,
      teamB: m.teamB,
      home_score: m.home_score,
      away_score: m.away_score,
      played: true,
      status: 'finished'
    });
  }

  const week5Results = [
    { teamA: 'MOSI ROVERS FC', teamB: 'ZIM SAINTS FC', scoreA: 0, scoreB: 0 },
    { teamA: 'BOSSO 90 FC', teamB: 'CASMYN FC', scoreA: 0, scoreB: 1 },
    { teamA: 'AQUA STARS FC', teamB: 'KHAMI UNITED FC', scoreA: 0, scoreB: 1 },
    { teamA: 'NJUBE SPURS FC', teamB: 'ZEBRA REVOLUTION FC', scoreA: 1, scoreB: 0 },
    { teamA: 'MOSI ROVERS FC', teamB: 'BLACKROCK FC', scoreA: 0, scoreB: 0 },
    { teamA: 'MEGAWATT FC', teamB: 'BULAWAYO CITY', scoreA: 0, scoreB: 0 },
    { teamA: 'IMBIZO FC', teamB: 'TALEN VISION FC', scoreA: 0, scoreB: 2 },
    { teamA: 'JORDAN FC', teamB: 'ZIM SAINTS FC', scoreA: 2, scoreB: 0 },
  ];

  console.log('Adding Week 5 results...');
  for (let i = 0; i < week5Results.length; i++) {
    const m = week5Results[i];
    await addMatch({
      id: `w5-real-${i}`,
      competition_id,
      match_week: 'WEEK 5',
      date: '2026-04-19',
      teamA: m.teamA,
      teamB: m.teamB,
      home_score: m.scoreA,
      away_score: m.scoreB,
      played: true,
      status: 'finished'
    });
  }

  console.log('Done cleaning and restoring.');
}

run().catch(console.error);
