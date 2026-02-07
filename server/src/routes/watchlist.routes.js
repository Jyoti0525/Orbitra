/**
 * Watchlist Routes (Protected)
 */
import express from 'express';
import { db } from '../config/firebase.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// All routes are protected
router.use(requireAuth);

/**
 * GET /api/watchlist
 * Get user's watchlist
 */
router.get('/', async (req, res) => {
  try {
    const userId = req.user.uid;

    const snapshot = await db
      .collection('watchlist')
      .where('userId', '==', userId)
      .orderBy('addedAt', 'desc')
      .get();

    const watchlist = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json({
      success: true,
      count: watchlist.length,
      watchlist,
    });
  } catch (error) {
    console.error('Get watchlist error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch watchlist'
    });
  }
});

/**
 * POST /api/watchlist/:neoId
 * Add asteroid to watchlist
 */
router.post('/:neoId', async (req, res) => {
  try {
    const userId = req.user.uid;
    const { neoId } = req.params;

    // Check if already in watchlist
    const existing = await db
      .collection('watchlist')
      .where('userId', '==', userId)
      .where('asteroidId', '==', neoId)
      .get();

    if (!existing.empty) {
      return res.status(400).json({
        success: false,
        error: 'Asteroid already in watchlist'
      });
    }

    // Add to watchlist
    const doc = await db.collection('watchlist').add({
      userId,
      asteroidId: neoId,
      addedAt: new Date().toISOString(),
      alertEnabled: true,
    });

    res.json({
      success: true,
      message: 'Added to watchlist',
      id: doc.id,
    });
  } catch (error) {
    console.error('Add to watchlist error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add to watchlist'
    });
  }
});

/**
 * DELETE /api/watchlist/:neoId
 * Remove asteroid from watchlist
 */
router.delete('/:neoId', async (req, res) => {
  try {
    const userId = req.user.uid;
    const { neoId } = req.params;

    const snapshot = await db
      .collection('watchlist')
      .where('userId', '==', userId)
      .where('asteroidId', '==', neoId)
      .get();

    if (snapshot.empty) {
      return res.status(404).json({
        success: false,
        error: 'Asteroid not in watchlist'
      });
    }

    // Delete all matching documents (should be only 1)
    const batch = db.batch();
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();

    res.json({
      success: true,
      message: 'Removed from watchlist',
    });
  } catch (error) {
    console.error('Remove from watchlist error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove from watchlist'
    });
  }
});

export default router;
