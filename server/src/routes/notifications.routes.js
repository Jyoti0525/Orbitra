/**
 * Notifications Routes (Protected)
 * Placeholder for future implementation
 */
import express from 'express';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// All routes are protected
router.use(requireAuth);

/**
 * GET /api/notifications
 * Get user's notifications
 */
router.get('/', async (req, res) => {
  res.json({
    success: true,
    message: 'Notifications feature coming soon',
    notifications: [],
  });
});

/**
 * PATCH /api/notifications/:id
 * Mark notification as read
 */
router.patch('/:id', async (req, res) => {
  res.json({
    success: true,
    message: 'Notification marked as read (placeholder)',
  });
});

export default router;
