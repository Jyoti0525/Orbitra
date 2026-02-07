/**
 * Risk Calculator for Asteroids
 * Calculates risk score (0-100) based on 3 factors
 */

/**
 * Calculate risk score for an asteroid
 * @param {Object} asteroid - Asteroid data
 * @returns {Object} { riskScore: number, riskLevel: string }
 */
export function calculateRiskScore(asteroid) {
  // Extract data
  const isHazardous = asteroid.is_potentially_hazardous_asteroid || false;
  const diameterKm = asteroid.estimated_diameter?.kilometers?.estimated_diameter_max || 0;
  const missDistanceKm = asteroid.close_approach_data?.[0]?.miss_distance?.kilometers
    ? parseFloat(asteroid.close_approach_data[0].miss_distance.kilometers)
    : Infinity;

  // 1. Hazardous status score (40% weight)
  const hazardousScore = isHazardous ? 40 : 0;

  // 2. Diameter score (30% weight)
  // Larger asteroids = higher risk
  // Scale: 0-1 km = 0-30 points
  const diameterScore = Math.min((diameterKm / 1) * 30, 30);

  // 3. Miss distance score (30% weight)
  // Closer asteroids = higher risk
  // Scale: 0-10M km inversely scored
  const maxDistance = 10000000; // 10 million km
  const distanceScore = Math.max(0, 30 * (1 - missDistanceKm / maxDistance));

  // Total risk score (0-100)
  const riskScore = Math.round(hazardousScore + diameterScore + distanceScore);

  // Determine risk level
  let riskLevel;
  if (riskScore >= 70) {
    riskLevel = 'HIGH';
  } else if (riskScore >= 40) {
    riskLevel = 'MEDIUM';
  } else {
    riskLevel = 'LOW';
  }

  return {
    riskScore: Math.min(riskScore, 100), // Cap at 100
    riskLevel,
  };
}

/**
 * Parse NASA API string numbers to actual numbers
 * @param {string|number} value
 * @returns {number}
 */
export function parseNumber(value) {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return parseFloat(value) || 0;
  return 0;
}
