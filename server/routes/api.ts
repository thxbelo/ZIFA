import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import multer from 'multer';
import { parsePlayerExcel, parseWordFixtures, parsePdfFixtures } from '../utils/parsers.js';
import { getMaxUploadBytes } from '../config/security.js';
import { sendError, statusFromError, validateBody } from '../utils/http.js';
import {
  cardsSchema,
  fixtureSchema,
  matchPatchSchema,
  matchSchema,
  paymentSchema,
  playerArraySchema,
  playerSchema,
  resultSchema,
  teamSchema,
} from '../validation/schemas.js';

const fixtureMimeTypes = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

const playerMimeTypes = new Set([
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'text/csv',
]);

function fileUpload(allowedExtensions: string[], allowedMimeTypes: Set<string>) {
  return multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: getMaxUploadBytes(), files: 1 },
    fileFilter: (req, file, cb) => {
      const ext = file.originalname.split('.').pop()?.toLowerCase() || '';
      if (allowedExtensions.includes(ext) && allowedMimeTypes.has(file.mimetype)) {
        cb(null, true);
        return;
      }
      cb(Object.assign(new Error(`Unsupported file format. Allowed: ${allowedExtensions.join(', ')}`), { status: 400 }));
    },
  });
}

const fixtureUpload = fileUpload(['docx', 'pdf'], fixtureMimeTypes);
const playerUpload = fileUpload(['xlsx', 'xls', 'csv'], playerMimeTypes);

type DbWrapper = {
  getMatches: (filters?: any) => Promise<any[]>;
  addMatch: (match: any) => Promise<void>;
  updateMatch: (id: string, updates: any) => Promise<any>;
  deleteMatch: (id: string) => Promise<void>;
  getPayments: () => Promise<any[]>;
  addPayment: (payment: any) => Promise<void>;
  getFixtures: () => Promise<any[]>;
  addFixture: (fixture: any) => Promise<void>;
  deleteFixture: (id: string) => Promise<void>;
  getWeeklyResults: () => Promise<any[]>;
  addWeeklyResult: (result: any) => Promise<void>;
  deleteWeeklyResult: (id: string) => Promise<void>;
  getPlayers: () => Promise<any[]>;
  addPlayer: (player: any) => Promise<void>;
  updatePlayerCards: (id: string, yellow: number, red: number) => Promise<void>;
  deletePlayer: (id: string) => Promise<void>;
};

export function createApiRouter(dbWrapper: any) {
  const router = Router();

  // TEAMS
  router.get('/teams', async (req, res) => {
    try {
      const teams = await dbWrapper.getTeams();
      res.json(teams);
    } catch (err: any) {
      sendError(res, err, 'GET /teams');
    }
  });

  router.post('/teams', requireAuth, async (req, res) => {
    try {
      await dbWrapper.addTeam(validateBody(teamSchema, req.body));
      res.status(201).json({ success: true });
    } catch (err: any) {
      sendError(res, err, 'POST /teams', statusFromError(err));
    }
  });

  // SEASONS & COMPETITIONS
  router.get('/seasons', async (req, res) => {
    try {
      const seasons = await dbWrapper.getSeasons();
      res.json(seasons);
    } catch (err: any) {
      sendError(res, err, 'GET /seasons');
    }
  });

  router.get('/competitions', async (req, res) => {
    try {
      const comps = await dbWrapper.getCompetitions();
      res.json(comps);
    } catch (err: any) {
      sendError(res, err, 'GET /competitions');
    }
  });

  // MATCHES
  router.get('/matches', async (req, res) => {
    try {
      const { competitionId, unplayed, played } = req.query;
      const matches = await dbWrapper.getMatches({
        competitionId: competitionId as string | undefined,
        unplayed: unplayed === 'true',
        played: played === 'true',
      });
      res.json(matches);
    } catch (err: any) {
      sendError(res, err, 'GET /matches');
    }
  });

  router.post('/matches', requireAuth, async (req, res) => {
    try {
      const match = validateBody(matchSchema, req.body);
      await dbWrapper.addMatch(match);
      
      // BROADCAST: Notify all clients of the update
      const io = req.app.get('io');
      if (io) {
        io.emit('matchUpdate', { matchId: match.id });
        io.emit('standingsUpdate', { competitionId: match.competition_id });
      }

      res.status(201).json({ success: true });
    } catch (err: any) {
      sendError(res, err, 'POST /matches', statusFromError(err));
    }
  });

  router.delete('/matches/:id', requireAuth, async (req, res) => {
    try {
      await dbWrapper.deleteMatch(req.params.id);
      const io = req.app.get('io');
      if (io && req.query.competitionId) {
        io.emit('standingsUpdate', { competitionId: req.query.competitionId });
      }
      res.json({ success: true });
    } catch (err: any) {
      sendError(res, err, 'DELETE /matches/:id');
    }
  });

  router.patch('/matches/:id', requireAuth, async (req, res) => {
    try {
      const updates = validateBody(matchPatchSchema, req.body);
      const updatedMatch = await dbWrapper.updateMatch(req.params.id, updates);

      const io = req.app.get('io');
      if (io && updatedMatch?.competition_id) {
        io.emit('matchUpdate', { matchId: req.params.id });
        io.emit('standingsUpdate', { competitionId: updatedMatch.competition_id });
      }

      res.json({ success: true, match: updatedMatch });
    } catch (err: any) {
      sendError(res, err, 'PATCH /matches/:id', statusFromError(err));
    }
  });

  // STANDINGS
  router.get('/standings/:competitionId', async (req, res) => {
    try {
      const standings = await dbWrapper.getStandings(req.params.competitionId);
      res.json(standings);
    } catch (err: any) {
      sendError(res, err, 'GET /standings/:competitionId');
    }
  });

  // PAYMENTS
  router.get('/payments', requireAuth, async (req, res) => {
    try {
      const payments = await dbWrapper.getPayments();
      res.json(payments);
    } catch (err: any) {
      sendError(res, err, 'GET /payments');
    }
  });

  router.post('/payments', requireAuth, async (req, res) => {
    try {
      await dbWrapper.addPayment(validateBody(paymentSchema, req.body));
      const io = req.app.get('io');
      if (io) {
        io.emit('paymentsUpdate');
      }
      res.status(201).json({ success: true });
    } catch (err: any) {
      sendError(res, err, 'POST /payments', statusFromError(err));
    }
  });

  router.post('/fixtures/upload', requireAuth, fixtureUpload.single('file'), async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
      
      let lines: string[] = [];
      const ext = req.file.originalname.split('.').pop()?.toLowerCase();
      
      if (ext === 'docx') {
        lines = await parseWordFixtures(req.file.buffer);
      } else if (ext === 'pdf') {
        lines = await parsePdfFixtures(req.file.buffer);
      } else {
        return res.status(400).json({ error: 'Unsupported file format (only .docx and .pdf supported)' });
      }

      // Return the parsed lines so the user can review/edit them in the UI before saving to DB
      res.json({ success: true, lines });
    } catch (err: any) {
      sendError(res, err, 'POST /fixtures/upload', statusFromError(err));
    }
  });

  // LEGACY BRIDGES (Keep for old components until fully refactored)
  router.post('/fixtures', requireAuth, async (req, res) => {
    try {
      const fixture = validateBody(fixtureSchema, req.body);
      await dbWrapper.addFixture(fixture);
      const io = req.app.get('io');
      if (io) {
        io.emit('fixturesUpdate', { fixtureId: fixture.id });
      }
      res.status(201).json({ success: true });
    } catch (err: any) {
      sendError(res, err, 'POST /fixtures', statusFromError(err));
    }
  });

  router.get('/fixtures', async (req, res) => {
    try {
      const fixtures = await dbWrapper.getFixtures();
      res.json(fixtures);
    } catch (err: any) {
      sendError(res, err, 'GET /fixtures');
    }
  });

  router.delete('/fixtures/:id', requireAuth, async (req, res) => {
    try {
      await dbWrapper.deleteFixture(req.params.id);
      const io = req.app.get('io');
      if (io) {
        io.emit('fixturesUpdate', { fixtureId: req.params.id, deleted: true });
      }
      res.json({ success: true });
    } catch (err: any) {
      sendError(res, err, 'DELETE /fixtures/:id');
    }
  });

  router.post('/results', requireAuth, async (req, res) => {
    try {
      const result = validateBody(resultSchema, req.body);
      await dbWrapper.addWeeklyResult(result);
      const io = req.app.get('io');
      if (io) {
        io.emit('resultsUpdate', { resultId: result.id });
      }
      res.status(201).json({ success: true });
    } catch (err: any) {
      sendError(res, err, 'POST /results', statusFromError(err));
    }
  });

  router.get('/results', async (req, res) => {
    try {
      const results = await dbWrapper.getWeeklyResults();
      res.json(results);
    } catch (err: any) {
      sendError(res, err, 'GET /results');
    }
  });

  router.delete('/results/:id', requireAuth, async (req, res) => {
    try {
      await dbWrapper.deleteWeeklyResult(req.params.id);
      const io = req.app.get('io');
      if (io) {
        io.emit('resultsUpdate', { resultId: req.params.id, deleted: true });
      }
      res.json({ success: true });
    } catch (err: any) {
      sendError(res, err, 'DELETE /results/:id');
    }
  });

  // PLAYERS
  router.get('/players', async (req, res) => {
    try {
      const players = await dbWrapper.getPlayers();
      res.json(players);
    } catch (err: any) {
      sendError(res, err, 'GET /players');
    }
  });

  router.post('/players', requireAuth, async (req, res) => {
    try {
      // Handle bulk array or single object
      const parsed = validateBody(playerArraySchema, req.body);
      const players = Array.isArray(parsed) ? parsed : [parsed];
      for (const p of players) {
        await dbWrapper.addPlayer(p);
      }
      const io = req.app.get('io');
      if (io) {
        io.emit('playersUpdate', { count: players.length });
      }
      res.status(201).json({ success: true, count: players.length });
    } catch (err: any) {
      sendError(res, err, 'POST /players', statusFromError(err));
    }
  });

  router.patch('/players/:id/cards', requireAuth, async (req, res) => {
    try {
      const { yellow_cards, red_cards } = validateBody(cardsSchema, req.body);
      await dbWrapper.updatePlayerCards(req.params.id, yellow_cards, red_cards);
      const io = req.app.get('io');
      if (io) {
        io.emit('playersUpdate', { playerId: req.params.id });
      }
      res.json({ success: true });
    } catch (err: any) {
      sendError(res, err, 'PATCH /players/:id/cards', statusFromError(err));
    }
  });

  router.post('/players/upload', requireAuth, playerUpload.single('file'), async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
      const players = parsePlayerExcel(req.file.buffer);
      for (const p of players) {
        // Generate a random ID if not present
        const pWithId = validateBody(playerSchema, { ...p, id: 'p-' + Math.random().toString(36).slice(2, 9) });
        await dbWrapper.addPlayer(pWithId);
      }
      const io = req.app.get('io');
      if (io) {
        io.emit('playersUpdate', { count: players.length });
      }
      res.json({ success: true, count: players.length });
    } catch (err: any) {
      sendError(res, err, 'POST /players/upload', statusFromError(err));
    }
  });

  router.delete('/players/:id', requireAuth, async (req, res) => {
    try {
      await dbWrapper.deletePlayer(req.params.id);
      const io = req.app.get('io');
      if (io) {
        io.emit('playersUpdate', { playerId: req.params.id, deleted: true });
      }
      res.json({ success: true });
    } catch (err: any) {
      sendError(res, err, 'DELETE /players/:id');
    }
  });

  return router;
}
