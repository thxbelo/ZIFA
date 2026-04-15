import dotenv from 'dotenv';
import { supabase } from './supabase.js';
import { getNeonPool } from './neon.js';

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

export async function getUserByUsername(username: string) {
  ensureRemoteDb();
  const DB_TYPE = getDbType();
  if (DB_TYPE === 'supabase') {
    const { data, error } = await supabase.from('users').select('*').eq('username', username).single();
    if (error && (error as any).code !== 'PGRST116') return null;
    return data;
  }

  const pool = getNeonPool();
  const { rows } = await pool.query('SELECT * FROM public.users WHERE username = $1 LIMIT 1', [username]);
  return rows[0] || null;
}

export async function getMatches() {
  ensureRemoteDb();
  const DB_TYPE = getDbType();
  if (DB_TYPE === 'supabase') {
    const { data, error } = await supabase.from('matches').select('*').order('date', { ascending: true });
    return error ? [] : data;
  }

  const pool = getNeonPool();
  const { rows } = await pool.query('SELECT * FROM public.matches ORDER BY date ASC');
  return rows;
}

export async function addMatch(match: any) {
  ensureRemoteDb();
  const DB_TYPE = getDbType();
  if (DB_TYPE === 'supabase') {
    const { error } = await supabase.from('matches').insert([
      {
        id: match.id,
        date: match.date,
        teamA: match.teamA,
        teamB: match.teamB,
        venue: match.venue,
        time: match.time,
        category: match.category || 'League',
      },
    ]);
    if (error) throw error;
    return;
  }

  const pool = getNeonPool();
  await pool.query(
    `INSERT INTO public.matches (id, date, "teamA", "teamB", venue, time, category)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (id) DO UPDATE SET
       date = EXCLUDED.date,
       "teamA" = EXCLUDED."teamA",
       "teamB" = EXCLUDED."teamB",
       venue = EXCLUDED.venue,
       time = EXCLUDED.time,
       category = EXCLUDED.category`,
    [match.id, match.date, match.teamA, match.teamB, match.venue, match.time, match.category || 'League'],
  );
}

export async function deleteMatch(id: string) {
  ensureRemoteDb();
  const DB_TYPE = getDbType();
  if (DB_TYPE === 'supabase') {
    const { error } = await supabase.from('matches').delete().eq('id', id);
    if (error) throw error;
    return;
  }

  const pool = getNeonPool();
  await pool.query('DELETE FROM public.matches WHERE id = $1', [id]);
}

export async function getPayments() {
  ensureRemoteDb();
  const DB_TYPE = getDbType();
  if (DB_TYPE === 'supabase') {
    const { data, error } = await supabase.from('payments').select('*').order('date', { ascending: false });
    if (error) return [];
    return (data as any[]).map((p: any) => ({
      id: p.id,
      team: p.team,
      amount: p.amount,
      category: p.category,
      date: p.date,
      distribution: { field: p.field_fee, admin: p.admin_fee, ref: p.ref_fee },
    }));
  }

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
  const DB_TYPE = getDbType();
  if (DB_TYPE === 'supabase') {
    const { error } = await supabase.from('payments').insert([
      {
        id: payment.id,
        team: payment.team,
        amount: payment.amount,
        category: payment.category,
        date: payment.date,
        field_fee: payment.distribution.field,
        admin_fee: payment.distribution.admin,
        ref_fee: payment.distribution.ref,
      },
    ]);
    if (error) throw error;
    return;
  }

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

export async function getFixtures() {
  ensureRemoteDb();
  const DB_TYPE = getDbType();
  if (DB_TYPE === 'supabase') {
    const { data, error } = await supabase.from('fixtures').select('*').order('id', { ascending: false });
    if (error) return [];
    return (data as any[]).map((f: any) => ({
      id: f.id,
      week: f.week,
      data: typeof f.data === 'string' ? JSON.parse(f.data) : f.data,
    }));
  }

  const pool = getNeonPool();
  const { rows } = await pool.query('SELECT * FROM public.fixtures ORDER BY created_at DESC');
  return rows.map((f: any) => ({ id: f.id, week: f.week, data: f.data }));
}

export async function addFixture(fixture: any) {
  ensureRemoteDb();
  const DB_TYPE = getDbType();
  if (DB_TYPE === 'supabase') {
    const { error } = await supabase.from('fixtures').upsert(
      [
        {
          id: fixture.id,
          week: fixture.week,
          data: JSON.stringify(fixture.data),
        },
      ],
      { onConflict: 'id' },
    );
    if (error) throw error;
    return;
  }

  const pool = getNeonPool();
  await pool.query(
    `INSERT INTO public.fixtures (id, week, data)
     VALUES ($1, $2, $3::jsonb)
     ON CONFLICT (id) DO UPDATE SET
       week = EXCLUDED.week,
       data = EXCLUDED.data`,
    [fixture.id, fixture.week, JSON.stringify(fixture.data)],
  );
}

export async function deleteFixture(id: string) {
  ensureRemoteDb();
  const DB_TYPE = getDbType();
  if (DB_TYPE === 'supabase') {
    const { error } = await supabase.from('fixtures').delete().eq('id', id);
    if (error) throw error;
    return;
  }

  const pool = getNeonPool();
  await pool.query('DELETE FROM public.fixtures WHERE id = $1', [id]);
}

export async function getWeeklyResults() {
  ensureRemoteDb();
  const DB_TYPE = getDbType();
  if (DB_TYPE === 'supabase') {
    const { data, error } = await supabase.from('weekly_results').select('*').order('id', { ascending: false });
    if (error) return [];
    return (data as any[]).map((r: any) => ({
      id: r.id,
      week: r.week,
      division: r.division,
      data: typeof r.data === 'string' ? JSON.parse(r.data) : r.data,
    }));
  }

  const pool = getNeonPool();
  const { rows } = await pool.query('SELECT * FROM public.weekly_results ORDER BY created_at DESC');
  return rows.map((r: any) => ({ 
    id: r.id, 
    week: r.week, 
    division: r.division, 
    data: r.data 
  }));
}

export async function addWeeklyResult(result: any) {
  ensureRemoteDb();
  const DB_TYPE = getDbType();
  if (DB_TYPE === 'supabase') {
    const { error } = await supabase.from('weekly_results').upsert(
      [
        {
          id: result.id,
          week: result.week,
          division: result.division,
          data: JSON.stringify(result.data),
        },
      ],
      { onConflict: 'id' },
    );
    if (error) throw error;
    return;
  }

  const pool = getNeonPool();
  await pool.query(
    `INSERT INTO public.weekly_results (id, week, division, data)
     VALUES ($1, $2, $3, $4::jsonb)
     ON CONFLICT (id) DO UPDATE SET
       week = EXCLUDED.week,
       division = EXCLUDED.division,
       data = EXCLUDED.data`,
    [result.id, result.week, result.division, JSON.stringify(result.data)],
  );
}

export async function deleteWeeklyResult(id: string) {
  ensureRemoteDb();
  const DB_TYPE = getDbType();
  if (DB_TYPE === 'supabase') {
    const { error } = await supabase.from('weekly_results').delete().eq('id', id);
    if (error) throw error;
    return;
  }

  const pool = getNeonPool();
  await pool.query('DELETE FROM public.weekly_results WHERE id = $1', [id]);
}

// ── PLAYERS ─────────────────────────────────────────────────────────────────

export async function getPlayers() {
  ensureRemoteDb();
  const DB_TYPE = getDbType();
  if (DB_TYPE === 'supabase') {
    const { data, error } = await supabase.from('players').select('*').order('name', { ascending: true });
    return error ? [] : data;
  }

  const pool = getNeonPool();
  const { rows } = await pool.query('SELECT * FROM public.players ORDER BY name ASC');
  return rows;
}

export async function addPlayer(player: any) {
  ensureRemoteDb();
  const DB_TYPE = getDbType();
  if (DB_TYPE === 'supabase') {
    const { error } = await supabase.from('players').upsert(
      [
        {
          id: player.id,
          name: player.name,
          team: player.team,
          position: player.position,
          yellow_cards: player.yellow_cards ?? 0,
          red_cards: player.red_cards ?? 0,
        },
      ],
      { onConflict: 'id' },
    );
    if (error) throw error;
    return;
  }

  const pool = getNeonPool();
  await pool.query(
    `INSERT INTO public.players (id, name, team, position, yellow_cards, red_cards)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (id) DO UPDATE SET
       name = EXCLUDED.name,
       team = EXCLUDED.team,
       position = EXCLUDED.position,
       yellow_cards = EXCLUDED.yellow_cards,
       red_cards = EXCLUDED.red_cards`,
    [player.id, player.name, player.team, player.position, player.yellow_cards ?? 0, player.red_cards ?? 0],
  );
}

export async function updatePlayerCards(id: string, yellow: number, red: number) {
  ensureRemoteDb();
  const DB_TYPE = getDbType();
  if (DB_TYPE === 'supabase') {
    const { error } = await supabase
      .from('players')
      .update({ yellow_cards: yellow, red_cards: red })
      .eq('id', id);
    if (error) throw error;
    return;
  }

  const pool = getNeonPool();
  await pool.query(
    'UPDATE public.players SET yellow_cards = $1, red_cards = $2 WHERE id = $3',
    [yellow, red, id],
  );
}

export async function deletePlayer(id: string) {
  ensureRemoteDb();
  const DB_TYPE = getDbType();
  if (DB_TYPE === 'supabase') {
    const { error } = await supabase.from('players').delete().eq('id', id);
    if (error) throw error;
    return;
  }

  const pool = getNeonPool();
  await pool.query('DELETE FROM public.players WHERE id = $1', [id]);
}

