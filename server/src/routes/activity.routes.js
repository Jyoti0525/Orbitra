import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getUserActivities } from '../services/activityService.js';

const router = express.Router();

/**
 * GET /api/activity
 * Get user's activity log
 * Requires authentication
 *
 * Query params:
 *   - limit: number (default: 20)
 *   - page: number (default: 1)
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user.uid;
    const limit = parseInt(req.query.limit) || 20;
    const page = parseInt(req.query.page) || 1;

    const result = await getUserActivities(userId, limit, page);

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Get activities error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
