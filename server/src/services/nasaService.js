/**
 * NASA NeoWs API Service (Server)
 * Uses shared package for NASA API integration
 */
import { createNasaService } from '@orbitra/shared';
import { db } from '../config/firebase.js';
import dotenv from 'dotenv';

dotenv.config();

// NASA API Configuration
const NASA_CONFIG = {
  NASA_BASE_URL: process.env.NASA_BASE_URL || 'https://api.nasa.gov/neo/rest/v1',
  NASA_API_KEY: process.env.NASA_API_KEY,
};

// Create and export NASA service instance
const nasaService = createNasaService(db, NASA_CONFIG);

// Export all methods
export const {
  fetchFeed,
  fetchLookup,
  fetchBrowse,
  getAsteroidFromCache,
  getAsteroidsByDateRange,
  saveDailyCache,
  getDailyCache,
} = nasaService;

export default nasaService;
