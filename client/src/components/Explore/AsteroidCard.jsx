import CountdownTimer from './CountdownTimer';

export default function AsteroidCard({ asteroid, isSelected, isHovered, onClick, onMouseEnter, onMouseLeave }) {
  const getRiskColor = (score) => {
    if (!score && score !== 0) return 'border-gray-600 bg-gray-600/10';
    if (score >= 70) return 'border-danger-red bg-danger-red/10';
    if (score >= 40) return 'border-warning-orange bg-warning-orange/10';
    return 'border-success-green bg-success-green/10';
  };

  const getRiskLabel = (score) => {
    if (!score && score !== 0) return 'UNKNOWN';
    if (score >= 70) return 'CRITICAL';
    if (score >= 40) return 'HIGH';
    if (score >= 20) return 'MEDIUM';
    return 'LOW';
  };

  const riskScore = asteroid.riskScore ?? 0;
  const riskColor = getRiskColor(riskScore);
  const approach = asteroid.closeApproaches?.[0];
  const asteroidName = asteroid.name || 'Unknown Asteroid';

  // Format distance with fallback
  const formatDistance = () => {
    if (!approach || !approach.missDistanceKm) return 'Unknown';
    return (approach.missDistanceKm / 1000000).toFixed(2) + 'M km';
  };

  // Format velocity with fallback
  const formatVelocity = () => {
    if (!approach || !approach.velocityKmh) return 'Unknown';
    return (approach.velocityKmh / 1000).toFixed(0) + 'K km/h';
  };

  return (
    <div
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`p-4 border-l-4 cursor-pointer transition-all duration-300 ${riskColor} ${
        isSelected ? 'bg-nebula-purple/20 scale-105' : 'hover:bg-white/5'
      } ${isHovered ? 'bg-star-blue/10' : ''}`}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1 mr-2">
          <h3 className="font-bold text-white truncate">{asteroidName}</h3>
          {approach && approach.date && (
            <div className="text-xs mt-1">
              <CountdownTimer approachDate={approach.date} />
            </div>
          )}
        </div>
        <span className={`text-xs px-2 py-1 rounded ${
          riskScore >= 70 ? 'bg-danger-red/20 text-danger-red' :
          riskScore >= 40 ? 'bg-warning-orange/20 text-warning-orange' :
          riskScore > 0 ? 'bg-success-green/20 text-success-green' :
          'bg-gray-600/20 text-gray-400'
        }`}>
          {getRiskLabel(riskScore)} {riskScore}
        </span>
      </div>

      <div className="text-sm text-gray-400 space-y-1">
        <div className="flex justify-between">
          <span>Distance:</span>
          <span className="text-star-blue">{formatDistance()}</span>
        </div>
        <div className="flex justify-between">
          <span>Velocity:</span>
          <span className="text-nebula-purple">{formatVelocity()}</span>
        </div>
      </div>
    </div>
  );
}
