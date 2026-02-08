import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';

export default function WatchlistSection() {
  const navigate = useNavigate();
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState(null);

  useEffect(() => {
    fetchWatchlist();
  }, []);

  const fetchWatchlist = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/watchlist');
      if (response.success) {
        setWatchlist(response.watchlist || []);
      }
    } catch (error) {
      console.error('Failed to fetch watchlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (neoId) => {
    try {
      setRemoving(neoId);
      const response = await api.delete(`/api/watchlist/${neoId}`);
      if (response.success) {
        setWatchlist(prev => prev.filter(a => a.id !== neoId));
      }
    } catch (error) {
      console.error('Failed to remove from watchlist:', error);
    } finally {
      setRemoving(null);
    }
  };

  const getRiskChipClass = (score) => {
    if (score >= 70) return 'chip danger';
    if (score >= 40) return 'chip warning';
    if (score >= 20) return 'chip';
    return 'chip success';
  };

  const getRiskLabel = (score) => {
    if (score >= 70) return 'CRITICAL';
    if (score >= 40) return 'HIGH';
    if (score >= 20) return 'MEDIUM';
    return 'LOW';
  };

  if (loading) {
    return (
      <div className="card">
        <h3 className="card-title">My Watchlist</h3>
        <div className="loading-container">
          <div className="loading-text">Loading watchlist...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">My Watchlist</h3>
        <span style={{ fontSize: '0.85rem', color: 'var(--detail-muted)' }}>
          {watchlist.length} {watchlist.length === 1 ? 'asteroid' : 'asteroids'}
        </span>
      </div>

      {watchlist.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">⭐</div>
          <p className="empty-state-text" style={{ marginBottom: '1rem' }}>Your watchlist is empty</p>
          <button
            onClick={() => navigate('/explore')}
            className="pill primary"
          >
            Go to Explore
          </button>
        </div>
      ) : (
        <div className="timeline-list">
          {watchlist.map((asteroid) => {
            const approach = asteroid.closeApproaches?.[0];
            const riskChipClass = getRiskChipClass(asteroid.riskScore);
            const riskLabel = getRiskLabel(asteroid.riskScore);

            return (
              <div
                key={asteroid.id}
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--detail-border)',
                  borderRadius: '12px',
                  padding: '1rem',
                  transition: 'border-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(99, 176, 255, 0.5)'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--detail-border)'}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <h4 style={{ fontWeight: 600, color: 'var(--detail-text)' }}>{asteroid.name}</h4>
                      <span className={riskChipClass}>
                        {riskLabel} {asteroid.riskScore}
                      </span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', fontSize: '0.85rem' }}>
                      <div>
                        <div style={{ color: 'var(--detail-muted)', fontSize: '0.75rem' }}>Diameter</div>
                        <div style={{ color: 'var(--detail-text)', fontWeight: 600 }}>
                          {asteroid.diameterMaxM?.toFixed(0) || 'N/A'}m
                        </div>
                      </div>
                      {approach && (
                        <>
                          <div>
                            <div style={{ color: 'var(--detail-muted)', fontSize: '0.75rem' }}>Distance</div>
                            <div style={{ color: 'var(--detail-text)', fontWeight: 600 }}>
                              {(approach.missDistanceKm / 1000000).toFixed(2)}M km
                            </div>
                          </div>
                          <div>
                            <div style={{ color: 'var(--detail-muted)', fontSize: '0.75rem' }}>Velocity</div>
                            <div style={{ color: 'var(--detail-text)', fontWeight: 600 }}>
                              {(approach.velocityKmh / 1000).toFixed(1)}K km/h
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemove(asteroid.id)}
                    disabled={removing === asteroid.id}
                    className="pill compact"
                    style={{ borderColor: 'var(--danger-red)', color: 'var(--danger-red)' }}
                  >
                    {removing === asteroid.id ? 'Removing...' : 'Remove'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
