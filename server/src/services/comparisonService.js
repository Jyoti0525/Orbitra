/**
 * Comparison Service - Provides famous asteroids and top-risk data for risk comparison
 *
 * Features:
 * - Smart caching with 7-day expiry
 * - Auto-refresh stale data
 * - Fetches real NASA data for famous asteroids
 * - Queries Firestore for top riskiest asteroids
 */

import { db } from '../config/firebase.js';
import { fetchLookup } from './nasaService.js';
import { calculateRiskScore } from '@orbitra/shared';

// Famous asteroids for comparison (known high-risk or historically significant NEAs)
const FAMOUS_ASTEROIDS = [
  { id: '2099942', name: '99942 Apophis', description: 'Famous for 2029 close approach' },
  { id: '2101955', name: '101955 Bennu', description: 'OSIRIS-REx mission target' },
  { id: '2433', name: '433 Eros', description: 'First NEA discovered' },
  { id: '25143', name: '25143 Itokawa', description: 'Hayabusa mission target' },
  { id: '54509', name: '54509 YORP', description: 'YORP effect namesake' }
];

const CACHE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Check if cached data is stale
 * @param {number} timestamp - Firestore timestamp in milliseconds
 * @param {number} maxAgeMs - Maximum age in milliseconds
 * @returns {boolean} True if data is stale
 */
export function isDataStale(timestamp, maxAgeMs = CACHE_EXPIRY_MS) {
  if (!timestamp) return true;
  const now = Date.now();
  return (now - timestamp) > maxAgeMs;
}

/**
 * Fetch a single asteroid by ID from NASA API
 * @param {string} neoId - NASA NEO ID
 * @returns {Promise<object|null>} Asteroid data or null if error
 */
async function fetchAsteroidFromNASA(neoId) {
  try {
    const data = await fetchLookup(neoId);

    if (!data) {
      console.warn(`[ComparisonService] Asteroid ${neoId} not found in NASA API`);
      return null;
    }

    // Calculate risk score
    const { riskScore, riskLevel } = calculateRiskScore(data);

    // Extract relevant fields
    return {
      id: data.id,
      name: data.name,
      riskScore,
      riskLevel,
      isHazardous: data.is_potentially_hazardous_asteroid || false,
      diameterMinKm: data.estimated_diameter?.kilometers?.estimated_diameter_min || 0,
      diameterMaxKm: data.estimated_diameter?.kilometers?.estimated_diameter_max || 0,
      absoluteMagnitude: data.absolute_magnitude_h || null,
      nasaJplUrl: data.nasa_jpl_url || '',
      fetchedAt: Date.now()
    };
  } catch (error) {
    console.error(`[ComparisonService] Error fetching asteroid ${neoId}:`, error.message);
    return null;
  }
}

/**
 * Get famous asteroids from Firestore cache or fetch fresh if stale
 * @returns {Promise<Array>} Array of famous asteroid objects
 */
export async function getFamousAsteroids() {
  try {
    const famousRef = db.collection('asteroids');
    const famousIds = FAMOUS_ASTEROIDS.map(a => a.id);

    // Fetch all famous asteroids from cache
    const cachedDocs = await Promise.all(
      famousIds.map(id => famousRef.doc(id).get())
    );

    const results = [];
    const toFetch = [];

    // Check which asteroids need refreshing
    for (let i = 0; i < cachedDocs.length; i++) {
      const doc = cachedDocs[i];

      if (doc.exists) {
        const data = doc.data();

        // Check if data is stale
        if (!isDataStale(data.fetchedAt)) {
          results.push({
            id: doc.id,
            name: data.name,
            riskScore: data.riskScore,
            riskLevel: data.riskLevel,
            isHazardous: data.isHazardous,
            diameterMinKm: data.diameterMinKm,
            diameterMaxKm: data.diameterMaxKm,
            description: FAMOUS_ASTEROIDS[i].description
          });
        } else {
          toFetch.push(FAMOUS_ASTEROIDS[i]);
        }
      } else {
        toFetch.push(FAMOUS_ASTEROIDS[i]);
      }
    }

    // Fetch stale or missing asteroids
    if (toFetch.length > 0) {
      console.log(`[ComparisonService] Fetching ${toFetch.length} stale/missing famous asteroids from NASA API`);

      const freshData = await Promise.all(
        toFetch.map(asteroid => fetchAsteroidFromNASA(asteroid.id))
      );

      // Save to cache and add to results
      for (let i = 0; i < freshData.length; i++) {
        const data = freshData[i];

        if (data) {
          // Save to Firestore
          await famousRef.doc(data.id).set(data, { merge: true });

          results.push({
            id: data.id,
            name: data.name,
            riskScore: data.riskScore,
            riskLevel: data.riskLevel,
            isHazardous: data.isHazardous,
            diameterMinKm: data.diameterMinKm,
            diameterMaxKm: data.diameterMaxKm,
            description: toFetch[i].description
          });
        }
      }
    }

    // Sort by risk score descending
    results.sort((a, b) => b.riskScore - a.riskScore);

    console.log(`[ComparisonService] Returning ${results.length} famous asteroids`);
    return results;
  } catch (error) {
    console.error('[ComparisonService] Error getting famous asteroids:', error);
    throw error;
  }
}

/**
 * Get top riskiest asteroids from entire Firestore cache
 * @param {number} limit - Number of top asteroids to return
 * @returns {Promise<Array>} Array of top risk asteroid objects
 */
export async function getTopRiskAsteroids(limit = 10) {
  try {
    const snapshot = await db.collection('asteroids')
      .orderBy('riskScore', 'desc')
      .limit(limit)
      .get();

    const topRisk = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      topRisk.push({
        id: doc.id,
        name: data.name,
        riskScore: data.riskScore,
        riskLevel: data.riskLevel,
        isHazardous: data.isHazardous,
        diameterMinKm: data.diameterMinKm,
        diameterMaxKm: data.diameterMaxKm
      });
    });

    console.log(`[ComparisonService] Returning top ${topRisk.length} riskiest asteroids`);
    return topRisk;
  } catch (error) {
    console.error('[ComparisonService] Error getting top risk asteroids:', error);
    throw error;
  }
}

// Static fallback data for when API/DB usage is exceeded
const FALLBACK_DATASET = [
  { id: '2099942', name: '99942 Apophis', riskScore: 85, riskLevel: 'Critical', diameterMaxKm: 0.37, description: 'Famous for 2029 close approach' },
  { id: '2101955', name: '101955 Bennu', riskScore: 78, riskLevel: 'High', diameterMaxKm: 0.49, description: 'OSIRIS-REx mission target' },
  { id: '2433', name: '433 Eros', riskScore: 45, riskLevel: 'Medium', diameterMaxKm: 16.8, description: 'First NEA discovered' },
  { id: '25143', name: '25143 Itokawa', riskScore: 35, riskLevel: 'Low', diameterMaxKm: 0.53, description: 'Hayabusa mission target' },
  { id: '54509', name: '54509 YORP', riskScore: 60, riskLevel: 'Medium', diameterMaxKm: 0.12, description: 'YORP effect namesake' },
  { id: '2001566', name: '1566 Icarus', riskScore: 65, riskLevel: 'High', diameterMaxKm: 1.4, description: 'Highly eccentric orbit' }
];

/**
 * Get comprehensive comparison dataset (famous + top risk, deduplicated)
 * @returns {Promise<Array>} Combined and deduplicated comparison dataset
 */
export async function getComparisonDataset() {
  try {
    const [famous, topRisk] = await Promise.all([
      getFamousAsteroids().catch(e => {
        console.warn('Failed to fetch famous asteroids, using fallback:', e.message);
        return [];
      }),
      getTopRiskAsteroids(10).catch(e => {
        console.warn('Failed to fetch top risk asteroids, using empty:', e.message);
        return [];
      })
    ]);

    // If both failed (likely quota exceeded), return static fallback
    if (famous.length === 0 && topRisk.length === 0) {
      console.warn('[ComparisonService] Both sources failed, returning static fallback dataset');
      return FALLBACK_DATASET;
    }

    // Deduplicate by ID (famous asteroids take precedence to keep description)
    const seen = new Set();
    const combined = [];

    for (const asteroid of famous) {
      if (!seen.has(asteroid.id)) {
        seen.add(asteroid.id);
        combined.push(asteroid);
      }
    }

    for (const asteroid of topRisk) {
      if (!seen.has(asteroid.id)) {
        seen.add(asteroid.id);
        combined.push(asteroid);
      }
    }

    // Sort by risk score descending
    combined.sort((a, b) => b.riskScore - a.riskScore);

    console.log(`[ComparisonService] Comparison dataset: ${combined.length} asteroids (${famous.length} famous + ${topRisk.length - (combined.length - famous.length)} from top-risk)`);

    return combined.length > 0 ? combined : FALLBACK_DATASET;
  } catch (error) {
    console.error('[ComparisonService] Error building comparison dataset:', error);
    // Ultimate fallback
    return FALLBACK_DATASET;
  }
}
