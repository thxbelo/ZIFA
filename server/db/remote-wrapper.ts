import dotenv from 'dotenv';
import { supabase } from './supabase.js';
import { getNeonPool } from './neon.js';
import type { Pool } from 'pg';

dotenv.config();

function getDbType() {
  return process.env.DB_TYPE || 'sqlite';
}

function ensureRemoteDb() {
  const DB_TYPE = getDbType();
  if (DB_TYPE !== 'neon' && DB_TYPE !== 'supabase') {
    throw new Error(`Remote DB wrapper requires DB_TYPE=neon or supabase (got ${DB_TYPE})`);
  }
}

function normalizeDateInput(value: string | null | undefined) {
  if (!value) return value ?? null;

  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

  const cleaned = trimmed.replace(/^\s*(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\s+/i, '');
  const parsed = new Date(cleaned);
  if (Number.isNaN(parsed.getTime())) return trimmed;

  return parsed.toISOString().slice(0, 10);
}

async function resolveTeamId(pool: Pool, teamRef: string | null | undefined) {
  if (!teamRef || teamRef === 'TBA') return null;

  const normalized = teamRef.trim();
  const normalizedUpper = normalized.toUpperCase();

  if (normalizedUpper.startsWith('TEAM-')) {
    const { rows } = await pool.query('SELECT id FROM public.teams WHERE id = $1 LIMIT 1', [normalized]);
    if (rows.length > 0) return rows[0].id;
  }

  const { rows } = await pool.query('SELECT id FROM public.teams WHERE UPPER(name) = $1 LIMIT 1', [normalizedUpper]);
  if (rows.length > 0) return rows[0].id;

  const newId = 'team-' + Math.random().toString(36).slice(2, 10);
  await pool.query(
    'INSERT INTO public.teams (id, name) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING',
    [newId, normalizedUpper]
  );
  return newId;
}

async function getMatchById(pool: Pool, id: string) {
  const { rows } = await pool.query(
    `
      SELECT m.*,
             COALESCE(tA.name, m."teamA", m.home_team_id) AS "teamA",
             COALESCE(tB.name, m."teamB", m.away_team_id) AS "teamB",
             COALESCE(tA.name, m."teamA", m.home_team_id) AS home_team_name,
             COALESCE(tB.name, m."teamB", m.away_team_id) AS away_team_name,
             tA.name AS "teamA_name",
             tA.logo_url AS "teamA_logo",
             tB.name AS "teamB_name",
             tB.logo_url AS "teamB_logo",
             COALESCE(m.category, 'League') AS category
      FROM public.matches m
      LEFT JOIN public.teams tA ON m.home_team_id = tA.id
      LEFT JOIN public.teams tB ON m.away_team_id = tB.id
      WHERE m.id = $1
      LIMIT 1
    `,
    [id]
  );

  return rows[0] || null;
}

export async function getUserByUsername(username: string) {
  ensureRemoteDb();
  const pool = getNeonPool();
  const { rows } = await pool.query('SELECT * FROM public.users WHERE username = $1 LIMIT 1', [username]);
  return rows[0] || null;
}

// ── TEAMS ───────────────────────────────────────────────────────────────────

export async function getTeams() {
  ensureRemoteDb();
  const pool = getNeonPool();
  const { rows } = await pool.query('SELECT * FROM public.teams ORDER BY name ASC');
  return rows;
}

export async function addTeam(team: any) {
  ensureRemoteDb();
  const pool = getNeonPool();
  await pool.query(
    `INSERT INTO public.teams (id, name, district, stadium, coach, logo_url)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (id) DO UPDATE SET
       name = EXCLUDED.name,
       district = EXCLUDED.district,
       stadium = EXCLUDED.stadium,
       coach = EXCLUDED.coach,
       logo_url = EXCLUDED.logo_url`,
    [team.id, team.name, team.district, team.stadium, team.coach, team.logo_url]
  );
}

// ── SEASONS & COMPETITIONS ──────────────────────────────────────────────────

export async function getSeasons() {
  ensureRemoteDb();
  const pool = getNeonPool();
  const { rows } = await pool.query('SELECT * FROM public.seasons ORDER BY created_at DESC');
  return rows;
}

export async function getCompetitions() {
  ensureRemoteDb();
  const pool = getNeonPool();
  const { rows } = await pool.query(`
    SELECT c.*, s.name as season_name 
    FROM public.competitions c
    JOIN public.seasons s ON c.season_id = s.id
    ORDER BY c.created_at DESC
  `);
  return rows;
}

// ── MATCHES & RESULTS ───────────────────────────────────────────────────────

export async function getMatches(filters?: string | { competitionId?: string; unplayed?: boolean; played?: boolean }) {
  ensureRemoteDb();
  const pool = getNeonPool();
  const parsedFilters =
    typeof filters === 'string'
      ? { competitionId: filters }
      : (filters || {});

  let query = `
    SELECT m.*, 
           COALESCE(tA.name, m."teamA", m.home_team_id) as "teamA",
           COALESCE(tB.name, m."teamB", m.away_team_id) as "teamB",
           COALESCE(tA.name, m."teamA", m.home_team_id) as home_team_name,
           COALESCE(tB.name, m."teamB", m.away_team_id) as away_team_name,
           tA.name as "teamA_name", tA.logo_url as "teamA_logo",
           tB.name as "teamB_name", tB.logo_url as "teamB_logo",
           COALESCE(m.category, 'League') as category
    FROM public.matches m
    LEFT JOIN public.teams tA ON m.home_team_id = tA.id
    LEFT JOIN public.teams tB ON m.away_team_id = tB.id
  `;
  const params: any[] = [];
  const conditions: string[] = [];

  if (parsedFilters.competitionId) {
    params.push(parsedFilters.competitionId);
    conditions.push(`m.competition_id = $${params.length}`);
  }
  if (parsedFilters.unplayed) {
    conditions.push(`COALESCE(m.played, false) = false`);
  }
  if (parsedFilters.played) {
    conditions.push(`COALESCE(m.played, false) = true`);
  }
  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(' AND ')}`;
  }
  query += ' ORDER BY m.date ASC, m.created_at ASC';
  const { rows } = await pool.query(query, params);
  return rows;
}

export async function addMatch(match: any) {
  ensureRemoteDb();
  const pool = getNeonPool();
  const homeTeamInput = match.home_team_id || match.teamA;
  const awayTeamInput = match.away_team_id || match.teamB;
  const finalHomeId = await resolveTeamId(pool, homeTeamInput) || homeTeamInput;
  const finalAwayId = await resolveTeamId(pool, awayTeamInput) || awayTeamInput;
  const normalizedDate = normalizeDateInput(match.date);
  const normalizedCategory = match.category || 'League';
  const legacyTeamA = match.teamA || match.home_team_name || homeTeamInput || finalHomeId;
  const legacyTeamB = match.teamB || match.away_team_name || awayTeamInput || finalAwayId;

  await pool.query(
    `INSERT INTO public.matches (
      id, date, "teamA", "teamB", venue, time, category,
      competition_id, home_team_id, away_team_id,
      match_week, status, home_score, away_score, played
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
    ON CONFLICT (id) DO UPDATE SET
      date = EXCLUDED.date,
      "teamA" = EXCLUDED."teamA",
      "teamB" = EXCLUDED."teamB",
      venue = EXCLUDED.venue,
      time = EXCLUDED.time,
      category = EXCLUDED.category,
      competition_id = EXCLUDED.competition_id,
      home_team_id = EXCLUDED.home_team_id,
      away_team_id = EXCLUDED.away_team_id,
      match_week = EXCLUDED.match_week,
      status = EXCLUDED.status,
      home_score = EXCLUDED.home_score,
      away_score = EXCLUDED.away_score,
      played = EXCLUDED.played`,
    [
      match.id,
      normalizedDate,
      legacyTeamA,
      legacyTeamB,
      match.venue || 'TBA',
      match.time || '15:00',
      normalizedCategory,
      match.competition_id || null,
      finalHomeId || null,
      finalAwayId || null,
      match.match_week || null,
      match.status || 'not_started',
      match.home_score ?? 0,
      match.away_score ?? 0,
      match.played ?? false
    ]
  );
}

export async function updateMatch(id: string, updates: any) {
  ensureRemoteDb();
  const pool = getNeonPool();
  const existingMatch = await getMatchById(pool, id);

  if (!existingMatch) {
    throw new Error(`Match ${id} not found`);
  }

  const mergedMatch = {
    ...existingMatch,
    ...updates,
    id,
    teamA: updates.teamA ?? existingMatch.teamA,
    teamB: updates.teamB ?? existingMatch.teamB,
    home_team_id: updates.home_team_id ?? existingMatch.home_team_id ?? existingMatch.teamA,
    away_team_id: updates.away_team_id ?? existingMatch.away_team_id ?? existingMatch.teamB,
  };

  await addMatch(mergedMatch);
  return getMatchById(pool, id);
}

export async function getStandings(competitionId: string) {
  ensureRemoteDb();
  const pool = getNeonPool();
  
  const { rows: allTeams } = await pool.query('SELECT * FROM public.teams');
  
  const { rows: compStandings } = await pool.query(
    'SELECT * FROM public.standings_view WHERE competition_id = $1',
    [competitionId]
  );
  
  const standingsMap = new Map();
  compStandings.forEach(s => standingsMap.set(s.team_id, s));
  
  const finalStandings = allTeams.map(team => {
    let stat = standingsMap.get(team.id);
    if (!stat) {
      stat = {
        team_id: team.id,
        team_name: team.name,
        competition_id: competitionId,
        mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0
      };
    }
    // Convert numeric fields that might come as strings from SUM()
    return {
      ...stat,
      mp: Number(stat.mp || 0),
      w: Number(stat.w || 0),
      d: Number(stat.d || 0),
      l: Number(stat.l || 0),
      gf: Number(stat.gf || 0),
      ga: Number(stat.ga || 0),
      gd: Number(stat.gd || 0),
      pts: Number(stat.pts || 0),
    };
  });
  
  finalStandings.sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (b.gd !== a.gd) return b.gd - a.gd;
    if (b.gf !== a.gf) return b.gf - a.gf;
    return a.team_name.localeCompare(b.team_name);
  });
  
  return finalStandings;
}

export async function deleteMatch(id: string) {
  ensureRemoteDb();
  const pool = getNeonPool();
  await pool.query('DELETE FROM public.matches WHERE id = $1', [id]);
}

// ── PAYMENTS ────────────────────────────────────────────────────────────────

export async function getPayments() {
  ensureRemoteDb();
  const pool = getNeonPool();
  const { rows } = await pool.query('SELECT * FROM public.payments ORDER BY date DESC');
  return rows.map((p: any) => ({
    id: p.id,
    team: p.team,
    amount: p.amount,
    category: p.category,
    date: p.date,
    distribution: { field: p.field_fee, admin: p.admin_fee, ref: p.ref_fee },
  }));
}

export async function addPayment(payment: any) {
  ensureRemoteDb();
  const pool = getNeonPool();
  await pool.query(
    `INSERT INTO public.payments (id, team, amount, category, date, field_fee, admin_fee, ref_fee)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT (id) DO UPDATE SET
       team = EXCLUDED.team,
       amount = EXCLUDED.amount,
       category = EXCLUDED.category,
       date = EXCLUDED.date,
       field_fee = EXCLUDED.field_fee,
       admin_fee = EXCLUDED.admin_fee,
       ref_fee = EXCLUDED.ref_fee`,
    [
      payment.id,
      payment.team,
      payment.amount,
      payment.category,
      payment.date,
      payment.distribution.field,
      payment.distribution.admin,
      payment.distribution.ref,
    ],
  );
}

// ── LEGACY EMULATION (Bridge for existing components) ───────────────────────

export async function getFixtures() {
  ensureRemoteDb();
  const pool = getNeonPool();
  const { rows } = await pool.query('SELECT * FROM public.fixtures ORDER BY created_at DESC');
  return rows.map((fixture: any) => ({
    id: fixture.id,
    week: fixture.week,
    data: fixture.data,
  }));
}

export async function addFixture(fixture: any) {
  ensureRemoteDb();
  const pool = getNeonPool();
  await pool.query(
    `
      INSERT INTO public.fixtures (id, week, data)
      VALUES ($1, $2, $3)
      ON CONFLICT (id) DO UPDATE SET
        week = EXCLUDED.week,
        data = EXCLUDED.data
    `,
    [fixture.id, fixture.week, fixture.data]
  );
}

export async function deleteFixture(id: string) {
  ensureRemoteDb();
  const pool = getNeonPool();
  await pool.query('DELETE FROM public.fixtures WHERE id = $1', [id]);
}

export async function getWeeklyResults() {
  ensureRemoteDb();
  const pool = getNeonPool();
  const { rows } = await pool.query('SELECT * FROM public.weekly_results ORDER BY created_at DESC');
  return rows.map((result: any) => ({
    id: result.id,
    week: result.week,
    division: result.division,
    data: result.data,
  }));
}

export async function addWeeklyResult(result: any) {
  ensureRemoteDb();
  const pool = getNeonPool();
  await pool.query(
    `
      INSERT INTO public.weekly_results (id, week, division, data)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (id) DO UPDATE SET
        week = EXCLUDED.week,
        division = EXCLUDED.division,
        data = EXCLUDED.data
    `,
    [result.id, result.week, result.division, result.data]
  );
}

export async function deleteWeeklyResult(id: string) {
  ensureRemoteDb();
  const pool = getNeonPool();
  await pool.query('DELETE FROM public.weekly_results WHERE id = $1', [id]);
}

// ── PLAYERS ─────────────────────────────────────────────────────────────────

export async function getPlayers() {
  ensureRemoteDb();
  const pool = getNeonPool();
  const { rows } = await pool.query(`
    SELECT p.*, COALESCE(t.name, p.team) as team, t.name as team_name 
    FROM public.players p
    LEFT JOIN public.teams t ON p.team_id = t.id
    ORDER BY p.name ASC
  `);
  return rows;
}

export async function addPlayer(player: any) {
  ensureRemoteDb();
  const pool = getNeonPool();
  const teamName = player.team || player.team_name || null;
  const resolvedTeamId = player.team_id || await resolveTeamId(pool, teamName);

  await pool.query(
    `INSERT INTO public.players (id, name, team, team_id, position, yellow_cards, red_cards, nationality, jersey_number, age)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     ON CONFLICT (id) DO UPDATE SET
       name = EXCLUDED.name,
       team = EXCLUDED.team,
       team_id = EXCLUDED.team_id,
       position = EXCLUDED.position,
       yellow_cards = EXCLUDED.yellow_cards,
       red_cards = EXCLUDED.red_cards,
       nationality = EXCLUDED.nationality,
       jersey_number = EXCLUDED.jersey_number,
       age = EXCLUDED.age`,
    [
      player.id,
      player.name,
      (teamName || '').toUpperCase(),
      resolvedTeamId,
      player.position,
      player.yellow_cards ?? 0, player.red_cards ?? 0,
      player.nationality, player.jersey_number, player.age
    ],
  );
}

export async function updatePlayerCards(id: string, yellow: number, red: number) {
  ensureRemoteDb();
  const pool = getNeonPool();
  await pool.query(
    'UPDATE public.players SET yellow_cards = $1, red_cards = $2 WHERE id = $3',
    [yellow, red, id],
  );
}

export async function deletePlayer(id: string) {
  ensureRemoteDb();
  const pool = getNeonPool();
  await pool.query('DELETE FROM public.players WHERE id = $1', [id]);
}
