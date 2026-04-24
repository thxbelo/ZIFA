import { z } from 'zod';

const id = z.string().trim().min(1).max(120);
const shortText = z.string().trim().min(1).max(160);
const optionalText = z.string().trim().max(300).optional().default('');
const score = z.coerce.number().int().min(0).max(99);

export const loginSchema = z.object({
  username: z.string().trim().min(1).max(80),
  password: z.string().min(1).max(200),
});

export const teamSchema = z.object({
  id: id.optional(),
  name: shortText,
  district: optionalText,
  stadium: optionalText,
  coach: optionalText,
  logo_url: z.string().trim().url().max(500).optional().or(z.literal('')),
}).passthrough();

export const matchSchema = z.object({
  id,
  date: optionalText,
  teamA: optionalText,
  teamB: optionalText,
  venue: optionalText,
  time: optionalText,
  category: optionalText,
  competition_id: optionalText,
  home_team_id: optionalText,
  away_team_id: optionalText,
  match_week: optionalText,
  status: z.enum(['not_started', 'in_progress', 'finished', 'postponed']).optional().default('not_started'),
  home_score: score.optional().default(0),
  away_score: score.optional().default(0),
  played: z.coerce.boolean().optional().default(false),
}).passthrough();

export const matchPatchSchema = matchSchema.partial().extend({
  home_score: score.optional(),
  away_score: score.optional(),
  played: z.coerce.boolean().optional(),
});

export const paymentSchema = z.object({
  id,
  team: shortText,
  amount: z.coerce.number().min(0).max(1_000_000),
  category: shortText,
  date: shortText,
  field_fee: z.coerce.number().min(0).max(1_000_000),
  admin_fee: z.coerce.number().min(0).max(1_000_000),
  ref_fee: z.coerce.number().min(0).max(1_000_000),
}).passthrough();

const fixtureGroupSchema = z.object({
  id,
  dayLabel: shortText,
  dateLabel: shortText,
  games: z.array(z.unknown()).max(80),
}).passthrough();

const fixtureDataSchema = z.object({
  id: id.optional(),
  league: shortText.optional(),
  sponsor: shortText.optional(),
  week: shortText.optional(),
  groups: z.array(fixtureGroupSchema).max(20).optional(),
}).passthrough();

export const fixtureSchema = z.object({
  id,
  week: shortText,
  data: fixtureDataSchema,
}).passthrough();

const resultDaySchema = z.object({
  id,
  date: shortText,
  label: z.enum(['RESULTS', 'FIXTURE']),
  matches: z.array(z.unknown()).max(80),
}).passthrough();

const resultDataSchema = z.object({
  id: id.optional(),
  division: shortText.optional(),
  week: shortText.optional(),
  days: z.array(resultDaySchema).max(20).optional(),
}).passthrough();

export const resultSchema = z.object({
  id,
  week: shortText,
  division: shortText,
  data: resultDataSchema,
}).passthrough();

export const playerSchema = z.object({
  id: id.optional(),
  name: shortText,
  team: shortText,
  position: optionalText,
  yellow_cards: z.coerce.number().int().min(0).max(50).optional().default(0),
  red_cards: z.coerce.number().int().min(0).max(50).optional().default(0),
  nationality: optionalText,
  jersey_number: z.coerce.number().int().min(0).max(999).optional(),
  age: z.coerce.number().int().min(5).max(80).optional(),
}).passthrough();

export const playerArraySchema = z.union([playerSchema, z.array(playerSchema).min(1).max(500)]);

export const cardsSchema = z.object({
  yellow_cards: z.coerce.number().int().min(0).max(50),
  red_cards: z.coerce.number().int().min(0).max(50),
});
