/**
 * Asteroid Routes
 */
import express from 'express';
import {
  fetchFeed,
  fetchLookup,
  fetchBrowse,
  getAsteroidFromCache,
  getAsteroidsByDateRange,
} from '../services/nasaService.js';
import {
  getComparisonDataset,
  getTopRiskAsteroids,
} from '../services/comparisonService.js';

const router = express.Router();

/**
 * GET /api/asteroids/feed
 * Get asteroid feed for date range
 * Query params: start_date (required), end_date (optional)
 */
router.get('/feed', async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    if (!start_date) {
      return res.status(400).json({
        success: false,
        error: 'start_date is required (YYYY-MM-DD)'
      });
    }

    // Check cache first (< 1 second)
    console.log(`Checking cache for ${start_date} to ${end_date || start_date}`);
    let asteroids = await getAsteroidsByDateRange(start_date, end_date);

    // If not in cache or stale, fetch from NASA (60+ seconds)
    if (!asteroids || asteroids.length === 0) {
      console.log('Cache miss or stale, fetching from NASA...');
      asteroids = await fetchFeed(start_date, end_date);
    } else {
      console.log(`Cache hit! Found ${asteroids.length} asteroids`);
    }

    res.json({
      success: true,
      count: asteroids.length,
      asteroids,
    });
  } catch (error) {
    console.error('Feed route error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/asteroids/dashboard-batch
 * Get all Dashboard data in a single request (optimized)
 * Returns: stats, watchlist count, alerts count, notifications count
 */
router.get('/dashboard-batch', async (req, res) => {
  try {
    const userId = req.user?.uid;

    console.log('[Dashboard Batch] Fetching all dashboard data in one request');

    // Fetch stats (already fast from cache)
    const today = new Date().toISOString().split('T')[0];
    let asteroids = await getAsteroidsByDateRange(today, today);

    if (!asteroids || asteroids.length === 0) {
      asteroids = await fetchFeed(today, today);
    }

    // Calculate statistics (from stats endpoint)
    const total_today = asteroids.length;
    const hazardous_count = asteroids.filter(a => a.isHazardous).length;

    const riskDistribution = { low: 0, medium: 0, high: 0, critical: 0 };
    asteroids.forEach(asteroid => {
      const score = asteroid.riskScore || 0;
      if (score >= 70) riskDistribution.critical++;
      else if (score >= 40) riskDistribution.high++;
      else if (score >= 20) riskDistribution.medium++;
      else riskDistribution.low++;
    });

    let closest_km = Infinity;
    let fastest_kmh = 0;

    asteroids.forEach(asteroid => {
      const todayApproach = asteroid.closeApproaches?.find(
        approach => approach.date === today
      ) || asteroid.closeApproaches?.[0];

      if (todayApproach) {
        const distance = parseFloat(todayApproach.missDistanceKm || Infinity);
        const velocity = parseFloat(todayApproach.velocityKmh || 0);

        if (distance < closest_km) closest_km = distance;
        if (velocity > fastest_kmh) fastest_kmh = velocity;
      }
    });

    const stats = {
      total_today,
      hazardous_count,
      closest_km: closest_km === Infinity ? 0 : Math.round(closest_km),
      fastest_kmh: Math.round(fastest_kmh),
      risk_distribution: riskDistribution,
    };

    // Return batch response
    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error('[Dashboard Batch] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/asteroids/stats
 * Get today's asteroid statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Get today's asteroids from cache
    console.log(`Fetching stats for ${today}`);
    let asteroids = await getAsteroidsByDateRange(today, today);

    // If not in cache, fetch from NASA
    if (!asteroids || asteroids.length === 0) {
      console.log('Cache miss, fetching from NASA for stats...');
      asteroids = await fetchFeed(today, today);
    }

    // Fallback: If still empty (e.g. Quota Exceeded), try yesterday's cached data
    if (!asteroids || asteroids.length === 0) {
      console.warn('Today stats empty, attempting fallback to yesterday...');
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      asteroids = await getAsteroidsByDateRange(yesterdayStr, yesterdayStr);
      if (asteroids && asteroids.length > 0) {
        console.log(`Fallback successful: Using ${asteroids.length} asteroids from ${yesterdayStr}`);
      }
    }

    // Calculate statistics
    const total_today = asteroids.length;
    const hazardous_count = asteroids.filter(a => a.isHazardous).length;

    // Calculate risk distribution
    const riskDistribution = { low: 0, medium: 0, high: 0, critical: 0 };
    asteroids.forEach(asteroid => {
      const score = asteroid.riskScore || 0;
      if (score >= 70) riskDistribution.critical++;
      else if (score >= 40) riskDistribution.high++;
      else if (score >= 20) riskDistribution.medium++;
      else riskDistribution.low++;
    });

    // Find closest and fastest
    let closest_km = Infinity;
    let fastest_kmh = 0;
    let asteroidOfDay = null;
    let maxInterestScore = 0;

    asteroids.forEach(asteroid => {
      // Get today's approach data (using camelCase from cache)
      const todayApproach = asteroid.closeApproaches?.find(
        approach => approach.date === today
      ) || asteroid.closeApproaches?.[0];

      if (todayApproach) {
        const distance = parseFloat(todayApproach.missDistanceKm || Infinity);
        const velocity = parseFloat(todayApproach.velocityKmh || 0);

        if (distance < closest_km) closest_km = distance;
        if (velocity > fastest_kmh) fastest_kmh = velocity;

        // Calculate "interest score" for asteroid of the day
        // Higher score = closer + bigger + faster
        const size = parseFloat(asteroid.diameterMaxKm || 0);
        const interestScore = (1 / (distance + 1)) * size * 1000 + velocity / 1000;

        if (interestScore > maxInterestScore) {
          maxInterestScore = interestScore;
          asteroidOfDay = {
            id: asteroid.id,
            name: asteroid.name,
            diameter_km: size,
            velocity_kmh: velocity,
            miss_distance_km: distance,
            is_hazardous: asteroid.isHazardous,
            nasa_jpl_url: asteroid.nasaJplUrl,
          };
        }
      }
    });

    res.json({
      success: true,
      stats: {
        total_today,
        hazardous_count,
        closest_km: closest_km === Infinity ? 0 : Math.round(closest_km),
        fastest_kmh: Math.round(fastest_kmh),
        asteroid_of_day: asteroidOfDay,
        risk_distribution: riskDistribution,
      },
    });
  } catch (error) {
    console.error('Stats route error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/asteroids/comparison-dataset
 * Get comprehensive comparison dataset (famous asteroids + top-risk from cache)
 * For use in risk comparison visualizations
 */
router.get('/comparison-dataset', async (req, res) => {
  try {
    console.log('[API] Fetching comparison dataset...');

    const dataset = await getComparisonDataset();

    res.json({
      success: true,
      count: dataset.length,
      asteroids: dataset,
    });
  } catch (error) {
    console.error('Comparison dataset route error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/asteroids/top-risk
 * Get top riskiest asteroids from entire cache
 * Query params: limit (default 10, max 50)
 */
router.get('/top-risk', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);

    console.log(`[API] Fetching top ${limit} riskiest asteroids...`);

    const topRisk = await getTopRiskAsteroids(limit);

    res.json({
      success: true,
      count: topRisk.length,
      asteroids: topRisk,
    });
  } catch (error) {
    console.error('Top risk route error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/asteroids/browse
 * Browse asteroid catalog
 * Query params: page (default 0)
 */
router.get('/browse', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 0;
    const result = await fetchBrowse(page);

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Browse route error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/asteroids/random
 * Get a random asteroid from the NASA Browse catalog
 */
router.get('/random', async (req, res) => {
  try {
    // NASA Browse has ~2,102 pages with ~20 asteroids each
    const randomPage = Math.floor(Math.random() * 2102);
    console.log(`Fetching random asteroid from page ${randomPage}`);

    const result = await fetchBrowse(randomPage);

    if (!result.asteroids || result.asteroids.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No asteroids found on this page'
      });
    }

    const randomIndex = Math.floor(Math.random() * result.asteroids.length);
    const asteroid = result.asteroids[randomIndex];

    res.json({
      success: true,
      asteroid,
    });
  } catch (error) {
    console.error('Random route error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/asteroids/trends
 * Get historical asteroid trend data for past N days
 * Query params: days (default 7)
 */
router.get('/trends', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;

    if (days < 1 || days > 30) {
      return res.status(400).json({
        success: false,
        error: 'days parameter must be between 1 and 30'
      });
    }

    console.log(`Fetching trends for past ${days} days`);

    const trends = [];
    const today = new Date();

    // Loop backwards through past N days
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];

      // Try cache first
      let asteroids = await getAsteroidsByDateRange(dateString, dateString);

      // If not in cache, fetch from NASA (will be slow first time)
      if (!asteroids || asteroids.length === 0) {
        console.log(`Cache miss for ${dateString}, fetching from NASA...`);
        try {
          asteroids = await fetchFeed(dateString, dateString);
        } catch (error) {
          console.error(`Failed to fetch ${dateString}:`, error.message);
          // Push zero data for this day if NASA fetch fails
          trends.push({
            date: dateString,
            total: 0,
            hazardous: 0,
          });
          continue;
        }
      }

      // Calculate stats for this day
      const total = asteroids.length;
      const hazardous = asteroids.filter(a => a.isHazardous).length;

      trends.push({
        date: dateString,
        total,
        hazardous,
      });
    }

    console.log(`Trends data ready: ${trends.length} days`);

    res.json({
      success: true,
      days,
      trends,
    });
  } catch (error) {
    console.error('Trends route error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/asteroids/calendar
 * Get calendar view of asteroid approaches for a specific month
 * Query params: month (YYYY-MM, default current month)
 */
router.get('/calendar', async (req, res) => {
  try {
    const month = req.query.month || new Date().toISOString().slice(0, 7); // Default: current month

    // Validate month format
    if (!/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid month format. Use YYYY-MM'
      });
    }

    console.log(`Fetching calendar data for month: ${month}`);

    // Calculate start and end dates for the month
    const [year, monthNum] = month.split('-').map(Number);
    const startDate = new Date(year, monthNum - 1, 1);
    const endDate = new Date(year, monthNum, 0); // Last day of month

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    // Fetch asteroid data for the entire month (may need multiple API calls due to 7-day limit)
    const allAsteroids = [];
    const daysInMonth = endDate.getDate();

    // Process in 7-day chunks (NASA API limit)
    for (let day = 1; day <= daysInMonth; day += 7) {
      const chunkStart = new Date(year, monthNum - 1, day);
      const chunkEnd = new Date(year, monthNum - 1, Math.min(day + 6, daysInMonth));

      const chunkStartStr = chunkStart.toISOString().split('T')[0];
      const chunkEndStr = chunkEnd.toISOString().split('T')[0];

      try {
        // Try cache first
        let asteroids = await getAsteroidsByDateRange(chunkStartStr, chunkEndStr);

        // If not in cache, fetch from NASA
        if (!asteroids || asteroids.length === 0) {
          asteroids = await fetchFeed(chunkStartStr, chunkEndStr);
        }

        allAsteroids.push(...asteroids);
      } catch (error) {
        console.error(`Failed to fetch data for ${chunkStartStr}:`, error.message);
        // Continue with other chunks even if one fails
      }
    }

    // Group asteroids by date
    const dayData = {};

    allAsteroids.forEach(asteroid => {
      asteroid.closeApproaches?.forEach(approach => {
        const approachDate = approach.date;

        // Only include dates within the requested month
        if (approachDate.startsWith(month)) {
          if (!dayData[approachDate]) {
            dayData[approachDate] = {
              date: approachDate,
              total: 0,
              hazardous: 0,
              closestKm: Infinity,
              asteroids: [],
            };
          }

          dayData[approachDate].total++;
          if (asteroid.isHazardous) {
            dayData[approachDate].hazardous++;
          }

          const missKm = approach.missDistanceKm;
          if (missKm < dayData[approachDate].closestKm) {
            dayData[approachDate].closestKm = missKm;
          }

          dayData[approachDate].asteroids.push({
            id: asteroid.id,
            name: asteroid.name,
            isHazardous: asteroid.isHazardous,
            missKm,
          });
        }
      });
    });

    // Convert to array and sort by date
    const days = Object.values(dayData)
      .map(day => ({
        date: day.date,
        total: day.total,
        hazardous: day.hazardous,
        closestKm: day.closestKm === Infinity ? null : Math.round(day.closestKm),
        asteroids: day.asteroids.slice(0, 5), // Limit to top 5 for preview
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    console.log(`Calendar data ready: ${days.length} days with asteroid approaches`);

    res.json({
      success: true,
      month,
      daysInMonth,
      daysWithApproaches: days.length,
      days,
    });
  } catch (error) {
    console.error('Calendar route error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/asteroids/:neoId
 * Get specific asteroid by ID
 * NOTE: This MUST be the last route to avoid catching other specific routes
 */
router.get('/:neoId', async (req, res) => {
  try {
    const { neoId } = req.params;

    // Check cache first
    let asteroid = await getAsteroidFromCache(neoId);

    // If not in cache or stale, fetch from NASA
    if (!asteroid) {
      asteroid = await fetchLookup(neoId);
    }

    res.json({
      success: true,
      asteroid,
    });
  } catch (error) {
    console.error('Lookup route error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
