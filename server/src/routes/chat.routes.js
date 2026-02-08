/**
 * Chat Routes
 * Handles chat message endpoints
 */
import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  getChatMessages,
  addChatMessage,
  getOnlineUsersCount,
} from '../services/chatService.js';

const router = express.Router();

/**
 * GET /api/chat/messages
 * Get chat messages for a room
 * Query params: room (default: 'general'), limit (default: 50)
 * Requires authentication
 */
router.get('/messages', requireAuth, async (req, res) => {
  try {
    const room = req.query.room || 'general';
    const limit = parseInt(req.query.limit) || 50;

    const messages = await getChatMessages(room, limit);

    res.json({
      success: true,
      room,
      count: messages.length,
      messages,
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/chat/messages
 * Send a new chat message
 * Body: { message, room?, asteroidId? }
 * Requires authentication
 */
router.post('/messages', requireAuth, async (req, res) => {
  try {
    const { message, room = 'general', asteroidId } = req.body;
    const userId = req.user.uid;
    const displayName = req.user.name || req.user.email?.split('@')[0] || 'Explorer';

    const newMessage = await addChatMessage({
      userId,
      displayName,
      message,
      room,
      asteroidId,
    });

    res.json({
      success: true,
      message: newMessage,
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/chat/online
 * Get count of online users in a room
 * Query params: room (default: 'general')
 * Requires authentication
 */
router.get('/online', requireAuth, async (req, res) => {
  try {
    const room = req.query.room || 'general';
    const count = await getOnlineUsersCount(room);

    res.json({
      success: true,
      room,
      onlineCount: count,
    });
  } catch (error) {
    console.error('Get online count error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
