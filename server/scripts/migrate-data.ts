import { getNeonPool } from '../db/neon.js';
import crypto from 'crypto';

const pool = getNeonPool();

async function migrate() {
  console.log('[Migration] Starting legacy data migration...');
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Ensure a default Season and Competition exist
    const seasonId = 'season-2024-25';
    const compId = 'comp-division-one';

    await client.query(`
      INSERT INTO seasons (id, name, is_active)
      VALUES ($1, '2024/25 Season', true)
      ON CONFLICT (id) DO NOTHING
    `, [seasonId]);

    await client.query(`
      INSERT INTO competitions (id, season_id, name, type, is_active)
      VALUES ($1, $2, 'Division One', 'league', true)
      ON CONFLICT (id) DO NOTHING
    `, [compId, seasonId]);

    // 2. Extract unique team names
    console.log('[Migration] Extracting teams...');
    const teamsSet = new Set<string>();

    const { rows: fixtureRows } = await client.query('SELECT data FROM fixtures');
    const { rows: resultsRows } = await client.query('SELECT data FROM weekly_results');

    fixtureRows.forEach(row => {
      const data = row.data;
      if (data && data.groups) {
        data.groups.forEach((group: any) => {
          group.games.forEach((game: any) => {
            if (game.teamA) teamsSet.add(game.teamA.trim());
            if (game.teamB) teamsSet.add(game.teamB.trim());
          });
        });
      }
    });

    resultsRows.forEach(row => {
      const data = row.data;
      if (data && data.days) {
        data.days.forEach((day: any) => {
          day.matches.forEach((match: any) => {
            if (match.teamA) teamsSet.add(match.teamA.trim());
            if (match.teamB) teamsSet.add(match.teamB.trim());
          });
        });
      }
    });

    // Insert teams
    const teamNameToId: Record<string, string> = {};
    for (const teamName of Array.from(teamsSet)) {
      const teamId = 'team-' + crypto.createHash('md5').update(teamName).digest('hex').slice(0, 8);
      await client.query(`
        INSERT INTO teams (id, name)
        VALUES ($1, $2)
        ON CONFLICT (name) DO NOTHING
      `, [teamId, teamName]);
      
      const { rows } = await client.query('SELECT id FROM teams WHERE name = $1', [teamName]);
      teamNameToId[teamName] = rows[0].id;
    }
    console.log(`[Migration] ${Object.keys(teamNameToId).length} teams synchronized.`);

    // 3. Migrate Fixtures to Matches
    console.log('[Migration] Migrating matches from fixtures...');
    for (const row of fixtureRows) {
      const data = row.data;
      const week = data.week || 'Unknown Week';
      if (data.groups) {
        for (const group of data.groups) {
          const dateStr = group.dateLabel || ''; // e.g. "3 APRIL 2026"
          for (const game of group.games) {
            const matchId = 'match-' + (game.id || crypto.randomUUID().slice(0, 8));
            const hId = teamNameToId[game.teamA.trim()];
            const aId = teamNameToId[game.teamB.trim()];

            await client.query(`
              INSERT INTO matches (id, competition_id, home_team_id, away_team_id, date, venue, time, match_week, status, played)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
              ON CONFLICT (id) DO NOTHING
            `, [
              matchId,
              compId,
              hId,
              aId,
              null, // We might want to parse dateStr but it's optional for now
              game.venue,
              game.time,
              week,
              'not_started',
              false
            ]);
          }
        }
      }
    }

    // 4. Migrate Results to Matches (Update scores)
    console.log('[Migration] Migrating scores from weekly_results...');
    for (const row of resultsRows) {
      const data = row.data;
      const week = data.week || 'Unknown Week';
      if (data.days) {
        for (const day of data.days) {
          for (const res of day.matches) {
            const hId = teamNameToId[res.teamA.trim()];
            const aId = teamNameToId[res.teamB.trim()];
            
            // Try to find an existing match record between these teams in this week
            const { rows: existingMatch } = await client.query(`
              SELECT id FROM matches 
              WHERE home_team_id = $1 AND away_team_id = $2 AND match_week = $3
            `, [hId, aId, week]);

            const hScore = parseInt(res.scoreA) || 0;
            const aScore = parseInt(res.scoreB) || 0;

            if (existingMatch.length > 0) {
              await client.query(`
                UPDATE matches SET home_score = $1, away_score = $2, played = true, status = 'finished'
                WHERE id = $3
              `, [hScore, aScore, existingMatch[0].id]);
            } else {
              const matchId = 'match-res-' + (res.id || crypto.randomUUID().slice(0, 8));
              await client.query(`
                INSERT INTO matches (id, competition_id, home_team_id, away_team_id, home_score, away_score, played, status, match_week, venue, time)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
              `, [matchId, compId, hId, aId, hScore, aScore, true, 'finished', week, res.venue, res.time]);
            }
          }
        }
      }
    }

    await client.query('COMMIT');
    console.log('[Migration] Success! Data normalized and migrated.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[Migration] Failed:', err);
  } finally {
    client.release();
    process.exit(0);
  }
}

migrate();
