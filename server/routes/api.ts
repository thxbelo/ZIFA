import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import multer from 'multer';
import { parsePlayerExcel, parseWordFixtures, parsePdfFixtures } from '../utils/parsers.js';

const upload = multer({ storage: multer.memoryStorage() });

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
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/teams', requireAuth, async (req, res) => {
    try {
      await dbWrapper.addTeam(req.body);
      res.status(201).json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // SEASONS & COMPETITIONS
  router.get('/seasons', async (req, res) => {
    try {
      const seasons = await dbWrapper.getSeasons();
      res.json(seasons);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get('/competitions', async (req, res) => {
    try {
      const comps = await dbWrapper.getCompetitions();
      res.json(comps);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
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
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/matches', requireAuth, async (req, res) => {
    try {
      await dbWrapper.addMatch(req.body);
      
      // BROADCAST: Notify all clients of the update
      const io = req.app.get('io');
      if (io) {
        io.emit('matchUpdate', { matchId: req.body.id });
        io.emit('standingsUpdate', { competitionId: req.body.competition_id });
      }

      res.status(201).json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
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
      res.status(500).json({ error: err.message });
    }
  });

  router.patch('/matches/:id', requireAuth, async (req, res) => {
    try {
      const updatedMatch = await dbWrapper.updateMatch(req.params.id, req.body);

      const io = req.app.get('io');
      if (io && updatedMatch?.competition_id) {
        io.emit('matchUpdate', { matchId: req.params.id });
        io.emit('standingsUpdate', { competitionId: updatedMatch.competition_id });
      }

      res.json({ success: true, match: updatedMatch });
    } catch (err: any) {
      const status = err?.message?.includes('not found') ? 404 : 500;
      res.status(status).json({ error: err.message });
    }
  });

  // STANDINGS
  router.get('/standings/:competitionId', async (req, res) => {
    try {
      const standings = await dbWrapper.getStandings(req.params.competitionId);
      res.json(standings);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // PAYMENTS
  router.get('/payments', requireAuth, async (req, res) => {
    try {
      const payments = await dbWrapper.getPayments();
      res.json(payments);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/payments', requireAuth, async (req, res) => {
    try {
      await dbWrapper.addPayment(req.body);
      const io = req.app.get('io');
      if (io) {
        io.emit('paymentsUpdate');
      }
      res.status(201).json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/fixtures/upload', requireAuth, upload.single('file'), async (req, res) => {
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
      res.status(500).json({ error: err.message });
    }
  });

  // LEGACY BRIDGES (Keep for old components until fully refactored)
  router.post('/fixtures', requireAuth, async (req, res) => {
    try {
      await dbWrapper.addFixture(req.body);
      const io = req.app.get('io');
      if (io) {
        io.emit('fixturesUpdate', { fixtureId: req.body.id });
      }
      res.status(201).json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get('/fixtures', async (req, res) => {
    try {
      const fixtures = await dbWrapper.getFixtures();
      res.json(fixtures);
    } catch (err: any) {
      console.error('[API ERROR] /fixtures GET failed:', err);
      res.status(500).json({ error: err.message || 'Unknown database error' });
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
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/results', requireAuth, async (req, res) => {
    try {
      await dbWrapper.addWeeklyResult(req.body);
      const io = req.app.get('io');
      if (io) {
        io.emit('resultsUpdate', { resultId: req.body.id });
      }
      res.status(201).json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get('/results', async (req, res) => {
    try {
      const results = await dbWrapper.getWeeklyResults();
      res.json(results);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
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
      res.status(500).json({ error: err.message });
    }
  });

  // PLAYERS
  router.get('/players', async (req, res) => {
    try {
      const players = await dbWrapper.getPlayers();
      res.json(players);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/players', requireAuth, async (req, res) => {
    try {
      // Handle bulk array or single object
      const players = Array.isArray(req.body) ? req.body : [req.body];
      for (const p of players) {
        await dbWrapper.addPlayer(p);
      }
      const io = req.app.get('io');
      if (io) {
        io.emit('playersUpdate', { count: players.length });
      }
      res.status(201).json({ success: true, count: players.length });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  router.patch('/players/:id/cards', requireAuth, async (req, res) => {
    try {
      const { yellow_cards, red_cards } = req.body;
      await dbWrapper.updatePlayerCards(req.params.id, yellow_cards, red_cards);
      const io = req.app.get('io');
      if (io) {
        io.emit('playersUpdate', { playerId: req.params.id });
      }
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/players/upload', requireAuth, upload.single('file'), async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
      const players = parsePlayerExcel(req.file.buffer);
      for (const p of players) {
        // Generate a random ID if not present
        const pWithId = { ...p, id: 'p-' + Math.random().toString(36).slice(2, 9) };
        await dbWrapper.addPlayer(pWithId);
      }
      const io = req.app.get('io');
      if (io) {
        io.emit('playersUpdate', { count: players.length });
      }
      res.json({ success: true, count: players.length });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
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
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}
