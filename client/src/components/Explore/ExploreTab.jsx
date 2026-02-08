import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import AsteroidCard from './AsteroidCard';
import RiskDistribution from '../Dashboard/RiskDistribution';
import SpeedDistanceScatter from '../Dashboard/SpeedDistanceScatter';
import MissDistanceBarChart from '../Dashboard/MissDistanceBarChart';

export default function ExploreTab({ asteroids, startDate, endDate, onDateChange }) {
  const navigate = useNavigate();
  const [hazardousOnly, setHazardousOnly] = useState(false);
  const [sortBy, setSortBy] = useState('risk');
  const [sizeFilter, setSizeFilter] = useState('all');
  const [showStats, setShowStats] = useState(false);
  const [stats, setStats] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempStartDate, setTempStartDate] = useState(startDate);
  const [tempEndDate, setTempEndDate] = useState(endDate);

  useEffect(() => {
    if (showStats) {
      fetchStats();
    }
  }, [showStats]);

  const fetchStats = async () => {
    try {
      const response = await api.get('/api/asteroids/stats');
      if (response.success) {
        setStats(response.stats);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  // Filter asteroids
  const filteredAsteroids = asteroids.filter(asteroid => {
    // Hazardous filter
    if (hazardousOnly && !asteroid.isHazardous) return false;

    // Size filter
    if (sizeFilter !== 'all') {
      const maxDiamM = asteroid.diameterMaxM || 0;
      if (sizeFilter === 'small' && maxDiamM >= 100) return false;
      if (sizeFilter === 'medium' && (maxDiamM < 100 || maxDiamM >= 500)) return false;
      if (sizeFilter === 'large' && maxDiamM < 500) return false;
    }

    return true;
  });

  // Sort asteroids
  const sortedAsteroids = [...filteredAsteroids].sort((a, b) => {
    if (sortBy === 'risk') {
      return (b.riskScore || 0) - (a.riskScore || 0);
    }
    if (sortBy === 'distance') {
      const distA = a.closeApproaches?.[0]?.missDistanceKm || Infinity;
      const distB = b.closeApproaches?.[0]?.missDistanceKm || Infinity;
      return distA - distB;
    }
    if (sortBy === 'size') {
      const sizeA = a.diameterMaxKm || 0;
      const sizeB = b.diameterMaxKm || 0;
      return sizeB - sizeA;
    }
    if (sortBy === 'date') {
      const dateA = a.closeApproaches?.[0]?.date || '';
      const dateB = b.closeApproaches?.[0]?.date || '';
      return dateA.localeCompare(dateB);
    }
    return 0;
  });

  const formatDateRange = () => {
    if (!startDate || !endDate) return 'Select date range';
    const start = new Date(startDate);
    const end = new Date(endDate);
    const options = { month: 'short', day: 'numeric' };
    return `${start.toLocaleDateString('en-US', options)} - ${end.toLocaleDateString('en-US', options)}`;
  };

  const handleApplyDateRange = () => {
    const start = new Date(tempStartDate);
    const end = new Date(tempEndDate);
    const diffDays = (end - start) / (1000 * 60 * 60 * 24);

    if (diffDays > 7) {
      alert('Date range cannot exceed 7 days (NASA API limit)');
      return;
    }
    if (diffDays < 0) {
      alert('End date must be after start date');
      return;
    }

    onDateChange(tempStartDate, tempEndDate);
    setShowDatePicker(false);
  };

  const handleShiftDates = (days) => {
    const newStart = new Date(new Date(startDate).getTime() + days * 86400000);
    const newEnd = new Date(new Date(endDate).getTime() + days * 86400000);
    const newStartStr = newStart.toISOString().split('T')[0];
    const newEndStr = newEnd.toISOString().split('T')[0];
    onDateChange(newStartStr, newEndStr);
  };

  const handleResetToToday = () => {
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    onDateChange(today, tomorrow);
  };

  return (
    <>
      {/* Page Header */}
      <header className="tab-page-header">
        <div className="header-left">
          <p className="tab-eyebrow">Near-Earth Objects</p>
          <h1>Near-Earth Objects</h1>
          <p className="tab-subtitle">
            {sortedAsteroids.length} asteroid{sortedAsteroids.length !== 1 ? 's' : ''} approaching this period
          </p>
        </div>
        <div className="date-range-picker-container">
          <button
            className="pill primary"
            style={{ whiteSpace: 'nowrap' }}
            onClick={() => setShowDatePicker(!showDatePicker)}
          >
            {formatDateRange()} ▾
          </button>

          {showDatePicker && (
            <div className="date-picker-dropdown">
              <div className="date-picker-inputs">
                <label>
                  Start Date
                  <input
                    type="date"
                    value={tempStartDate}
                    onChange={(e) => setTempStartDate(e.target.value)}
                  />
                </label>
                <label>
                  End Date
                  <input
                    type="date"
                    value={tempEndDate}
                    onChange={(e) => setTempEndDate(e.target.value)}
                  />
                </label>
              </div>
              <div className="date-picker-actions">
                <button className="pill ghost" onClick={() => handleShiftDates(-7)}>
                  ← Prev Week
                </button>
                <button className="pill ghost" onClick={handleResetToToday}>
                  Today
                </button>
                <button className="pill ghost" onClick={() => handleShiftDates(7)}>
                  Next Week →
                </button>
                <button className="pill primary" onClick={handleApplyDateRange}>
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Filter Bar */}
      <section className="filter-bar">
        <button
          className={`pill ${hazardousOnly ? 'active' : ''}`}
          onClick={() => setHazardousOnly(!hazardousOnly)}
        >
          ⚠ Hazardous only
        </button>

        <label>
          Sort
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="risk">Risk Score</option>
            <option value="distance">Distance</option>
            <option value="size">Size</option>
            <option value="date">Approach Date</option>
          </select>
        </label>

        <label>
          Size
          <select value={sizeFilter} onChange={(e) => setSizeFilter(e.target.value)}>
            <option value="all">All sizes</option>
            <option value="small">Small &lt; 100m</option>
            <option value="medium">Medium 100-500m</option>
            <option value="large">Large &gt; 500m</option>
          </select>
        </label>

        <button
          className="pill ghost stats-toggle"
          onClick={() => setShowStats(!showStats)}
        >
          📊 {showStats ? 'Hide' : 'Show'} stats
        </button>
      </section>

      {/* Stats Panel */}
      {showStats && stats && (
        <section className="stats-panel">
          <div className="chart-card">
            <header>Risk distribution</header>
            <p>
              Critical {stats.risk_distribution?.critical || 0} ·
              High {stats.risk_distribution?.high || 0} ·
              Medium {stats.risk_distribution?.medium || 0} ·
              Low {stats.risk_distribution?.low || 0}
            </p>
            <RiskDistribution riskDistribution={stats.risk_distribution} />
          </div>

          <div className="chart-card">
            <header>Speed vs distance</header>
            <p>Scatter plot of velocity and miss distance</p>
            <SpeedDistanceScatter />
          </div>

          <div className="chart-card">
            <header>Miss distance</header>
            <p>Bar chart of closest approaches</p>
            <MissDistanceBarChart />
          </div>
        </section>
      )}

      {/* Cards Grid */}
      <section className="cards-grid">
        {sortedAsteroids.length === 0 ? (
          <div style={{
            gridColumn: '1 / -1',
            textAlign: 'center',
            padding: '3rem',
            color: '#9ca3af'
          }}>
            No asteroids found matching your filters.
          </div>
        ) : (
          sortedAsteroids.map(asteroid => (
            <AsteroidCard
              key={asteroid.id}
              asteroid={asteroid}
              onClick={() => navigate(`/asteroid/${asteroid.id}`)}
            />
          ))
        )}
      </section>
    </>
  );
}
