import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  addToWatchlist,
  removeFromWatchlist,
  getUserWatchlist,
  isInWatchlist,
} from '../services/watchlistService.js';

const router = express.Router();

// ── In-memory fallback when Firestore quota is exhausted ──
// Keyed by userId → Map of asteroidNeoId → entry data
const memoryWatchlist = new Map();

function getMemoryList(userId) {
  if (!memoryWatchlist.has(userId)) {
    memoryWatchlist.set(userId, new Map());
  }
  return memoryWatchlist.get(userId);
}

/**
 * GET /api/watchlist
 * Get user's watchlist with full asteroid data
 * Requires authentication
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user.uid;
    const watchlist = await getUserWatchlist(userId);

    // Merge in any memory-only entries
    const memList = getMemoryList(userId);
    const firestoreIds = new Set(watchlist.map(a => a.id));
    for (const [neoId, entry] of memList) {
      if (!firestoreIds.has(neoId)) {
        watchlist.push(entry);
      }
    }

    res.json({
      success: true,
      watchlist,
      count: watchlist.length,
    });
  } catch (error) {
    console.error('Get watchlist error:', error);

    if (error.message?.includes('RESOURCE_EXHAUSTED') || error.code === 8) {
      // Return memory-only entries
      const memList = getMemoryList(req.user.uid);
      const watchlist = Array.from(memList.values());
      return res.json({
        success: true,
        watchlist,
        count: watchlist.length,
      });
    }

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/watchlist/check/:neoId
 * Check if an asteroid is in user's watchlist
 * Requires authentication
 */
router.get('/check/:neoId', requireAuth, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { neoId } = req.params;

    const inWatchlist = await isInWatchlist(userId, neoId);

    // Also check memory fallback
    const memList = getMemoryList(userId);
    res.json({
      success: true,
      inWatchlist: inWatchlist || memList.has(neoId),
    });
  } catch (error) {
    console.error('Check watchlist error:', error);

    if (error.message?.includes('RESOURCE_EXHAUSTED') || error.code === 8) {
      const memList = getMemoryList(req.user.uid);
      return res.json({
        success: true,
        inWatchlist: memList.has(req.params.neoId),
      });
    }

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/watchlist/:neoId
 * Add an asteroid to watchlist
 * Requires authentication
 */
router.post('/:neoId', requireAuth, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { neoId } = req.params;

    const entry = await addToWatchlist(userId, neoId, req.body.asteroidData);

    res.json({
      success: true,
      message: 'Asteroid added to watchlist',
      entry,
    });
  } catch (error) {
    console.error('Add to watchlist error:', error);

    // Quota exhausted — fall back to in-memory
    if (error.message?.includes('Quota Exceeded') || error.message?.includes('RESOURCE_EXHAUSTED') || error.code === 8) {
      const userId = req.user.uid;
      const { neoId } = req.params;
      const asteroidData = req.body.asteroidData || {};
      const memList = getMemoryList(userId);

      if (memList.has(neoId)) {
        return res.status(400).json({
          success: false,
          error: 'Asteroid already in watchlist',
        });
      }

      const entry = {
        id: neoId,
        watchlistId: `mem_${Date.now()}`,
        asteroidNeoId: neoId,
        addedAt: new Date().toISOString(),
        name: asteroidData.name || `Asteroid ${neoId}`,
        riskScore: asteroidData.riskScore || 0,
        riskLevel: asteroidData.riskLevel || 'Unknown',
        isHazardous: asteroidData.isHazardous || false,
        ...asteroidData,
      };
      memList.set(neoId, entry);

      return res.json({
        success: true,
        message: 'Asteroid added to watchlist (in-memory)',
        entry,
      });
    }

    if (error.message === 'Asteroid already in watchlist') {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * DELETE /api/watchlist/:neoId
 * Remove an asteroid from watchlist
 * Requires authentication
 */
router.delete('/:neoId', requireAuth, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { neoId } = req.params;

    await removeFromWatchlist(userId, neoId);

    // Also remove from memory if present
    const memList = getMemoryList(userId);
    memList.delete(neoId);

    res.json({
      success: true,
      message: 'Asteroid removed from watchlist',
    });
  } catch (error) {
    console.error('Remove from watchlist error:', error);

    // Quota exhausted — try memory removal
    if (error.message?.includes('RESOURCE_EXHAUSTED') || error.message?.includes('Daily limit') || error.code === 8) {
      const memList = getMemoryList(req.user.uid);
      memList.delete(req.params.neoId);
      return res.json({
        success: true,
        message: 'Asteroid removed from watchlist',
      });
    }

    if (error.message === 'Watchlist entry not found') {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
