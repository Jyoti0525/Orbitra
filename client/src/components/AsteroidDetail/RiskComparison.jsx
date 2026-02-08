/**
 * RiskComparison Component
 * Compares current asteroid's risk score to famous asteroids and top-risk asteroids
 */

import { useState, useEffect } from 'react';
import { asteroidApi } from '../../services/api';

export default function RiskComparison({ asteroid }) {
  const [comparisonData, setComparisonData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchComparisonData();
  }, []);

  const fetchComparisonData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await asteroidApi.getComparisonDataset();

      if (response.success && response.asteroids) {
        setComparisonData(response.asteroids);
      } else {
        setError('Failed to load comparison data');
      }
    } catch (err) {
      console.error('Failed to fetch comparison data:', err);
      setError('Failed to load comparison data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="risk-comparison-card">
        <header>
          <div>
            <p className="eyebrow">Historical Context</p>
            <h2>Risk Comparison</h2>
          </div>
        </header>
        <p className="loading-text">Loading comparison data...</p>
      </div>
    );
  }

  if (error || comparisonData.length === 0) {
    return (
      <div className="risk-comparison-card">
        <header>
          <div>
            <p className="eyebrow">Historical Context</p>
            <h2>Risk Comparison</h2>
          </div>
        </header>
        <p className="error-text">{error || 'No comparison data available'}</p>
      </div>
    );
  }

  // Include current asteroid in comparison
  const currentAsteroid = {
    id: asteroid.id,
    name: asteroid.name,
    riskScore: asteroid.riskScore,
    riskLevel: asteroid.riskLevel,
    isCurrent: true
  };

  // Combine and sort
  const allAsteroids = [...comparisonData];
  const currentIndex = allAsteroids.findIndex(a => a.id === currentAsteroid.id);

  if (currentIndex === -1) {
    allAsteroids.push(currentAsteroid);
  } else {
    allAsteroids[currentIndex].isCurrent = true;
  }

  allAsteroids.sort((a, b) => b.riskScore - a.riskScore);

  // Find current asteroid's rank
  const currentRank = allAsteroids.findIndex(a => a.id === currentAsteroid.id) + 1;
  const totalCount = allAsteroids.length;
  const percentile = Math.round((1 - (currentRank - 1) / totalCount) * 100);

  // Take top 10 for visualization
  const topAsteroids = allAsteroids.slice(0, 10);
  const maxScore = Math.max(...topAsteroids.map(a => a.riskScore), 100);

  return (
    <div className="risk-comparison-card">
      <header>
        <div>
          <p className="eyebrow">Historical Context</p>
          <h2>Risk Comparison</h2>
        </div>
        <div className="percentile-badge">
          Top {percentile}%
        </div>
      </header>

      <div className="comparison-context">
        <p>
          This asteroid ranks <strong>#{currentRank}</strong> out of <strong>{totalCount}</strong> asteroids
          in our database, including famous near-Earth objects and recently tracked asteroids.
        </p>
      </div>

      <div className="comparison-chart">
        {topAsteroids.map((ast, idx) => {
          const barWidth = (ast.riskScore / maxScore) * 100;
          const isCurrent = ast.isCurrent;
          const isTopThree = idx < 3;

          return (
            <div
              key={ast.id}
              className={`comparison-bar ${isCurrent ? 'current' : ''} ${isTopThree ? 'top-three' : ''}`}
            >
              <div className="bar-label">
                <span className="bar-rank">#{idx + 1}</span>
                <span className="bar-name">
                  {ast.name}
                  {isCurrent && <span className="current-badge">YOU ARE HERE</span>}
                  {ast.description && <span className="bar-description"> — {ast.description}</span>}
                </span>
              </div>
              <div className="bar-container">
                <div
                  className="bar-fill"
                  style={{
                    width: `${barWidth}%`,
                    backgroundColor: getRiskColor(ast.riskScore),
                    opacity: isCurrent ? 1 : 0.7
                  }}
                />
                <span className="bar-score">{ast.riskScore}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="comparison-note">
        <p>
          Dataset includes famous asteroids (Apophis, Bennu, Eros, etc.) and top riskiest from current cache.
          Auto-updates every 7 days.
        </p>
      </div>
    </div>
  );
}

function getRiskColor(score) {
  if (score >= 70) return '#ff6b6b';
  if (score >= 40) return '#ffa726';
  if (score >= 20) return '#63b0ff';
  return '#7effe0';
}
