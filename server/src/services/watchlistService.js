import { db } from '../config/firebase.js';
import { getAsteroidsByDateRange } from './nasaService.js';
import { logActivity } from './activityService.js';

/**
 * Firestore watchlist schema:
 * Collection: watchlist
 * Document ID: auto-generated
 * Fields:
 *   - userId: string (Firebase UID)
 *   - asteroidNeoId: string (NEO reference ID)
 *   - addedAt: timestamp
 */

/**
 * Add an asteroid to user's watchlist
 * @param {string} userId - Firebase UID
 * @param {string} asteroidNeoId - NEO reference ID
 * @param {object} asteroidData - Asteroid data (optional, for logging)
 * @returns {Promise<object>} - Added watchlist entry
 */
async function addToWatchlist(userId, asteroidNeoId, asteroidData = null) {
  try {
    // Check if already exists
    const existing = await db.collection('watchlist')
      .where('userId', '==', userId)
      .where('asteroidNeoId', '==', asteroidNeoId)
      .get();

    if (!existing.empty) {
      throw new Error('Asteroid already in watchlist');
    }

    const docRef = await db.collection('watchlist').add({
      userId,
      asteroidNeoId,
      addedAt: new Date(),
      // Store visualization data to allow rendering without fresh fetch
      storedData: asteroidData || {},
    });

    // Log activity
    try {
      await logActivity(userId, {
        activityType: 'watch',
        asteroidNeoId,
        asteroidName: asteroidData?.name || asteroidNeoId,
        details: {
          riskLevel: asteroidData?.riskLevel || 'Unknown',
          riskScore: asteroidData?.riskScore || 0,
          isHazardous: asteroidData?.isHazardous || false,
        },
      });
    } catch (logError) {
      console.error('Failed to log watch activity:', logError);
      // Don't fail the watchlist add if logging fails
    }

    return {
      id: docRef.id,
      userId,
      asteroidNeoId,
      addedAt: new Date(),
    };
  } catch (error) {
    console.error('Error adding to watchlist:', error);
    if (error.code === 8 || error.message.includes('RESOURCE_EXHAUSTED')) {
      throw new Error('Daily limit reached (Quota Exceeded). Please try again tomorrow.');
    }
    throw error;
  }
}

/**
 * Remove an asteroid from user's watchlist
 * @param {string} userId - Firebase UID
 * @param {string} asteroidNeoId - NEO reference ID
 * @param {object} asteroidData - Asteroid data (optional, for logging)
 * @returns {Promise<void>}
 */
async function removeFromWatchlist(userId, asteroidNeoId, asteroidData = null) {
  try {
    const snapshot = await db.collection('watchlist')
      .where('userId', '==', userId)
      .where('asteroidNeoId', '==', asteroidNeoId)
      .get();

    if (snapshot.empty) {
      throw new Error('Watchlist entry not found');
    }

    // Delete all matching entries (should only be one)
    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();

    // Log activity
    try {
      await logActivity(userId, {
        activityType: 'unwatch',
        asteroidNeoId,
        asteroidName: asteroidData?.name || asteroidNeoId,
        details: {},
      });
    } catch (logError) {
      console.error('Failed to log unwatch activity:', logError);
      // Don't fail the watchlist remove if logging fails
    }
  } catch (error) {
    console.error('Error removing from watchlist:', error);
    if (error.code === 8 || error.message?.includes('RESOURCE_EXHAUSTED')) {
      throw new Error('Daily limit reached. Cannot remove items right now.');
    }
    throw error;
  }
}

/**
 * Get user's watchlist with full asteroid data
 * @param {string} userId - Firebase UID
 * @returns {Promise<Array>} - Array of asteroids with watchlist metadata
 */
async function getUserWatchlist(userId) {
  try {
    const snapshot = await db.collection('watchlist')
      .where('userId', '==', userId)
      // .orderBy('addedAt', 'desc') // Removed to avoid needing composite index
      .get();

    if (snapshot.empty) {
      return [];
    }

    // Fetch asteroid data from cache (last 7 days worth)
    // This is explicitly for "Recent" context, but watchlist items might be older
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const startDate = sevenDaysAgo.toISOString().split('T')[0];
    const endDate = today.toISOString().split('T')[0];

    const allAsteroids = await getAsteroidsByDateRange(startDate, endDate);

    // Match watchlist entries with asteroid data
    const watchlistWithData = [];
    snapshot.docs.forEach(doc => {
      const watchlistEntry = doc.data();
      const freshData = allAsteroids.find(a => a.id === watchlistEntry.asteroidNeoId);
      const storedData = watchlistEntry.storedData || {};

      // Merge fresh data with stored data, fresh takes precedence
      // If no fresh data (asteroid out of 7-day range), use stored
      const combinedData = {
        ...storedData,
        ...freshData,
        id: watchlistEntry.asteroidNeoId,
      };

      // Only add if we have at least a name (valid data)
      if (combinedData.name) {
        watchlistWithData.push({
          watchlistId: doc.id,
          addedAt: watchlistEntry.addedAt,
          ...combinedData,
        });
      }
    });

    // Sort in memory (descending by addedAt)
    return watchlistWithData.sort((a, b) => {
      const dateA = a.addedAt?.toDate ? a.addedAt.toDate() : new Date(a.addedAt);
      const dateB = b.addedAt?.toDate ? b.addedAt.toDate() : new Date(b.addedAt);
      return dateB - dateA;
    });
  } catch (error) {
    console.error('Error getting watchlist:', error);
    if (error.code === 8 || error.message?.includes('RESOURCE_EXHAUSTED')) {
      // Return empty list instead of crashing, maybe with a flag? 
      // For now, just empty list to allow page load.
      console.warn('Returning empty watchlist due to quota exceeded');
      return [];
    }
    throw error;
  }
}

/**
 * Check if an asteroid is in user's watchlist
 * @param {string} userId - Firebase UID
 * @param {string} asteroidNeoId - NEO reference ID
 * @returns {Promise<boolean>}
 */
async function isInWatchlist(userId, asteroidNeoId) {
  try {
    const snapshot = await db.collection('watchlist')
      .where('userId', '==', userId)
      .where('asteroidNeoId', '==', asteroidNeoId)
      .limit(1)
      .get();

    return !snapshot.empty;
  } catch (error) {
    console.error('Error checking watchlist:', error);
    throw error;
  }
}

export {
  addToWatchlist,
  removeFromWatchlist,
  getUserWatchlist,
  isInWatchlist,
};
