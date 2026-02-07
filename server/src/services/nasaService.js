/**
 * NASA NeoWs API Service
 * Fetches real asteroid data from NASA (NO MOCKING!)
 */
import axios from 'axios';
import { db } from '../config/firebase.js';
import { calculateRiskScore, parseNumber } from '../utils/riskCalculator.js';
import dotenv from 'dotenv';

dotenv.config();

const NASA_BASE_URL = process.env.NASA_BASE_URL || 'https://api.nasa.gov/neo/rest/v1';
const NASA_API_KEY = process.env.NASA_API_KEY;

/**
 * Fetch asteroid feed for a date range
 * @param {string} startDate - YYYY-MM-DD
 * @param {string} endDate - YYYY-MM-DD (optional, max 7 days from start)
 * @returns {Promise<Array>} Array of asteroid objects
 */
export async function fetchFeed(startDate, endDate = null) {
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
    const response = await axios.get(url, { params });

    // Parse and save asteroids
    const asteroids = [];
    const nearEarthObjects = response.data.near_earth_objects;

    for (const date in nearEarthObjects) {
      for (const asteroid of nearEarthObjects[date]) {
        const parsed = parseAsteroidData(asteroid);
        await saveAsteroid(parsed);
        asteroids.push(parsed);
      }
    }

    console.log(`Fetched ${asteroids.length} asteroids from NASA`);
    return asteroids;
  } catch (error) {
    console.error('NASA Feed API error:', error.message);
    throw new Error('Failed to fetch asteroid feed from NASA');
  }
}

/**
 * Fetch specific asteroid by ID
 * @param {string} neoId - Asteroid NEO ID
 * @returns {Promise<Object>} Asteroid object with orbital data
 */
export async function fetchLookup(neoId) {
  try {
    const url = `${NASA_BASE_URL}/neo/${neoId}`;
    const params = { api_key: NASA_API_KEY };

    console.log(`Fetching asteroid ${neoId} from NASA`);
    const response = await axios.get(url, { params });

    const parsed = parseAsteroidData(response.data);
    await saveAsteroid(parsed);

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
export async function fetchBrowse(page = 0) {
  try {
    const url = `${NASA_BASE_URL}/neo/browse`;
    const params = {
      page,
      api_key: NASA_API_KEY,
    };

    console.log(`Browsing NASA catalog page ${page}`);
    const response = await axios.get(url, { params });

    const asteroids = response.data.near_earth_objects.map(parseAsteroidData);

    // Save all to Firestore
    for (const asteroid of asteroids) {
      await saveAsteroid(asteroid);
    }

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
export async function getAsteroidFromCache(neoId) {
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

export default {
  fetchFeed,
  fetchLookup,
  fetchBrowse,
  getAsteroidFromCache,
};
