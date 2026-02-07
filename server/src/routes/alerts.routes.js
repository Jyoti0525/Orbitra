/**
 * Alerts Routes (Protected)
 * Placeholder for future implementation
 */
import express from 'express';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// All routes are protected
router.use(requireAuth);

/**
 * GET /api/alerts
 * Get user's alerts
 */
router.get('/', async (req, res) => {
  res.json({
    success: true,
    message: 'Alerts feature coming soon',
    alerts: [],
  });
});

/**
 * POST /api/alerts
 * Create new alert
 */
router.post('/', async (req, res) => {
  res.json({
    success: true,
    message: 'Alert created (placeholder)',
  });
});

/**
 * DELETE /api/alerts/:id
 * Delete alert
 */
router.delete('/:id', async (req, res) => {
  res.json({
    success: true,
    message: 'Alert deleted (placeholder)',
  });
});

export default router;
