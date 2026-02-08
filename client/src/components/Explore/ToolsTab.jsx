import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';

export default function ToolsTab() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loadingRandom, setLoadingRandom] = useState(false);

  // Impact Calculator State
  const [diameter, setDiameter] = useState(500); // meters
  const [velocity, setVelocity] = useState(20); // km/s
  const [density, setDensity] = useState(2.6); // g/cm³
  const [location, setLocation] = useState('land');
  const [impactResults, setImpactResults] = useState(null);

  // Search with debouncing
  useEffect(() => {
    if (searchQuery.length >= 2) {
      const timer = setTimeout(() => searchAsteroids(searchQuery), 300);
      return () => clearTimeout(timer);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const searchAsteroids = async (query) => {
    try {
      // Try to fetch from comparison dataset for name search
      const response = await api.get('/api/asteroids/comparison-dataset');
      if (response.success && response.asteroids) {
        const filtered = response.asteroids.filter(a =>
          a.name.toLowerCase().includes(query.toLowerCase()) ||
          a.id.includes(query)
        );
        setSearchResults(filtered.slice(0, 10));
      }
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  const handleRandomAsteroid = async () => {
    setLoadingRandom(true);
    try {
      const response = await api.get('/api/asteroids/random');
      if (response.success && response.asteroid) {
        navigate(`/asteroid/${response.asteroid.id}`);
      } else {
        alert('Failed to fetch random asteroid. Please try again.');
        setLoadingRandom(false);
      }
    } catch (error) {
      console.error('Random asteroid error:', error);
      alert('Failed to fetch random asteroid. Error: ' + error.message);
      setLoadingRandom(false);
    }
  };

  const calculateImpact = (e) => {
    e.preventDefault();

    // Mass calculation (sphere)
    const radiusM = diameter / 2;
    const volumeM3 = (4 / 3) * Math.PI * Math.pow(radiusM, 3);
    const massKg = volumeM3 * (density * 1000); // convert g/cm³ to kg/m³

    // Kinetic energy: 0.5 * m * v²
    const velocityMS = velocity * 1000;
    const energyJoules = 0.5 * massKg * Math.pow(velocityMS, 2);

    // Convert to megatons TNT (1 MT = 4.184e15 joules)
    const energyMT = energyJoules / 4.184e15;

    // Hiroshima bombs (1 bomb ≈ 0.015 MT)
    const hiroshimas = energyMT / 0.015;

    // Crater diameter (empirical: ~20× asteroid diameter)
    const craterDiameterKm = (diameter * 20) / 1000;
    const craterDepthKm = craterDiameterKm / 3;

    // Destruction radius (rough estimate based on energy)
    const destructionRadiusKm = Math.pow(energyMT, 0.33) * 3;
    const moderateRadiusKm = destructionRadiusKm * 2;

    // Tsunami (if ocean impact)
    const tsunamiHeight = location === 'ocean'
      ? `${Math.pow(energyMT, 0.25) * 10} m waves`
      : 'N/A - Land impact';

    setImpactResults({
      energy: energyMT,
      hiroshimas,
      craterDiameter: craterDiameterKm,
      craterDepth: craterDepthKm,
      destruction: destructionRadiusKm,
      moderate: moderateRadiusKm,
      tsunami: tsunamiHeight
    });
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toFixed(2);
  };

  return (
    <>
      {/* Page Header */}
      <header className="tab-page-header">
        <div className="header-left">
          <p className="tab-eyebrow">Tools & Discovery</p>
          <h1>Search asteroids and explore impact scenarios</h1>
        </div>
      </header>

      {/* Search Row */}
      <section className="search-row">
        <div className="search-box">
          <span>🔍</span>
          <input
            type="text"
            placeholder="Search by name or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery.length >= 2 && searchResults.length === 0 && (
            <div className="search-results">
              <div style={{ padding: '1rem', textAlign: 'center', color: '#9ca3af' }}>
                No results found for "{searchQuery}"
              </div>
            </div>
          )}
          {searchResults.length > 0 && (
            <div className="search-results">
              {searchResults.map(asteroid => (
                <div
                  key={asteroid.id}
                  className="search-result-item"
                  onClick={() => {
                    navigate(`/asteroid/${asteroid.id}`);
                    setSearchResults([]);
                    setSearchQuery('');
                  }}
                >
                  <div style={{ fontWeight: '600', color: '#fff', marginBottom: '0.25rem' }}>
                    {asteroid.name || 'Unknown Asteroid'}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#9ca3af' }}>
                    ID: {asteroid.id || 'Unknown'} • Risk: {asteroid.riskScore ?? 0}
                    {asteroid.isHazardous && ' • ⚠️ Hazardous'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <button
          type="button"
          className="pill primary"
          onClick={handleRandomAsteroid}
          disabled={loadingRandom}
        >
          {loadingRandom ? '⏳ Loading...' : '🎲 Random'}
        </button>
      </section>

      {/* Impact Simulator Card */}
      <section className="impact-card">
        <header>
          <div>
            <h2>💥 Impact Simulator</h2>
            <p>What would happen if an asteroid hit Earth?</p>
          </div>
          <span className="note">⚠️ Educational only — not a real prediction</span>
        </header>

        <div className="impact-body">
          {/* Input Form */}
          <form className="impact-form" onSubmit={calculateImpact}>
            <label>
              Diameter
              <div className="input-row">
                <input
                  type="number"
                  value={diameter}
                  onChange={(e) => setDiameter(Number(e.target.value))}
                  min="1"
                  max="10000"
                />
                <span>m</span>
              </div>
            </label>

            <label>
              Velocity
              <div className="input-row">
                <input
                  type="number"
                  value={velocity}
                  onChange={(e) => setVelocity(Number(e.target.value))}
                  min="5"
                  max="50"
                  step="1"
                />
                <span>km/s</span>
              </div>
            </label>

            <label>
              Density
              <select value={density} onChange={(e) => setDensity(Number(e.target.value))}>
                <option value="1">Ice (1 g/cm³)</option>
                <option value="2.6">Rock (2.6 g/cm³)</option>
                <option value="7.8">Iron (7.8 g/cm³)</option>
              </select>
            </label>

            <label>
              Impact Location
              <div className="radio-row">
                <label>
                  <input
                    type="radio"
                    name="location"
                    value="land"
                    checked={location === 'land'}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                  Land
                </label>
                <label>
                  <input
                    type="radio"
                    name="location"
                    value="ocean"
                    checked={location === 'ocean'}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                  Ocean
                </label>
              </div>
            </label>

            <button type="submit" className="pill primary" style={{ marginTop: '0.5rem' }}>
              Calculate Impact
            </button>
          </form>

          {/* Output Grid */}
          <div className="impact-output">
            <div className="output-card">
              <h3>💥 Energy Released</h3>
              <p>{impactResults?.energy ? `${formatNumber(impactResults.energy)} MT` : '—'}</p>
              <small>
                {impactResults?.hiroshimas ? `${formatNumber(impactResults.hiroshimas)} Hiroshima bombs` : 'Enter values and calculate'}
              </small>
            </div>

            <div className="output-card">
              <h3>🕳️ Crater Size</h3>
              <p>{impactResults?.craterDiameter ? `${impactResults.craterDiameter.toFixed(1)} km` : '—'}</p>
              <small>
                {impactResults?.craterDepth ? `Depth: ~${impactResults.craterDepth.toFixed(1)} km` : 'Diameter'}
              </small>
            </div>

            <div className="output-card">
              <h3>🔥 Destruction Radius</h3>
              <p>{impactResults?.destruction ? `${impactResults.destruction.toFixed(0)} km` : '—'}</p>
              <small>
                {impactResults?.moderate ? `Moderate damage: ${impactResults.moderate.toFixed(0)} km` : 'Severe damage'}
              </small>
            </div>

            <div className="output-card">
              <h3>🌊 Ocean Impact</h3>
              <p style={{ fontSize: '1.5rem' }}>
                {impactResults?.tsunami || 'Only if ocean impact'}
              </p>
              <small>{location === 'ocean' ? 'Tsunami waves' : 'Switch to ocean location'}</small>
            </div>
          </div>
        </div>

        {/* Reference Comparisons */}
        {impactResults && (
          <div style={{
            marginTop: '2rem',
            padding: '1.5rem',
            background: 'rgba(31, 41, 55, 0.6)',
            border: '1px solid rgba(123, 97, 255, 0.2)',
            borderRadius: '12px'
          }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: '600', color: '#d1d5db', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              FOR REFERENCE
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#9ca3af' }}>Chicxulub (dinosaur killer):</span>
                <span style={{ color: '#fff', fontWeight: '600' }}>~100,000,000 MT</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#9ca3af' }}>Tunguska 1908:</span>
                <span style={{ color: '#fff', fontWeight: '600' }}>~15 MT</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#9ca3af' }}>Chelyabinsk 2013:</span>
                <span style={{ color: '#fff', fontWeight: '600' }}>~0.5 MT</span>
              </div>
            </div>
          </div>
        )}
      </section>
    </>
  );
}
