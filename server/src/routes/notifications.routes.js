import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  getUserNotifications,
  markNotificationAsRead,
} from '../services/alertsService.js';

const router = express.Router();

/**
 * GET /api/notifications
 * Get user's notifications
 * Requires authentication
 * 
 * Query params:
 *   - limit: number (default: 50)
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user.uid;
    const limit = parseInt(req.query.limit) || 50;

    const notifications = await getUserNotifications(userId, limit);

    res.json({
      success: true,
      notifications,
      count: notifications.length,
    });
  } catch (error) {
    console.error('Get notifications error:', error);

    if (error.message?.includes('RESOURCE_EXHAUSTED') || error.code === 8) {
      return res.json({
        success: true,
        notifications: [],
        count: 0,
        warning: 'Firestore quota exceeded — showing cached data',
      });
    }

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * PATCH /api/notifications/:notificationId/read
 * Mark notification as read
 * Requires authentication
 */
router.patch('/:notificationId/read', requireAuth, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { notificationId } = req.params;

    await markNotificationAsRead(userId, notificationId);

    res.json({
      success: true,
      message: 'Notification marked as read',
    });
  } catch (error) {
    console.error('Mark notification as read error:', error);

    if (error.message.includes('not found') || error.message.includes('Unauthorized')) {
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
