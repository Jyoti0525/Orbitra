/**
 * DistanceScale Component
 * Visual scale showing miss distance relative to Earth radius, GEO orbit, and Moon distance
 */

export default function DistanceScale({ asteroid }) {
  // Reference distances (in km)
  const EARTH_RADIUS = 6371;
  const GEO_ORBIT = 35786;
  const MOON_DISTANCE = 384400;
  const MAX_SCALE = 500000; // 500,000 km for scale

  // Get closest approach distance
  const missDistanceKm = asteroid.closeApproaches?.[0]?.missDistanceKm
    ? parseFloat(asteroid.closeApproaches[0].missDistanceKm)
    : null;

  if (!missDistanceKm) {
    return (
      <div className="distance-scale-card">
        <header>
          <div>
            <p className="eyebrow">Distance Analysis</p>
            <h2>Miss Distance Scale</h2>
          </div>
        </header>
        <p className="no-data">No close approach data available</p>
      </div>
    );
  }

  // Calculate positions on logarithmic scale (0-100%)
  const calculatePosition = (distance) => {
    // Use logarithmic scale for better visualization
    const logScale = Math.log10(distance + 1) / Math.log10(MAX_SCALE + 1);
    return Math.min(logScale * 100, 100);
  };

  const references = [
    { label: 'Earth Radius', distance: EARTH_RADIUS, color: '#63b0ff' },
    { label: 'GEO Orbit', distance: GEO_ORBIT, color: '#7effe0' },
    { label: 'Moon Distance', distance: MOON_DISTANCE, color: '#ffa726' }
  ];

  const asteroidPosition = calculatePosition(missDistanceKm);
  const asteroidColor = missDistanceKm < MOON_DISTANCE ? '#ff6b6b' : '#7effe0';

  // Format distance for display
  const formatDistance = (km) => {
    if (km >= 1000000) {
      return `${(km / 1000000).toFixed(2)}M km`;
    } else if (km >= 1000) {
      return `${(km / 1000).toFixed(0)}K km`;
    } else {
      return `${km.toFixed(0)} km`;
    }
  };

  return (
    <div className="distance-scale-card">
      <header>
        <div>
          <p className="eyebrow">Distance Analysis</p>
          <h2>Miss Distance Scale</h2>
        </div>
        <div className="distance-value" style={{ color: asteroidColor }}>
          {formatDistance(missDistanceKm)}
        </div>
      </header>

      <div className="scale-visualization">
        <svg viewBox="0 0 400 120" preserveAspectRatio="xMidYMid meet">
          {/* Scale line */}
          <line
            x1="20"
            y1="60"
            x2="380"
            y2="60"
            stroke="var(--detail-muted)"
            strokeWidth="2"
          />

          {/* Reference markers */}
          {references.map((ref, idx) => {
            const x = 20 + (calculatePosition(ref.distance) / 100) * 360;
            return (
              <g key={idx}>
                {/* Marker line */}
                <line
                  x1={x}
                  y1="50"
                  x2={x}
                  y2="70"
                  stroke={ref.color}
                  strokeWidth="2"
                />
                {/* Label */}
                <text
                  x={x}
                  y={idx % 2 === 0 ? 40 : 85}
                  fill={ref.color}
                  fontSize="10"
                  textAnchor="middle"
                  fontFamily="JetBrains Mono, monospace"
                >
                  {ref.label}
                </text>
                {/* Distance value */}
                <text
                  x={x}
                  y={idx % 2 === 0 ? 30 : 95}
                  fill="var(--detail-muted)"
                  fontSize="9"
                  textAnchor="middle"
                  fontFamily="JetBrains Mono, monospace"
                >
                  {formatDistance(ref.distance)}
                </text>
              </g>
            );
          })}

          {/* Asteroid marker */}
          <g>
            {/* Marker line */}
            <line
              x1={20 + (asteroidPosition / 100) * 360}
              y1="45"
              x2={20 + (asteroidPosition / 100) * 360}
              y2="75"
              stroke={asteroidColor}
              strokeWidth="3"
            />
            {/* Marker circle */}
            <circle
              cx={20 + (asteroidPosition / 100) * 360}
              cy="60"
              r="5"
              fill={asteroidColor}
            />
            {/* Label */}
            <text
              x={20 + (asteroidPosition / 100) * 360}
              y="15"
              fill={asteroidColor}
              fontSize="11"
              fontWeight="bold"
              textAnchor="middle"
              fontFamily="JetBrains Mono, monospace"
            >
              Asteroid
            </text>
          </g>
        </svg>
      </div>

      <div className="scale-legend">
        <p className="legend-label">Logarithmic scale (0 - 500K km)</p>
        <div className="legend-items">
          <div className="legend-item">
            <div className="legend-dot" style={{ backgroundColor: '#63b0ff' }} />
            <span>Earth Radius: {EARTH_RADIUS.toLocaleString()} km</span>
          </div>
          <div className="legend-item">
            <div className="legend-dot" style={{ backgroundColor: '#7effe0' }} />
            <span>GEO Orbit: {GEO_ORBIT.toLocaleString()} km</span>
          </div>
          <div className="legend-item">
            <div className="legend-dot" style={{ backgroundColor: '#ffa726' }} />
            <span>Moon: {MOON_DISTANCE.toLocaleString()} km</span>
          </div>
        </div>
      </div>

      <div className="comparison-text">
        {missDistanceKm < EARTH_RADIUS && (
          <p style={{ color: '#ff6b6b' }}>
            ⚠️ Closer than Earth's radius - extremely close approach
          </p>
        )}
        {missDistanceKm >= EARTH_RADIUS && missDistanceKm < GEO_ORBIT && (
          <p style={{ color: '#ffa726' }}>
            Within geostationary orbit distance
          </p>
        )}
        {missDistanceKm >= GEO_ORBIT && missDistanceKm < MOON_DISTANCE && (
          <p style={{ color: '#63b0ff' }}>
            Between GEO orbit and Moon distance
          </p>
        )}
        {missDistanceKm >= MOON_DISTANCE && (
          <p style={{ color: '#7effe0' }}>
            Farther than the Moon - safe distance
          </p>
        )}
      </div>
    </div>
  );
}
