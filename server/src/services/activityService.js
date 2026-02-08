import { db } from '../config/firebase.js';

/**
 * Firestore activities schema:
 * Collection: activities
 * Document ID: auto-generated
 * Fields:
 *   - userId: string (Firebase UID)
 *   - activityType: string ('watch' | 'unwatch' | 'create_alert' | 'delete_alert' | 'view_asteroid' | 'alert_triggered')
 *   - asteroidNeoId: string (optional - for asteroid-related activities)
 *   - asteroidName: string (optional)
 *   - alertId: string (optional - for alert-related activities)
 *   - details: object (additional activity-specific data)
 *   - createdAt: timestamp
 */

/**
 * Log a user activity
 * @param {string} userId - Firebase UID
 * @param {object} activityData - Activity details
 * @returns {Promise<object>} - Created activity entry
 */
async function logActivity(userId, activityData) {
  try {
    const { activityType, asteroidNeoId, asteroidName, alertId, details = {} } = activityData;

    const docRef = await db.collection('activities').add({
      userId,
      activityType,
      asteroidNeoId: asteroidNeoId || null,
      asteroidName: asteroidName || null,
      alertId: alertId || null,
      details,
      createdAt: new Date(),
    });

    return {
      id: docRef.id,
      userId,
      activityType,
      asteroidNeoId,
      asteroidName,
      alertId,
      details,
      createdAt: new Date(),
    };
  } catch (error) {
    console.error('Error logging activity:', error);
    throw error;
  }
}

/**
 * Get user activities with pagination
 * @param {string} userId - Firebase UID
 * @param {number} limit - Number of activities to fetch (default: 20)
 * @param {number} page - Page number (default: 1)
 * @returns {Promise<object>} - Activities with pagination info
 */
async function getUserActivities(userId, limit = 20, page = 1) {
  try {
    const offset = (page - 1) * limit;

    // Get total count
    const allSnapshot = await db.collection('activities')
      .where('userId', '==', userId)
      .get();
    const total = allSnapshot.size;

    // Get paginated results
    const snapshot = await db.collection('activities')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .offset(offset)
      .get();

    const activities = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return {
      activities,
      total,
      page,
      limit,
      hasMore: (page * limit) < total,
    };
  } catch (error) {
    console.error('Error getting user activities:', error);
    throw error;
  }
}

/**
 * Format activity description for display
 * @param {object} activity - Activity object
 * @returns {string} - Formatted description
 */
function formatActivityDescription(activity) {
  const { activityType, asteroidName, details } = activity;

  switch (activityType) {
    case 'watch':
      return `Watched asteroid ${asteroidName} (Risk: ${details.riskLevel || 'Unknown'} ${details.riskScore || ''})`;

    case 'unwatch':
      return `Removed ${asteroidName} from watchlist`;

    case 'create_alert':
      const condition = details.condition || '';
      const value = details.value || '';
      return `Created alert: ${details.alertType} ${condition} ${value}`;

    case 'delete_alert':
      return `Deleted alert: ${details.alertType}`;

    case 'view_asteroid':
      return `Viewed asteroid ${asteroidName}`;

    case 'alert_triggered':
      return `Alert triggered: ${asteroidName} ${details.reason || ''}`;

    case 'impact_simulation':
      return `Viewed impact simulation for ${asteroidName}`;

    default:
      return `Activity: ${activityType}`;
  }
}

export {
  logActivity,
  getUserActivities,
  formatActivityDescription,
};
