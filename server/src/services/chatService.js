/**
 * Chat Service
 * Handles chat message operations with Firestore
 */
import { db } from '../config/firebase.js';

/**
 * Get chat messages for a room
 * @param {string} room - Chat room name
 * @param {number} limit - Maximum number of messages to return
 * @returns {Promise<Array>} Array of chat messages
 */
export const getChatMessages = async (room = 'general', limit = 50) => {
  try {
    const snapshot = await db
      .collection('chat_messages')
      .where('room', '==', room)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    const messages = [];
    snapshot.forEach((doc) => {
      messages.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    // Reverse to get chronological order (oldest first)
    return messages.reverse();
  } catch (error) {
    console.error('Get chat messages error:', error);
    throw new Error('Failed to fetch chat messages');
  }
};

/**
 * Add a new chat message
 * @param {Object} messageData - Message data
 * @param {string} messageData.userId - User ID
 * @param {string} messageData.displayName - User display name
 * @param {string} messageData.message - Message content
 * @param {string} messageData.room - Chat room (default: 'general')
 * @param {string} messageData.asteroidId - Optional asteroid ID for context
 * @returns {Promise<Object>} Created message object
 */
export const addChatMessage = async ({
  userId,
  displayName,
  message,
  room = 'general',
  asteroidId = null,
}) => {
  try {
    // Validate required fields
    if (!userId || !displayName || !message) {
      throw new Error('userId, displayName, and message are required');
    }

    // Sanitize message
    const sanitizedMessage = message.trim().slice(0, 500); // Max 500 chars

    if (!sanitizedMessage) {
      throw new Error('Message cannot be empty');
    }

    // Create message document
    const messageDoc = {
      userId,
      displayName,
      message: sanitizedMessage,
      room,
      asteroidId,
      createdAt: new Date().toISOString(),
    };

    // Add to Firestore
    const docRef = await db.collection('chat_messages').add(messageDoc);

    return {
      id: docRef.id,
      ...messageDoc,
    };
  } catch (error) {
    console.error('Add chat message error:', error);
    throw new Error(error.message || 'Failed to add chat message');
  }
};

/**
 * Get online users count (approximation based on recent messages)
 * @param {string} room - Chat room name
 * @param {number} minutesThreshold - Minutes to consider a user as online
 * @returns {Promise<number>} Number of active users
 */
export const getOnlineUsersCount = async (room = 'general', minutesThreshold = 15) => {
  try {
    const thresholdTime = new Date();
    thresholdTime.setMinutes(thresholdTime.getMinutes() - minutesThreshold);

    const snapshot = await db
      .collection('chat_messages')
      .where('room', '==', room)
      .where('createdAt', '>=', thresholdTime.toISOString())
      .get();

    // Get unique user IDs
    const uniqueUsers = new Set();
    snapshot.forEach((doc) => {
      uniqueUsers.add(doc.data().userId);
    });

    return uniqueUsers.size;
  } catch (error) {
    console.error('Get online users count error:', error);
    return 0;
  }
};
