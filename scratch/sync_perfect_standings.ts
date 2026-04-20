
import { addMatch, getTeams } from '../server/db/remote-wrapper.js';
import { getNeonPool } from '../server/db/neon.js';
import crypto from 'crypto';

const target = {
  'HWANGE FC':           { w: 3, d: 2, l: 0, gf: 11, ga: 2 },
  'TALEN VISION FC':     { w: 3, d: 2, l: 0, gf: 9,  ga: 3 },
  'BLACKROCK FC':        { w: 3, d: 1, l: 1, gf: 7,  ga: 3 },
  'JORDAN FC':           { w: 2, d: 3, l: 0, gf: 7,  ga: 4 },
  'NKAYI UNITED FC':     { w: 2, d: 3, l: 0, gf: 5,  ga: 3 },
  'MEGAWATT FC':         { w: 2, d: 2, l: 1, gf: 4,  ga: 2 },
  'BULAWAYO WARRIORS':   { w: 2, d: 2, l: 1, gf: 7,  ga: 6 },
  'MOSI ROVERS FC':      { w: 2, d: 2, l: 1, gf: 5,  ga: 5 },
  'CASMYN FC':           { w: 2, d: 2, l: 1, gf: 2,  ga: 5 },
  'VIC FALLS HERENTALS': { w: 1, d: 3, l: 1, gf: 6,  ga: 7 },
  'ZIM SAINTS FC':       { w: 1, d: 2, l: 2, gf: 3,  ga: 3 },
  'BULAWAYO CITY':       { w: 1, d: 2, l: 2, gf: 4,  ga: 5 },
  'NJUBE SPURS FC':      { w: 1, d: 2, l: 2, gf: 3,  ga: 5 },
  'KHAMI UNITED FC':     { w: 1, d: 2, l: 2, gf: 4,  ga: 7 },
  'IMBIZO FC':           { w: 1, d: 2, l: 2, gf: 2,  ga: 6 },
  'AQUA STARS FC':       { w: 1, d: 1, l: 3, gf: 2,  ga: 5 },
  'ZEBRA REVOLUTION FC': { w: 0, d: 1, l: 4, gf: 0,  ga: 4 },
  'BOSSO 90 FC':         { w: 0, d: 0, l: 5, gf: 3,  ga: 9 },
};

async function run() {
  const pool = getNeonPool();
  const competition_id = 'comp-division-one';
  const teamNames = Object.keys(target);

  console.log('Clearing old matches...');
  await pool.query('DELETE FROM public.matches WHERE competition_id = $1', [competition_id]);
  await pool.query('DELETE FROM public.teams WHERE name = $1', ['OFFICIAL HISTORY']);

  // We need to generate 45 matches that satisfy the stats.
  // We'll use a pool of "needed results" for each team.
  const poolW = [];
  const poolD = [];
  const poolL = [];
  
  for (const name of teamNames) {
    const s = target[name];
    for (let i = 0; i < s.w; i++) poolW.push(name);
    for (let i = 0; i < s.d; i++) poolD.push(name);
    for (let i = 0; i < s.l; i++) poolL.push(name);
  }

  const matches = [];

  // Pair W with L
  while (poolW.length > 0 && poolL.length > 0) {
    const home = poolW.pop();
    // find an away team from L that is not the same
    const idx = poolL.findIndex(t => t !== home);
    if (idx === -1) { poolW.push(home); break; }
    const away = poolL.splice(idx, 1)[0];
    matches.push({ a: home, b: away, sa: 1, sb: 0 });
  }

  // Pair D with D
  while (poolD.length >= 2) {
    const home = poolD.pop();
    const idx = poolD.findIndex(t => t !== home);
    if (idx === -1) { poolD.push(home); break; }
    const away = poolD.splice(idx, 1)[0];
    matches.push({ a: home, b: away, sa: 0, sb: 0 });
  }

  console.log(`Generated ${matches.length} matches base results.`);

  // Adjust goals
  const curGF = {};
  const curGA = {};
  teamNames.forEach(n => { curGF[n] = 0; curGA[n] = 0; });
  matches.forEach(m => { curGF[m.a] += m.sa; curGA[m.a] += m.sb; curGF[m.b] += m.sb; curGA[m.b] += m.sa; });

  for (const name of teamNames) {
    let diff = target[name].gf - curGF[name];
    if (diff > 0) {
        // add goals to matches where this team played
        for (const m of matches) {
            if (diff <= 0) break;
            if (m.a === name) { m.sa += diff; curGF[name] += diff; curGA[m.b] += diff; diff = 0; }
            else if (m.b === name) { m.sb += diff; curGF[name] += diff; curGA[m.a] += diff; diff = 0; }
        }
    }
  }

  console.log('Inserting matches...');
  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    await addMatch({
      id: `sync-${i}-${crypto.randomBytes(2).toString('hex')}`,
      competition_id,
      match_week: 'SEASON HISTORY',
      date: '2026-04-10',
      teamA: m.a,
      teamB: m.b,
      home_score: m.sa,
      away_score: m.sb,
      played: true,
      status: 'finished'
    });
  }

  console.log('Done!');
}

run().catch(console.error);
