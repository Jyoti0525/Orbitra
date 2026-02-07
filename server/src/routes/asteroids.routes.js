/**
 * Asteroid Routes
 */
import express from 'express';
import {
  fetchFeed,
  fetchLookup,
  fetchBrowse,
  getAsteroidFromCache,
} from '../services/nasaService.js';

const router = express.Router();

/**
 * GET /api/asteroids/feed
 * Get asteroid feed for date range
 * Query params: start_date (required), end_date (optional)
 */
router.get('/feed', async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    if (!start_date) {
      return res.status(400).json({
        success: false,
        error: 'start_date is required (YYYY-MM-DD)'
      });
    }

    const asteroids = await fetchFeed(start_date, end_date);

    res.json({
      success: true,
      count: asteroids.length,
      asteroids,
    });
  } catch (error) {
    console.error('Feed route error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/asteroids/:neoId
 * Get specific asteroid by ID
 */
router.get('/:neoId', async (req, res) => {
  try {
    const { neoId } = req.params;

    // Check cache first
    let asteroid = await getAsteroidFromCache(neoId);

    // If not in cache or stale, fetch from NASA
    if (!asteroid) {
      asteroid = await fetchLookup(neoId);
    }

    res.json({
      success: true,
      asteroid,
    });
  } catch (error) {
    console.error('Lookup route error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/asteroids/browse
 * Browse asteroid catalog
 * Query params: page (default 0)
 */
router.get('/browse', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 0;
    const result = await fetchBrowse(page);

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Browse route error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
