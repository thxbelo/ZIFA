import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';

type DbWrapper = {
  getMatches: () => Promise<any[]>;
  addMatch: (match: any) => Promise<void>;
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

export function createApiRouter(dbWrapper: DbWrapper) {
  const router = Router();

  // MATCHES
  router.get('/matches', async (req, res) => {
    try {
      const matches = await dbWrapper.getMatches();
      res.json(matches);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/matches', requireAuth, async (req, res) => {
    try {
      await dbWrapper.addMatch(req.body);
      res.status(201).json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  router.delete('/matches/:id', requireAuth, async (req, res) => {
    try {
      await dbWrapper.deleteMatch(req.params.id);
      res.json({ success: true });
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
      res.status(201).json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // FIXTURES
  router.get('/fixtures', async (req, res) => {
    try {
      const fixtures = await dbWrapper.getFixtures();
      res.json(fixtures);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/fixtures', requireAuth, async (req, res) => {
    try {
      await dbWrapper.addFixture(req.body);
      res.status(201).json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  router.delete('/fixtures/:id', requireAuth, async (req, res) => {
    try {
      await dbWrapper.deleteFixture(req.params.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // WEEKLY RESULTS
  router.get('/results', async (req, res) => {
    try {
      const results = await dbWrapper.getWeeklyResults();
      res.json(results);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/results', requireAuth, async (req, res) => {
    try {
      await dbWrapper.addWeeklyResult(req.body);
      res.status(201).json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  router.delete('/results/:id', requireAuth, async (req, res) => {
    try {
      await dbWrapper.deleteWeeklyResult(req.params.id);
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
      await dbWrapper.addPlayer(req.body);
      res.status(201).json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  router.patch('/players/:id/cards', requireAuth, async (req, res) => {
    try {
      const { yellow_cards, red_cards } = req.body;
      await dbWrapper.updatePlayerCards(req.params.id, yellow_cards, red_cards);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  router.delete('/players/:id', requireAuth, async (req, res) => {
    try {
      await dbWrapper.deletePlayer(req.params.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}

