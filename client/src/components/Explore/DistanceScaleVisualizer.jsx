export default function DistanceScaleVisualizer({ missDistanceKm }) {
  const MOON_DISTANCE = 384400; // km
  const lunarMultiple = (missDistanceKm / MOON_DISTANCE).toFixed(1);
  const isCloserThanMoon = missDistanceKm < MOON_DISTANCE;

  // Calculate positions for the scale (in percentage)
  // If asteroid is closer than moon, scale to show Earth-Asteroid-Moon
  // If farther, scale to show Earth-Moon-Asteroid
  const moonPosition = isCloserThanMoon
    ? 100
    : Math.min((MOON_DISTANCE / missDistanceKm) * 100, 50);

  const asteroidPosition = isCloserThanMoon
    ? Math.min((missDistanceKm / MOON_DISTANCE) * 100, 80)
    : 100;

  const formatDistance = (km) => {
    if (km >= 1000000) {
      return `${(km / 1000000).toFixed(2)}M km`;
    }
    return `${Math.round(km).toLocaleString()} km`;
  };

  return (
    <div className="bg-cosmic-black/30 rounded-lg p-4 mt-4">
      <h4 className="text-sm font-semibold text-gray-300 mb-3">DISTANCE SCALE</h4>

      {isCloserThanMoon && (
        <div className="mb-3 px-3 py-2 bg-danger-red/20 border border-danger-red rounded text-danger-red text-sm font-semibold">
          ⚠️ Passes CLOSER than the Moon!
        </div>
      )}

      {/* Visual Scale */}
      <div className="relative h-16 mb-4">
        {/* Scale Bar */}
        <div className="absolute top-8 left-0 right-0 h-1 bg-gradient-to-r from-star-blue via-nebula-purple to-star-blue rounded-full"></div>

        {/* Earth */}
        <div className="absolute left-0 top-0 flex flex-col items-center" style={{ transform: 'translateX(-12px)' }}>
          <div className="text-2xl">🌍</div>
          <div className="text-xs text-gray-400 mt-1">Earth</div>
        </div>

        {/* Moon */}
        <div
          className="absolute top-0 flex flex-col items-center transition-all"
          style={{
            left: `${moonPosition}%`,
            transform: 'translateX(-12px)',
          }}
        >
          <div className="text-2xl">🌙</div>
          <div className="text-xs text-gray-400 mt-1">Moon</div>
        </div>

        {/* Asteroid */}
        <div
          className="absolute top-0 flex flex-col items-center transition-all"
          style={{
            left: `${asteroidPosition}%`,
            transform: 'translateX(-12px)',
          }}
        >
          <div className={`text-2xl ${isCloserThanMoon ? 'animate-pulse' : ''}`}>☄️</div>
          <div className={`text-xs mt-1 font-semibold ${isCloserThanMoon ? 'text-danger-red' : 'text-star-blue'}`}>
            Asteroid
          </div>
        </div>
      </div>

      {/* Distance Details */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="bg-cosmic-black rounded p-2">
          <div className="text-gray-400 text-xs">Miss Distance</div>
          <div className="text-white font-semibold">{formatDistance(missDistanceKm)}</div>
        </div>
        <div className="bg-cosmic-black rounded p-2">
          <div className="text-gray-400 text-xs">Lunar Distance</div>
          <div className="text-white font-semibold">{lunarMultiple}× Moon</div>
        </div>
      </div>

      {/* Comparison Text */}
      <div className="mt-3 text-center text-xs text-gray-400">
        {isCloserThanMoon ? (
          <span className="text-danger-red font-semibold">
            This asteroid passes between Earth and the Moon!
          </span>
        ) : parseFloat(lunarMultiple) < 5 ? (
          <span>
            Relatively close approach - within <span className="text-white font-semibold">{lunarMultiple}×</span> lunar distance
          </span>
        ) : (
          <span>
            Safe distance - <span className="text-white font-semibold">{lunarMultiple}×</span> farther than the Moon
          </span>
        )}
      </div>
    </div>
  );
}
