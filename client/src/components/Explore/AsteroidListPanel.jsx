import { useState } from 'react';
import AsteroidCard from './AsteroidCard';

export default function AsteroidListPanel({
  asteroids,
  selectedAsteroid,
  hoveredAsteroid,
  onAsteroidClick,
  onAsteroidHover,
  onAsteroidLeave,
}) {
  const [filter, setFilter] = useState('all'); // 'all' or 'hazardous'
  const [sortBy, setSortBy] = useState('risk'); // 'risk', 'distance', 'velocity'

  const filteredAsteroids = asteroids.filter((a) => {
    if (filter === 'hazardous') return a.isHazardous;
    return true;
  });

  const sortedAsteroids = [...filteredAsteroids].sort((a, b) => {
    if (sortBy === 'risk') return b.riskScore - a.riskScore;
    if (sortBy === 'distance') {
      const distA = a.closeApproaches?.[0]?.missDistanceKm || Infinity;
      const distB = b.closeApproaches?.[0]?.missDistanceKm || Infinity;
      return distA - distB;
    }
    if (sortBy === 'velocity') {
      const velA = a.closeApproaches?.[0]?.velocityKmh || 0;
      const velB = b.closeApproaches?.[0]?.velocityKmh || 0;
      return velB - velA;
    }
    return 0;
  });

  return (
    <div className="h-full flex flex-col">
      {/* Filters */}
      <div className="p-4 bg-cosmic-black/50 border-b border-nebula-purple/30">
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg transition ${
              filter === 'all'
                ? 'bg-star-blue text-white'
                : 'bg-cosmic-black/50 text-gray-400 hover:text-white'
            }`}
          >
            All ({asteroids.length})
          </button>
          <button
            onClick={() => setFilter('hazardous')}
            className={`px-4 py-2 rounded-lg transition ${
              filter === 'hazardous'
                ? 'bg-danger-red text-white'
                : 'bg-cosmic-black/50 text-gray-400 hover:text-white'
            }`}
          >
            Hazardous ({asteroids.filter((a) => a.isHazardous).length})
          </button>
        </div>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="w-full px-3 py-2 bg-cosmic-black border border-nebula-purple/30 rounded-lg text-white focus:outline-none focus:border-star-blue"
        >
          <option value="risk">Sort: Risk ▼</option>
          <option value="distance">Sort: Distance ▼</option>
          <option value="velocity">Sort: Velocity ▼</option>
        </select>
      </div>

      {/* Scrollable List */}
      <div className="flex-1 overflow-y-auto space-y-2 p-2">
        {sortedAsteroids.map((asteroid) => (
          <AsteroidCard
            key={asteroid.id}
            asteroid={asteroid}
            isSelected={selectedAsteroid?.id === asteroid.id}
            isHovered={hoveredAsteroid?.id === asteroid.id}
            onClick={() => onAsteroidClick(asteroid)}
            onMouseEnter={() => onAsteroidHover(asteroid)}
            onMouseLeave={onAsteroidLeave}
          />
        ))}

        {sortedAsteroids.length === 0 && (
          <div className="text-center text-gray-400 py-8">No asteroids found</div>
        )}
      </div>
    </div>
  );
}
