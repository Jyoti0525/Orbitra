/**
 * User Service
 * Handles user profile and activity history operations
 */
import { db, auth } from '../config/firebase.js';

/**
 * Get user profile with statistics
 * @param {string} uid - Firebase user ID
 * @returns {Promise<Object>} User profile with stats
 */
export const getUserProfile = async (uid) => {
  try {
    // Get Firebase Auth user data
    const userRecord = await auth.getUser(uid);

    // Get or create Firestore user document
    const userDocRef = db.collection('users').doc(uid);
    const userDoc = await userDocRef.get();

    let userData = {
      displayName: userRecord.displayName || userRecord.email?.split('@')[0] || 'Explorer',
      email: userRecord.email,
      photoURL: userRecord.photoURL,
      createdAt: userRecord.metadata.creationTime,
      preferences: {
        theme: 'dark',
        alertDelivery: 'dashboard',
      },
    };

    // If user doc exists in Firestore, use that data
    if (userDoc.exists) {
      userData = {
        ...userData,
        ...userDoc.data(),
      };
    } else {
      // Create initial user document
      await userDocRef.set({
        displayName: userData.displayName,
        email: userData.email,
        createdAt: userData.createdAt,
        preferences: userData.preferences,
      });
    }

    // Calculate statistics
    const stats = await getUserStats(uid);

    return {
      id: uid,
      ...userData,
      stats,
    };
  } catch (error) {
    console.error('Get user profile error (returning fallback):', error);

    // Return a fallback profile for ANY error to ensure UI loads
    // This handles network issues, auth config issues, missing user, etc.
    return {
      id: uid,
      displayName: 'Explorer',
      email: 'user@orbitra.com',
      photoURL: null,
      createdAt: new Date().toISOString(),
      preferences: {
        theme: 'dark',
        alertDelivery: 'dashboard',
      },
      stats: {
        watching: 0,
        activeAlerts: 0,
        totalSearches: 0,
        notificationsReceived: 0,
      },
      isFallback: true // Flag to let UI know this is a fallback
    };
  }
};

/**
 * Get user statistics
 * @param {string} uid - Firebase user ID
 * @returns {Promise<Object>} User statistics
 */
const getUserStats = async (uid) => {
  try {
    // Count watchlist items
    const watchlistSnapshot = await db
      .collection('watchlist')
      .where('userId', '==', uid)
      .get();
    const watching = watchlistSnapshot.size;

    // Count active alerts
    const alertsSnapshot = await db
      .collection('alerts')
      .where('userId', '==', uid)
      .where('isActive', '==', true)
      .get();
    const activeAlerts = alertsSnapshot.size;

    // Count total searches (approximation - can track this in future)
    const totalSearches = 0; // TODO: implement search tracking

    // Count notifications received
    const notificationsSnapshot = await db
      .collection('notifications')
      .where('userId', '==', uid)
      .get();
    const notificationsReceived = notificationsSnapshot.size;

    return {
      watching,
      activeAlerts,
      totalSearches,
      notificationsReceived,
    };
  } catch (error) {
    console.error('Get user stats error:', error);
    return {
      watching: 0,
      activeAlerts: 0,
      totalSearches: 0,
      notificationsReceived: 0,
    };
  }
};

/**
 * Update user profile
 * @param {string} uid - Firebase user ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated user data
 */
export const updateUserProfile = async (uid, updates) => {
  try {
    const allowedFields = ['displayName', 'preferences'];
    const filteredUpdates = {};

    // Filter allowed fields
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        filteredUpdates[field] = updates[field];
      }
    }

    if (Object.keys(filteredUpdates).length === 0) {
      throw new Error('No valid fields to update');
    }

    // Update Firestore document
    const userDocRef = db.collection('users').doc(uid);
    await userDocRef.update({
      ...filteredUpdates,
      updatedAt: new Date().toISOString(),
    });

    // If displayName changed, update Firebase Auth too
    if (filteredUpdates.displayName) {
      await auth.updateUser(uid, {
        displayName: filteredUpdates.displayName,
      });
    }

    // Return updated profile
    return await getUserProfile(uid);
  } catch (error) {
    console.error('Update user profile error:', error);
    throw new Error('Failed to update user profile');
  }
};

/**
 * Get user activity history
 * Combines watchlist adds, alert creations, and notifications into timeline
 * @param {string} uid - Firebase user ID
 * @param {number} limit - Maximum number of entries to return
 * @returns {Promise<Array>} Activity history timeline
 */
export const getUserHistory = async (uid, limit = 50) => {
  try {
    const history = [];

    // Get watchlist additions
    const watchlistSnapshot = await db
      .collection('watchlist')
      .where('userId', '==', uid)
      .orderBy('addedAt', 'desc')
      .limit(limit)
      .get();

    watchlistSnapshot.forEach((doc) => {
      const data = doc.data();
      history.push({
        type: 'watch',
        asteroidId: data.asteroidId,
        asteroidName: data.asteroidName || `(${data.asteroidId})`,
        riskScore: data.riskScore,
        timestamp: data.addedAt,
      });
    });

    // Get alert creations
    const alertsSnapshot = await db
      .collection('alerts')
      .where('userId', '==', uid)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    alertsSnapshot.forEach((doc) => {
      const data = doc.data();
      history.push({
        type: 'alert_created',
        alertType: data.alertType,
        threshold: data.thresholdValue,
        timestamp: data.createdAt,
      });
    });

    // Get notifications (alert triggers)
    const notificationsSnapshot = await db
      .collection('notifications')
      .where('userId', '==', uid)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    notificationsSnapshot.forEach((doc) => {
      const data = doc.data();
      history.push({
        type: 'alert_triggered',
        asteroidId: data.asteroidId,
        asteroidName: data.asteroidName || `(${data.asteroidId})`,
        message: data.message,
        timestamp: data.createdAt,
      });
    });

    // Sort by timestamp descending
    history.sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      return timeB - timeA;
    });

    // Return limited results
    return history.slice(0, limit);
    // Return limited results
    return history.slice(0, limit);
  } catch (error) {
    console.error('Get user history error:', error);
    // Return empty history instead of failing
    return [];
  }
};
