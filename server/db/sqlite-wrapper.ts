import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

// NOTE: this file is intended for local development only.
// Netlify Functions must not import it (it depends on better-sqlite3 native bindings).
import Database from 'better-sqlite3';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const userDefinedPath = process.env.USER_DATA_PATH;
const dbPath = userDefinedPath 
  ? path.join(userDefinedPath, 'zifa.db')
  : path.join(__dirname, '..', '..', 'zifa.db');

const db = new Database(dbPath);

export function initializeSqlite() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'admin'
    );

    CREATE TABLE IF NOT EXISTS matches (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      teamA TEXT NOT NULL,
      teamB TEXT NOT NULL,
      venue TEXT NOT NULL,
      time TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'League'
    );

    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      team TEXT NOT NULL,
      amount REAL NOT NULL,
      category TEXT NOT NULL,
      date TEXT NOT NULL,
      field_fee REAL NOT NULL,
      admin_fee REAL NOT NULL,
      ref_fee REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS fixtures (
      id TEXT PRIMARY KEY,
      week TEXT NOT NULL,
      data TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS weekly_results (
      id TEXT PRIMARY KEY,
      week TEXT NOT NULL,
      division TEXT NOT NULL,
      data TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS players (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      team TEXT NOT NULL,
      position TEXT NOT NULL,
      yellow_cards INTEGER DEFAULT 0,
      red_cards INTEGER DEFAULT 0
    );
  `);

  try {
    db.exec(`ALTER TABLE matches ADD COLUMN category TEXT NOT NULL DEFAULT 'League'`);
  } catch {}

  const existingAdmin = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');
  if (!existingAdmin) {
    const hash = bcrypt.hashSync('admin', 10);
    db.prepare('INSERT INTO users (id, username, password_hash, role) VALUES (?, ?, ?, ?)').run(
      'admin-user-1',
      'admin',
      hash,
      'admin',
    );
    console.log('[ZIFA] Admin user seeded: admin/admin');
  }
}

export async function getUserByUsername(username: string) {
  return db.prepare('SELECT * FROM users WHERE username = ?').get(username);
}

export async function getMatches() {
  return db.prepare('SELECT * FROM matches ORDER BY date ASC').all();
}

export async function addMatch(match: any) {
  db.prepare('INSERT INTO matches (id, date, teamA, teamB, venue, time, category) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
    match.id,
    match.date,
    match.teamA,
    match.teamB,
    match.venue,
    match.time,
    match.category || 'League',
  );
}

export async function deleteMatch(id: string) {
  db.prepare('DELETE FROM matches WHERE id = ?').run(id);
}

export async function getPayments() {
  const payments = db.prepare('SELECT * FROM payments ORDER BY date DESC').all();
  return payments.map((p: any) => ({
    id: p.id,
    team: p.team,
    amount: p.amount,
    category: p.category,
    date: p.date,
    distribution: { field: p.field_fee, admin: p.admin_fee, ref: p.ref_fee },
  }));
}

export async function addPayment(payment: any) {
  db.prepare(
    'INSERT INTO payments (id, team, amount, category, date, field_fee, admin_fee, ref_fee) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
  ).run(
    payment.id,
    payment.team,
    payment.amount,
    payment.category,
    payment.date,
    payment.distribution.field,
    payment.distribution.admin,
    payment.distribution.ref,
  );
}

export async function getFixtures() {
  const fixtures = db.prepare('SELECT * FROM fixtures ORDER BY rowid DESC').all();
  return fixtures.map((f: any) => ({ id: f.id, week: f.week, data: JSON.parse(f.data) }));
}

export async function addFixture(fixture: any) {
  db.prepare('INSERT OR REPLACE INTO fixtures (id, week, data) VALUES (?, ?, ?)').run(
    fixture.id,
    fixture.week,
    JSON.stringify(fixture.data),
  );
}

export async function deleteFixture(id: string) {
  db.prepare('DELETE FROM fixtures WHERE id = ?').run(id);
}

export async function getWeeklyResults() {
  const results = db.prepare('SELECT * FROM weekly_results ORDER BY rowid DESC').all();
  return results.map((r: any) => ({ 
    id: r.id, 
    week: r.week, 
    division: r.division,
    data: JSON.parse(r.data) 
  }));
}

export async function addWeeklyResult(result: any) {
  db.prepare('INSERT OR REPLACE INTO weekly_results (id, week, division, data) VALUES (?, ?, ?, ?)').run(
    result.id,
    result.week,
    result.division,
    JSON.stringify(result.data),
  );
}

export async function deleteWeeklyResult(id: string) {
  db.prepare('DELETE FROM weekly_results WHERE id = ?').run(id);
}

export async function getPlayers() {
  return db.prepare('SELECT * FROM players ORDER BY name ASC').all();
}

export async function addPlayer(player: any) {
  db.prepare('INSERT OR REPLACE INTO players (id, name, team, position, yellow_cards, red_cards) VALUES (?, ?, ?, ?, ?, ?)').run(
    player.id,
    player.name,
    player.team,
    player.position,
    player.yellow_cards || 0,
    player.red_cards || 0
  );
}

export async function updatePlayerCards(id: string, yellow: number, red: number) {
  db.prepare('UPDATE players SET yellow_cards = ?, red_cards = ? WHERE id = ?').run(yellow, red, id);
}

export async function deletePlayer(id: string) {
  db.prepare('DELETE FROM players WHERE id = ?').run(id);
}

