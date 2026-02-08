/**
 * NASA NeoWs API Service (Shared)
 * Fetches real asteroid data from NASA (NO MOCKING!)
 * Can be used by Express server or Firebase Functions
 */
import axios from 'axios';
import { Agent } from 'https';
import { calculateRiskScore, parseNumber } from './riskCalculator.js';

// Force IPv4 — Node.js on Alpine tries IPv6 first which times out
const httpsAgent = new Agent({ family: 4 });

/**
 * Create NASA service with Firestore db instance
 * @param {Object} db - Firestore database instance
 * @param {Object} config - Configuration { NASA_BASE_URL, NASA_API_KEY }
 * @returns {Object} NASA service methods
 */
export function createNasaService(db, config) {
  const NASA_BASE_URL = config.NASA_BASE_URL || 'https://api.nasa.gov/neo/rest/v1';
  const NASA_API_KEY = config.NASA_API_KEY;

  if (!NASA_API_KEY) {
    throw new Error('NASA_API_KEY is required');
  }

  /**
   * Fetch asteroid feed for a date range
   * @param {string} startDate - YYYY-MM-DD
   * @param {string} endDate - YYYY-MM-DD (optional, max 7 days from start)
   * @returns {Promise<Array>} Array of asteroid objects
   */
  async function fetchFeed(startDate, endDate = null) {
    try {
      const url = `${NASA_BASE_URL}/feed`;
      const params = {
        start_date: startDate,
        api_key: NASA_API_KEY,
      };

      if (endDate) {
        params.end_date = endDate;
      }

      console.log(`Fetching NASA feed: ${startDate} to ${endDate || startDate}`);
      const response = await axios.get(url, { params, httpsAgent, timeout: 30000 });

      // Parse asteroids (don't let Firestore writes block the response)
      const asteroids = [];
      const nearEarthObjects = response.data.near_earth_objects;

      for (const date in nearEarthObjects) {
        for (const asteroid of nearEarthObjects[date]) {
          asteroids.push(parseAsteroidData(asteroid));
        }
      }

      console.log(`Fetched ${asteroids.length} asteroids from NASA`);

      // Background save to Firestore (fire-and-forget, never blocks response)
      Promise.allSettled(asteroids.map(a => saveAsteroid(a))).catch(() => {});
      if (!endDate || startDate === endDate) {
        saveDailyCache(startDate, asteroids).catch(() => {});
      }

      return asteroids;
    } catch (error) {
      console.error('NASA Feed API error:', error.message || error.code || error);
      if (error.response) {
        console.error('NASA response status:', error.response.status, error.response.data);
      }

      // If this is a Firestore error (from background saves leaking), still return data
      if (error.code === 8 || error.message?.includes('RESOURCE_EXHAUSTED')) {
        console.warn('Firestore quota issue during feed fetch, ignoring');
        return [];
      }

      // Handle NASA API Quota Exceeded
      if (error.response?.status === 429 || error.message?.includes('429')) {
        console.warn('NASA API Quota Exceeded. Returning empty list to prevent crash.');
        return [];
      }

      throw new Error('Failed to fetch asteroid feed from NASA');
    }
  }

  /**
   * Fetch specific asteroid by ID
   * @param {string} neoId - Asteroid NEO ID
   * @returns {Promise<Object>} Asteroid object with orbital data
   */
  async function fetchLookup(neoId) {
    try {
      const url = `${NASA_BASE_URL}/neo/${neoId}`;
      const params = { api_key: NASA_API_KEY };

      console.log(`Fetching asteroid ${neoId} from NASA`);
      const response = await axios.get(url, { params, httpsAgent, timeout: 30000 });

      const parsed = parseAsteroidData(response.data);
      saveAsteroid(parsed).catch(() => {}); // background save

      return parsed;
    } catch (error) {
      console.error(`NASA Lookup API error for ${neoId}:`, error.message);
      throw new Error('Failed to fetch asteroid from NASA');
    }
  }

  /**
   * Browse asteroid catalog
   * @param {number} page - Page number (default 0)
   * @returns {Promise<Object>} { asteroids: Array, pagination: Object }
   */
  async function fetchBrowse(page = 0) {
    try {
      const url = `${NASA_BASE_URL}/neo/browse`;
      const params = {
        page,
        api_key: NASA_API_KEY,
      };

      console.log(`Browsing NASA catalog page ${page}`);
      const response = await axios.get(url, { params, httpsAgent, timeout: 30000 });

      const asteroids = response.data.near_earth_objects.map(parseAsteroidData);

      // Background save to Firestore (fire-and-forget)
      Promise.allSettled(asteroids.map(a => saveAsteroid(a))).catch(() => {});

      return {
        asteroids,
        pagination: {
          total: response.data.page.total_elements,
          totalPages: response.data.page.total_pages,
          size: response.data.page.size,
          currentPage: response.data.page.number,
        },
      };
    } catch (error) {
      console.error('NASA Browse API error:', error.message);
      throw new Error('Failed to browse asteroid catalog');
    }
  }

  /**
   * Parse raw NASA asteroid data
   * @param {Object} raw - Raw NASA API response
   * @returns {Object} Cleaned asteroid object
   */
  function parseAsteroidData(raw) {
    // Calculate risk score
    const { riskScore, riskLevel } = calculateRiskScore(raw);

    // Extract close approach data (only Earth approaches)
    const closeApproaches = (raw.close_approach_data || [])
      .filter(approach => approach.orbiting_body === 'Earth')
      .map(approach => ({
        date: approach.close_approach_date,
        dateTime: approach.close_approach_date_full,
        epochMs: approach.epoch_date_close_approach,
        velocityKmh: parseNumber(approach.relative_velocity?.kilometers_per_hour),
        velocityKms: parseNumber(approach.relative_velocity?.kilometers_per_second),
        missDistanceKm: parseNumber(approach.miss_distance?.kilometers),
        missDistanceAu: parseNumber(approach.miss_distance?.astronomical),
        missDistanceLunar: parseNumber(approach.miss_distance?.lunar),
        orbitingBody: approach.orbiting_body,
      }));

    return {
      id: raw.id,
      neoId: raw.neo_reference_id,
      name: raw.name,
      nasaJplUrl: raw.nasa_jpl_url,
      absoluteMagnitude: raw.absolute_magnitude_h,
      diameterMinKm: raw.estimated_diameter?.kilometers?.estimated_diameter_min || 0,
      diameterMaxKm: raw.estimated_diameter?.kilometers?.estimated_diameter_max || 0,
      diameterMinM: raw.estimated_diameter?.meters?.estimated_diameter_min || 0,
      diameterMaxM: raw.estimated_diameter?.meters?.estimated_diameter_max || 0,
      isHazardous: raw.is_potentially_hazardous_asteroid || false,
      isSentry: raw.is_sentry_object || false,
      sentryData: raw.sentry_data || null,
      riskScore,
      riskLevel,
      closeApproaches,
      orbitalData: raw.orbital_data || null,
      lastFetched: new Date().toISOString(),
    };
  }

  /**
   * Save asteroid to Firestore
   * @param {Object} asteroid - Parsed asteroid data
   */
  async function saveAsteroid(asteroid) {
    try {
      const asteroidRef = db.collection('asteroids').doc(asteroid.neoId);

      // Save main asteroid data
      await asteroidRef.set(asteroid, { merge: true });

      // Save close approaches as subcollection
      if (asteroid.closeApproaches && asteroid.closeApproaches.length > 0) {
        const batch = db.batch();

        asteroid.closeApproaches.forEach((approach, index) => {
          const approachRef = asteroidRef.collection('closeApproaches').doc(`${approach.epochMs}`);
          batch.set(approachRef, approach, { merge: true });
        });

        await batch.commit();
      }

      console.log(`Saved asteroid ${asteroid.neoId} to Firestore`);
    } catch (error) {
      console.error(`Error saving asteroid ${asteroid.neoId}:`, error.message);
    }
  }

  /**
   * Get asteroid from Firestore (cached)
   * @param {string} neoId - Asteroid NEO ID
   * @returns {Promise<Object|null>} Asteroid data or null
   */
  async function getAsteroidFromCache(neoId) {
    try {
      const doc = await db.collection('asteroids').doc(neoId).get();

      if (!doc.exists) {
        return null;
      }

      const data = doc.data();

      // Check if data is stale (older than 24 hours)
      const lastFetched = new Date(data.lastFetched);
      const now = new Date();
      const hoursSinceLastFetch = (now - lastFetched) / (1000 * 60 * 60);

      if (hoursSinceLastFetch > 24) {
        console.log(`Cached data for ${neoId} is stale, will refetch`);
        return null;
      }

      return data;
    } catch (error) {
      console.error(`Error getting asteroid from cache:`, error.message);
      return null;
    }
  }

  /**
   * Get asteroids from cache by date range
   * @param {string} startDate - YYYY-MM-DD
   * @param {string} endDate - YYYY-MM-DD (optional)
   * @returns {Promise<Array|null>} Array of asteroids or null if not fully cached
   */
  async function getAsteroidsByDateRange(startDate, endDate = null) {
    try {
      // For single day queries, try daily cache first (much faster!)
      if (!endDate || startDate === endDate) {
        const cached = await getDailyCache(startDate);
        if (cached) {
          console.log(`✅ Daily cache HIT for ${startDate}!`);
          return cached;
        }
        console.log(`❌ Daily cache MISS for ${startDate}, falling back to asteroid query`);
      }

      // Query asteroids with close approaches in the date range
      const start = new Date(startDate);
      const end = endDate ? new Date(endDate) : new Date(startDate);

      // Get all asteroids (we'll filter by close approach dates)
      const snapshot = await db.collection('asteroids')
        .where('lastFetched', '>', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Only fresh data
        .get();

      if (snapshot.empty) {
        return null;
      }

      const asteroids = [];
      snapshot.forEach(doc => {
        const data = doc.data();

        // Check if any close approach is in the date range
        const hasApproachInRange = data.closeApproaches?.some(approach => {
          const approachDate = new Date(approach.date);
          return approachDate >= start && approachDate <= end;
        });

        if (hasApproachInRange) {
          asteroids.push(data);
        }
      });

      console.log(`Found ${asteroids.length} cached asteroids for date range ${startDate} to ${endDate || startDate}`);
      return asteroids.length > 0 ? asteroids : null;
    } catch (error) {
      console.error(`Error getting asteroids from cache:`, error.message);
      return null;
    }
  }

  /**
   * Save daily cache for fast homepage loading
   * @param {string} date - YYYY-MM-DD
   * @param {Array} asteroids - Array of asteroid objects
   */
  async function saveDailyCache(date, asteroids) {
    try {
      // Calculate stats
      const neos = asteroids.length;
      const hazardous = asteroids.filter(a => a.isHazardous).length;

      let closestKm = Infinity;
      let fastestKmh = 0;

      asteroids.forEach(asteroid => {
        asteroid.closeApproaches?.forEach(approach => {
          if (approach.date === date) {
            const distance = parseNumber(approach.missDistanceKm);
            const velocity = parseNumber(approach.velocityKmh);

            if (distance < closestKm) closestKm = distance;
            if (velocity > fastestKmh) fastestKmh = velocity;
          }
        });
      });

      const cacheData = {
        date,
        asteroids,
        count: neos,
        stats: {
          neos,
          hazardous,
          closestKm: closestKm === Infinity ? 0 : closestKm,
          fastestKmh,
        },
        lastUpdated: new Date().toISOString(),
      };

      await db.collection('daily_cache').doc(date).set(cacheData);
      console.log(`💾 Saved daily cache for ${date} (${neos} asteroids)`);
    } catch (error) {
      console.error(`Error saving daily cache for ${date}:`, error.message);
    }
  }

  /**
   * Get daily cache for a specific date
   * @param {string} date - YYYY-MM-DD
   * @returns {Promise<Array|null>} Array of asteroids or null if not cached
   */
  async function getDailyCache(date) {
    try {
      const doc = await db.collection('daily_cache').doc(date).get();

      if (!doc.exists) {
        return null;
      }

      const data = doc.data();

      // Check if cache is stale (older than 24 hours)
      const lastUpdated = new Date(data.lastUpdated);
      const now = new Date();
      const hoursSinceUpdate = (now - lastUpdated) / (1000 * 60 * 60);

      if (hoursSinceUpdate > 24) {
        console.log(`⏰ Daily cache for ${date} is stale (${hoursSinceUpdate.toFixed(1)}h old)`);
        return null;
      }

      return data.asteroids;
    } catch (error) {
      console.error(`Error getting daily cache for ${date}:`, error.message);
      return null;
    }
  }

  return {
    fetchFeed,
    fetchLookup,
    fetchBrowse,
    getAsteroidFromCache,
    getAsteroidsByDateRange,
    saveDailyCache,
    getDailyCache,
  };
}

export default createNasaService;
