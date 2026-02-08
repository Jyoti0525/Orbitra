import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, watchlistApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/Common/Toast';
import OrbitVisualization from '../components/AsteroidDetail/OrbitVisualization';
import RiskBreakdown from '../components/AsteroidDetail/RiskBreakdown';
import DistanceScale from '../components/AsteroidDetail/DistanceScale';
import RiskComparison from '../components/AsteroidDetail/RiskComparison';
import AsteroidChat from '../components/Chat/AsteroidChat';
import './AsteroidDetail.css';

export default function AsteroidDetail() {
  const { neoId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [asteroid, setAsteroid] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [approachesExpanded, setApproachesExpanded] = useState(false);
  const [metricsExpanded, setMetricsExpanded] = useState(false);
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [watchlistLoading, setWatchlistLoading] = useState(false);

  useEffect(() => {
    if (neoId) {
      fetchAsteroidDetail();
      checkWatchlistStatus();
    }
  }, [neoId, isAuthenticated]);

  const fetchAsteroidDetail = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get(`/api/asteroids/${neoId}`);

      if (response.success && response.asteroid) {
        setAsteroid(response.asteroid);
      } else {
        setError('Asteroid not found');
      }
    } catch (err) {
      console.error('Failed to fetch asteroid details:', err);
      setError('Failed to load asteroid data');
    } finally {
      setLoading(false);
    }
  };

  const checkWatchlistStatus = async () => {
    if (!isAuthenticated) {
      setIsInWatchlist(false);
      return;
    }

    try {
      const response = await api.get(`/api/watchlist/check/${neoId}`);
      setIsInWatchlist(response.inWatchlist || false);
    } catch (err) {
      console.error('Failed to check watchlist status:', err);
    }
  };

  const { addToast } = useToast();

  const handleToggleWatchlist = async () => {
    // Check if user is authenticated
    if (!isAuthenticated) {
      addToast('Please sign in to add asteroids to your watchlist', 'info');
      sessionStorage.setItem('returnUrl', `/asteroid/${neoId}`);
      navigate('/login');
      return;
    }

    try {
      setWatchlistLoading(true);

      if (isInWatchlist) {
        // Remove from watchlist
        const response = await api.delete(`/api/watchlist/${neoId}`);
        console.log('Remove watchlist response:', response);
        if (response.success) {
          setIsInWatchlist(false);
          addToast(`${asteroid.name} removed from watchlist`, 'success');
        } else {
          throw new Error(response.error || 'Failed to remove from watchlist');
        }
      } else {
        // Add to watchlist
        const response = await api.post(`/api/watchlist/${neoId}`, {
          asteroidData: {
            name: asteroid.name,
            riskScore: asteroid.riskScore,
            riskLevel: getRiskLabel(asteroid.riskScore),
            isHazardous: asteroid.isHazardous
          }
        });
        console.log('Add watchlist response:', response);
        if (response.success) {
          setIsInWatchlist(true);
          addToast(`${asteroid.name} added to watchlist!`, 'success');
        } else {
          throw new Error(response.error || 'Failed to add to watchlist');
        }
      }
    } catch (err) {
      console.error('Failed to toggle watchlist:', err);
      addToast(`Error: ${err.message || 'Failed to update watchlist'}`, 'error');
    } finally {
      setWatchlistLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="asteroid-detail-page">
        <div className="loading-container">
          <div className="loading-text">Loading asteroid details...</div>
        </div>
      </div>
    );
  }

  if (error || !asteroid) {
    return (
      <div className="asteroid-detail-page">
        <div className="error-container">
          <div className="error-text">{error || 'Asteroid not found'}</div>
          <button className="pill" onClick={() => navigate('/explore')}>
            Back to Explore
          </button>
        </div>
      </div>
    );
  }

  const getRiskColor = (score) => {
    if (score >= 70) return '#ff6b6b';
    if (score >= 40) return '#ffa726';
    if (score >= 20) return '#63b0ff';
    return '#7effe0';
  };

  const getRiskLabel = (score) => {
    if (score >= 70) return 'CRITICAL';
    if (score >= 40) return 'HIGH';
    if (score >= 20) return 'MEDIUM';
    return 'LOW';
  };

  // Format orbital data for OrbitVisualization component
  const orbitalData = {
    semiMajorAxis: asteroid.orbitalData?.semi_major_axis,
    eccentricity: asteroid.orbitalData?.eccentricity
  };

  // Get close approach data for Earth
  const earthApproaches = asteroid.closeApproaches?.filter(
    approach => approach.orbitingBody === 'Earth'
  ) || [];

  return (
    <div className="asteroid-detail-page">
      <div className="detail-shell">
        {/* Masthead */}
        <header className="masthead">
          <div>
            <p className="eyebrow">Near-Earth Object</p>
            <h1>{asteroid.name}</h1>
          </div>
        </header>

        {/* At-a-Glance Stats */}
        <section className="glance">
          <article>
            <p>Risk Score</p>
            <strong style={{ color: getRiskColor(asteroid.riskScore) }}>
              {asteroid.riskScore}
            </strong>
            <small style={{ color: getRiskColor(asteroid.riskScore) }}>
              {getRiskLabel(asteroid.riskScore)}
            </small>
          </article>

          <article>
            <p>Diameter Range</p>
            <strong>
              {asteroid.diameterMinKm && asteroid.diameterMaxKm
                ? `${asteroid.diameterMinKm.toFixed(2)} - ${asteroid.diameterMaxKm.toFixed(2)}`
                : 'Unknown'}
            </strong>
            <small>kilometers</small>
          </article>

          <article>
            <p>Absolute Magnitude</p>
            <strong>{asteroid.absoluteMagnitude?.toFixed(2) || 'N/A'}</strong>
            <small>H value</small>
          </article>

          <article>
            <p>Status</p>
            <strong style={{ color: asteroid.isHazardous ? '#ffa726' : '#7effe0' }}>
              {asteroid.isHazardous ? 'HAZARDOUS' : 'SAFE'}
            </strong>
            <small>{asteroid.isHazardous ? 'Potentially dangerous' : 'Non-threatening'}</small>
          </article>
        </section>

        {/* Two-Column Layout */}
        <div className="layout">
          {/* Left: Orbit Card */}
          <section className="orbit-card">
            <header>
              <div>
                <p className="eyebrow">Orbital Visualization</p>
                <h2>Current Trajectory</h2>
              </div>
              <span className="timestamp">Live Data</span>
            </header>

            {/* Orbit Visual */}
            <OrbitVisualization orbitalData={orbitalData} />

            {/* Orbital Data Status */}
            {!asteroid.orbitalData && (
              <p style={{ color: 'var(--detail-muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>
                ⚠️ Detailed orbital data not available - showing approximate visualization
              </p>
            )}

            {/* Orbital Parameters */}
            {asteroid.orbitalData && (
              <div className="chips">
                <span className="chip">
                  e: {asteroid.orbitalData.eccentricity || 'N/A'}
                </span>
                <span className="chip">
                  a: {asteroid.orbitalData.semi_major_axis || 'N/A'} AU
                </span>
                <span className="chip">
                  i: {asteroid.orbitalData.inclination || 'N/A'}°
                </span>
                <span className="chip">
                  Period: {asteroid.orbitalData.orbital_period || 'N/A'} days
                </span>
              </div>
            )}

            {/* Dimension Chips */}
            {asteroid.diameterMinKm && asteroid.diameterMaxKm && (
              <div className="chips">
                <span className="chip">
                  Min: {asteroid.diameterMinKm.toFixed(3)} km
                </span>
                <span className="chip">
                  Max: {asteroid.diameterMaxKm.toFixed(3)} km
                </span>
                <span className="chip">
                  Est: {((asteroid.diameterMinKm + asteroid.diameterMaxKm) / 2).toFixed(3)} km
                </span>
              </div>
            )}
          </section>

          {/* Right: Stack of Cards */}
          <div className="stack">
            {/* Close Approaches Timeline */}
            <section className="card">
              <header>
                <div>
                  <p className="eyebrow">Historical Data</p>
                  <h2>Close Approaches to Earth</h2>
                </div>
                <button
                  className="pill compact"
                  onClick={() => setApproachesExpanded(!approachesExpanded)}
                >
                  {approachesExpanded ? 'Collapse' : 'Expand'}
                </button>
              </header>

              {approachesExpanded && earthApproaches.length > 0 && (
                <ul className="timeline">
                  {earthApproaches.slice(0, 5).map((approach, idx) => (
                    <li key={idx}>
                      <div>
                        <strong>
                          {new Date(approach.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </strong>
                      </div>
                      <span>
                        {parseFloat(approach.missDistanceKm).toLocaleString('en-US')} km
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              {approachesExpanded && earthApproaches.length === 0 && (
                <p style={{ color: 'var(--detail-muted)', fontSize: '0.9rem' }}>
                  No recorded close approaches to Earth
                </p>
              )}

              {!approachesExpanded && (
                <p style={{ color: 'var(--detail-muted)', fontSize: '0.9rem' }}>
                  {earthApproaches.length} recorded approach(es) • Click to view
                </p>
              )}
            </section>

            {/* Orbital Metrics */}
            <section className="card">
              <header>
                <div>
                  <p className="eyebrow">Technical Specs</p>
                  <h2>Orbital Metrics</h2>
                </div>
                <button
                  className="pill compact"
                  onClick={() => setMetricsExpanded(!metricsExpanded)}
                >
                  {metricsExpanded ? 'Collapse' : 'Expand'}
                </button>
              </header>

              {metricsExpanded && asteroid.orbitalData && (
                <div className="metrics">
                  <div>
                    <dt>Eccentricity</dt>
                    <dd>{asteroid.orbitalData.eccentricity || 'N/A'}</dd>
                  </div>
                  <div>
                    <dt>Semi-Major Axis</dt>
                    <dd>{asteroid.orbitalData.semi_major_axis || 'N/A'} AU</dd>
                  </div>
                  <div>
                    <dt>Inclination</dt>
                    <dd>{asteroid.orbitalData.inclination || 'N/A'}°</dd>
                  </div>
                  <div>
                    <dt>Asc. Node</dt>
                    <dd>{asteroid.orbitalData.ascending_node_longitude || 'N/A'}°</dd>
                  </div>
                  <div>
                    <dt>Perihelion Arg</dt>
                    <dd>{asteroid.orbitalData.perihelion_argument || 'N/A'}°</dd>
                  </div>
                  <div>
                    <dt>Perihelion Dist</dt>
                    <dd>{asteroid.orbitalData.perihelion_distance || 'N/A'} AU</dd>
                  </div>
                  <div>
                    <dt>Aphelion Dist</dt>
                    <dd>{asteroid.orbitalData.aphelion_distance || 'N/A'} AU</dd>
                  </div>
                  <div>
                    <dt>Orbital Period</dt>
                    <dd>{asteroid.orbitalData.orbital_period || 'N/A'} days</dd>
                  </div>
                  <div>
                    <dt>Perihelion Time</dt>
                    <dd>
                      {asteroid.orbitalData.perihelion_time
                        ? new Date(asteroid.orbitalData.perihelion_time).toLocaleDateString()
                        : 'N/A'}
                    </dd>
                  </div>
                  <div>
                    <dt>Mean Anomaly</dt>
                    <dd>{asteroid.orbitalData.mean_anomaly || 'N/A'}°</dd>
                  </div>
                  <div>
                    <dt>Mean Motion</dt>
                    <dd>{asteroid.orbitalData.mean_motion || 'N/A'}°/day</dd>
                  </div>
                  <div>
                    <dt>Equinox</dt>
                    <dd>{asteroid.orbitalData.equinox || 'N/A'}</dd>
                  </div>
                </div>
              )}

              {metricsExpanded && !asteroid.orbitalData && (
                <p style={{ color: 'var(--detail-muted)', fontSize: '0.9rem' }}>
                  Detailed orbital data not available for this asteroid
                </p>
              )}

              {!metricsExpanded && (
                <p style={{ color: 'var(--detail-muted)', fontSize: '0.9rem' }}>
                  {asteroid.orbitalData ? '12 orbital parameters' : 'No detailed orbital data'} • Click to view
                </p>
              )}
            </section>
          </div>
        </div>

        {/* Risk Analysis Section - Three Column Grid */}
        <section className="risk-analysis">
          <h2 className="section-title">Risk Analysis</h2>
          <div className="risk-grid">
            <RiskBreakdown asteroid={asteroid} />
            <DistanceScale asteroid={asteroid} />
            <RiskComparison asteroid={asteroid} />
          </div>
        </section>

        {/* Community Discussion */}
        <AsteroidChat asteroidId={neoId} asteroidName={asteroid.name} />

        {/* Footer */}
        <footer className="detail-footer">
          <button
            className="pill primary"
            onClick={handleToggleWatchlist}
            disabled={watchlistLoading}
          >
            {watchlistLoading
              ? '⏳ Loading...'
              : isInWatchlist
                ? '✓ In Watchlist'
                : '⭐ Add to Watchlist'}
          </button>
          <div className="muted">
            Data from NASA JPL • ID: {asteroid.id} •{' '}
            <a
              href={asteroid.nasaJplUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--accent2)' }}
            >
              View on JPL →
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
}
