import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  createAlert,
  getUserAlerts,
  deleteAlert,
  toggleAlert,
} from '../services/alertsService.js';

const router = express.Router();

/**
 * GET /api/alerts
 * Get user's alert rules
 * Requires authentication
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user.uid;
    const alerts = await getUserAlerts(userId);

    res.json({
      success: true,
      alerts,
      count: alerts.length,
    });
  } catch (error) {
    console.error('Get alerts error:', error);

    // Handle Firestore quota exceeded — return empty list so UI still loads
    if (error.message?.includes('RESOURCE_EXHAUSTED') || error.code === 8) {
      return res.json({
        success: true,
        alerts: [],
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
 * POST /api/alerts
 * Create a new alert rule
 * Requires authentication
 * 
 * Body:
 * {
 *   "alertType": "distance" | "diameter" | "hazardous" | "sentry",
 *   "thresholdValue": number,
 *   "isActive": boolean (optional, defaults to true)
 * }
 */
router.post('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { alertType, thresholdValue, isActive } = req.body;

    if (!alertType) {
      return res.status(400).json({
        success: false,
        error: 'alertType is required',
      });
    }

    const alert = await createAlert(userId, {
      alertType,
      thresholdValue,
      isActive,
    });

    res.json({
      success: true,
      message: 'Alert created successfully',
      alert,
    });
  } catch (error) {
    console.error('Create alert error:', error);

    if (error.message.includes('Invalid alert type')) {
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
 * PATCH /api/alerts/:alertId/toggle
 * Toggle alert active status
 * Requires authentication
 * 
 * Body:
 * {
 *   "isActive": boolean
 * }
 */
router.patch('/:alertId/toggle', requireAuth, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { alertId } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'isActive must be a boolean',
      });
    }

    const alert = await toggleAlert(userId, alertId, isActive);

    res.json({
      success: true,
      message: 'Alert updated successfully',
      alert,
    });
  } catch (error) {
    console.error('Toggle alert error:', error);

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

/**
 * DELETE /api/alerts/:alertId
 * Delete an alert rule
 * Requires authentication
 */
router.delete('/:alertId', requireAuth, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { alertId } = req.params;

    await deleteAlert(userId, alertId);

    res.json({
      success: true,
      message: 'Alert deleted successfully',
    });
  } catch (error) {
    console.error('Delete alert error:', error);

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
