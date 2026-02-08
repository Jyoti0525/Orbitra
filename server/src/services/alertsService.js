import { db } from '../config/firebase.js';
import { logActivity } from './activityService.js';

/**
 * Firestore alerts schema:
 * Collection: alerts
 * Document ID: auto-generated
 * Fields:
 *   - userId: string (Firebase UID)
 *   - alertType: string ('distance' | 'diameter' | 'hazardous' | 'sentry')
 *   - thresholdValue: number (km for distance, meters for diameter, boolean for hazardous/sentry)
 *   - isActive: boolean
 *   - createdAt: timestamp
 *   - updatedAt: timestamp
 */

/**
 * Firestore notifications schema:
 * Collection: notifications
 * Document ID: auto-generated
 * Fields:
 *   - userId: string (Firebase UID)
 *   - alertId: string (reference to alert that triggered)
 *   - asteroidNeoId: string (NEO reference ID)
 *   - asteroidName: string
 *   - message: string
 *   - triggeredAt: timestamp
 *   - isRead: boolean
 */

/**
 * Create a new alert rule
 * @param {string} userId - Firebase UID
 * @param {object} alertData - Alert configuration
 * @returns {Promise<object>} - Created alert
 */
async function createAlert(userId, alertData) {
  try {
    const { alertType, thresholdValue, isActive = true } = alertData;

    // Validate alert type
    const validTypes = ['distance', 'diameter', 'hazardous', 'sentry'];
    if (!validTypes.includes(alertType)) {
      throw new Error(`Invalid alert type. Must be one of: ${validTypes.join(', ')}`);
    }

    const docRef = await db.collection('alerts').add({
      userId,
      alertType,
      thresholdValue,
      isActive,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const newAlert = {
      id: docRef.id,
      userId,
      alertType,
      thresholdValue,
      isActive,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Log activity
    try {
      await logActivity(userId, {
        activityType: 'create_alert',
        alertId: docRef.id,
        details: {
          alertType,
          condition: alertType === 'distance' ? '<' : alertType === 'diameter' ? '>' : '==',
          value: thresholdValue,
        },
      });
    } catch (logError) {
      console.error('Failed to log create_alert activity:', logError);
      // Don't fail the alert creation if logging fails
    }

    return newAlert;
  } catch (error) {
    console.error('Error creating alert:', error);
    throw error;
  }
}

/**
 * Get all alerts for a user
 * @param {string} userId - Firebase UID
 * @returns {Promise<Array>} - Array of alert rules
 */
async function getUserAlerts(userId) {
  try {
    const snapshot = await db.collection('alerts')
      .where('userId', '==', userId)
      .where('userId', '==', userId)
      // .orderBy('createdAt', 'desc') // Removed to avoid index error
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Error getting user alerts:', error);
    throw error;
  }
}

/**
 * Delete an alert rule
 * @param {string} userId - Firebase UID
 * @param {string} alertId - Alert document ID
 * @returns {Promise<void>}
 */
async function deleteAlert(userId, alertId) {
  try {
    const docRef = db.collection('alerts').doc(alertId);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new Error('Alert not found');
    }

    // Verify ownership
    if (doc.data().userId !== userId) {
      throw new Error('Unauthorized to delete this alert');
    }

    const alertData = doc.data();
    await docRef.delete();

    // Log activity
    try {
      await logActivity(userId, {
        activityType: 'delete_alert',
        alertId,
        details: {
          alertType: alertData.alertType,
        },
      });
    } catch (logError) {
      console.error('Failed to log delete_alert activity:', logError);
      // Don't fail the alert deletion if logging fails
    }
  } catch (error) {
    console.error('Error deleting alert:', error);
    throw error;
  }
}

/**
 * Toggle alert active status
 * @param {string} userId - Firebase UID
 * @param {string} alertId - Alert document ID
 * @param {boolean} isActive - New active status
 * @returns {Promise<object>} - Updated alert
 */
async function toggleAlert(userId, alertId, isActive) {
  try {
    const docRef = db.collection('alerts').doc(alertId);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new Error('Alert not found');
    }

    // Verify ownership
    if (doc.data().userId !== userId) {
      throw new Error('Unauthorized to update this alert');
    }

    await docRef.update({
      isActive,
      updatedAt: new Date(),
    });

    return {
      id: alertId,
      ...doc.data(),
      isActive,
      updatedAt: new Date(),
    };
  } catch (error) {
    console.error('Error toggling alert:', error);
    throw error;
  }
}

/**
 * Create a notification when an alert is triggered
 * @param {string} userId - Firebase UID
 * @param {string} alertId - Alert document ID
 * @param {object} asteroidData - Asteroid that triggered the alert
 * @param {string} message - Notification message
 * @returns {Promise<object>} - Created notification
 */
async function createNotification(userId, alertId, asteroidData, message) {
  try {
    const docRef = await db.collection('notifications').add({
      userId,
      alertId,
      asteroidNeoId: asteroidData.id,
      asteroidName: asteroidData.name,
      message,
      triggeredAt: new Date(),
      isRead: false,
    });

    return {
      id: docRef.id,
      userId,
      alertId,
      asteroidNeoId: asteroidData.id,
      asteroidName: asteroidData.name,
      message,
      triggeredAt: new Date(),
      isRead: false,
    };
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
}

/**
 * Get user's notifications
 * @param {string} userId - Firebase UID
 * @param {number} limit - Max number of notifications to return
 * @returns {Promise<Array>} - Array of notifications
 */
async function getUserNotifications(userId, limit = 50) {
  try {
    const snapshot = await db.collection('notifications')
      .where('userId', '==', userId)
      .orderBy('triggeredAt', 'desc')
      .limit(limit)
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Error getting notifications:', error);
    throw error;
  }
}

/**
 * Mark notification as read
 * @param {string} userId - Firebase UID
 * @param {string} notificationId - Notification document ID
 * @returns {Promise<void>}
 */
async function markNotificationAsRead(userId, notificationId) {
  try {
    const docRef = db.collection('notifications').doc(notificationId);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new Error('Notification not found');
    }

    // Verify ownership
    if (doc.data().userId !== userId) {
      throw new Error('Unauthorized to update this notification');
    }

    await docRef.update({
      isRead: true,
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
}

/**
 * Check if an asteroid matches an alert rule
 * @param {object} asteroid - Asteroid data
 * @param {object} alert - Alert rule
 * @returns {boolean} - True if asteroid matches alert criteria
 */
function asteroidMatchesAlert(asteroid, alert) {
  const { alertType, thresholdValue } = alert;

  switch (alertType) {
    case 'distance': {
      const approach = asteroid.closeApproaches?.[0];
      if (!approach) return false;
      return approach.missDistanceKm < thresholdValue;
    }

    case 'diameter': {
      const diameter = asteroid.diameterMaxM || 0;
      return diameter > thresholdValue;
    }

    case 'hazardous': {
      return asteroid.isHazardous === true;
    }

    case 'sentry': {
      return asteroid.isSentry === true;
    }

    default:
      return false;
  }
}

/**
 * Generate notification message for an alert
 * @param {object} asteroid - Asteroid data
 * @param {object} alert - Alert rule
 * @returns {string} - Notification message
 */
function generateNotificationMessage(asteroid, alert) {
  const { alertType, thresholdValue } = alert;

  switch (alertType) {
    case 'distance': {
      const approach = asteroid.closeApproaches?.[0];
      const distance = approach ? (approach.missDistanceKm / 1000).toFixed(0) : 'unknown';
      return `${asteroid.name} passed within ${distance}K km`;
    }

    case 'diameter': {
      const diameter = asteroid.diameterMaxM || 0;
      return `${asteroid.name} detected, ${diameter.toFixed(0)}m diameter`;
    }

    case 'hazardous': {
      const size = asteroid.diameterMaxM || 0;
      return `${asteroid.name} flagged hazardous, ${size.toFixed(0)}m`;
    }

    case 'sentry': {
      return `${asteroid.name} added to Sentry risk table`;
    }

    default:
      return `${asteroid.name} triggered alert`;
  }
}

/**
 * Get all active alerts from all users (for cron job)
 * @returns {Promise<Array>} - Array of active alerts
 */
async function getAllActiveAlerts() {
  try {
    const snapshot = await db.collection('alerts')
      .where('isActive', '==', true)
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Error getting all active alerts:', error);
    throw error;
  }
}

export {
  createAlert,
  getUserAlerts,
  deleteAlert,
  toggleAlert,
  createNotification,
  getUserNotifications,
  markNotificationAsRead,
  asteroidMatchesAlert,
  generateNotificationMessage,
  getAllActiveAlerts,
};
