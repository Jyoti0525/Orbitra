/**
 * User Routes
 * Handles user profile and activity history endpoints
 */
import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  getUserProfile,
  updateUserProfile,
  getUserHistory,
} from '../services/userService.js';

const router = express.Router();

/**
 * GET /api/user/profile
 * Get current user's profile with statistics
 * Requires authentication
 */
router.get('/profile', requireAuth, async (req, res) => {
  try {
    const uid = req.user.uid;
    const profile = await getUserProfile(uid);

    res.json({
      success: true,
      profile,
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * PUT /api/user/profile
 * Update current user's profile
 * Requires authentication
 * Body: { displayName?, preferences? }
 */
router.put('/profile', requireAuth, async (req, res) => {
  try {
    const uid = req.user.uid;
    const updates = req.body;

    const profile = await updateUserProfile(uid, updates);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      profile,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/user/history
 * Get current user's activity history
 * Requires authentication
 * Query params: limit (optional, default 50)
 */
router.get('/history', requireAuth, async (req, res) => {
  try {
    const uid = req.user.uid;
    const limit = parseInt(req.query.limit) || 50;

    const history = await getUserHistory(uid, limit);

    res.json({
      success: true,
      count: history.length,
      history,
    });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
