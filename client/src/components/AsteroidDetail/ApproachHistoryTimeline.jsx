import { useMemo } from 'react';

export default function ApproachHistoryTimeline({ closeApproaches }) {
  // Filter for Earth approaches only and sort by date
  const earthApproaches = useMemo(() => {
    if (!closeApproaches || closeApproaches.length === 0) return [];

    return closeApproaches
      .filter(ca => ca.orbitingBody === 'Earth')
      .map(ca => ({
        date: ca.date,
        missKm: ca.missDistanceKm,
        velocityKmh: ca.velocityKmh,
        missLunar: ca.missDistanceKm / 384400, // Convert to lunar distances
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [closeApproaches]);

  const currentYear = new Date().getFullYear();
  const moonDistanceKm = 384400;

  // Find min/max for scaling
  const maxDistKm = useMemo(() => {
    if (earthApproaches.length === 0) return 0;
    return Math.max(...earthApproaches.map(a => a.missKm));
  }, [earthApproaches]);

  const getDistanceColor = (missKm) => {
    if (missKm < moonDistanceKm) return 'bg-danger-red';
    if (missKm < moonDistanceKm * 2) return 'bg-warning-orange';
    if (missKm < moonDistanceKm * 5) return 'bg-star-blue';
    return 'bg-success-green';
  };

  const getDistanceTextColor = (missKm) => {
    if (missKm < moonDistanceKm) return 'text-danger-red';
    if (missKm < moonDistanceKm * 2) return 'text-warning-orange';
    if (missKm < moonDistanceKm * 5) return 'text-star-blue';
    return 'text-success-green';
  };

  const isCurrent = (date) => {
    const approachYear = new Date(date).getFullYear();
    return Math.abs(approachYear - currentYear) <= 1;
  };

  const isPast = (date) => new Date(date) < new Date();
  const isFuture = (date) => new Date(date) > new Date();

  if (earthApproaches.length === 0) {
    return (
      <div className="bg-cosmic-black/50 border border-nebula-purple/30 rounded-lg p-6">
        <h3 className="text-xl font-bold text-white mb-2">📅 Approach History</h3>
        <p className="text-gray-400 text-sm">No close approach data available for this asteroid.</p>
      </div>
    );
  }

  return (
    <div className="bg-cosmic-black/50 border border-nebula-purple/30 rounded-lg p-6">
      <div className="mb-4">
        <h3 className="text-xl font-bold text-white mb-2">📅 Approach History Timeline</h3>
        <p className="text-sm text-gray-400">
          All {earthApproaches.length} recorded close approaches to Earth from {new Date(earthApproaches[0].date).getFullYear()} to {new Date(earthApproaches[earthApproaches.length - 1].date).getFullYear()}
        </p>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-4 text-xs text-gray-400 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-danger-red rounded"></div>
          <span>{'< Moon distance'}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-warning-orange rounded"></div>
          <span>{'< 2× Moon'}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-star-blue rounded"></div>
          <span>{'< 5× Moon'}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-success-green rounded"></div>
          <span>{'> 5× Moon'}</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span>🌙 Moon distance: 384,400 km</span>
        </div>
      </div>

      {/* Scrollable timeline */}
      <div className="overflow-x-auto">
        <div className="min-w-[800px] relative">
          {/* Moon distance reference line */}
          <div
            className="absolute left-0 right-0 border-t-2 border-dashed border-gray-500 z-10"
            style={{
              top: `${((maxDistKm - moonDistanceKm) / maxDistKm) * 300}px`
            }}
          >
            <span className="absolute -top-3 right-2 text-xs text-gray-400 bg-cosmic-black px-1">
              🌙 Moon
            </span>
          </div>

          {/* Approach bars */}
          <div className="flex items-end justify-between gap-1 h-[300px] py-4 relative">
            {earthApproaches.map((approach, index) => {
              const barHeight = (approach.missKm / maxDistKm) * 280;
              const year = new Date(approach.date).getFullYear();
              const showYear = index === 0 ||
                              index === earthApproaches.length - 1 ||
                              isCurrent(approach.date) ||
                              index % Math.floor(earthApproaches.length / 10) === 0;

              return (
                <div
                  key={index}
                  className="flex-1 relative group"
                  style={{ minWidth: '8px' }}
                >
                  {/* Bar */}
                  <div
                    className={`
                      w-full rounded-t
                      ${getDistanceColor(approach.missKm)}
                      ${isFuture(approach.date) ? 'opacity-50' : 'opacity-100'}
                      transition-all duration-200
                      hover:opacity-80
                      ${isCurrent(approach.date) ? 'ring-2 ring-nebula-purple' : ''}
                    `}
                    style={{ height: `${barHeight}px` }}
                  ></div>

                  {/* Current marker */}
                  {isCurrent(approach.date) && (
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
                      <span className="text-xs font-bold text-nebula-purple">
                        ◄ YOU ARE HERE
                      </span>
                    </div>
                  )}

                  {/* Year label */}
                  {showYear && (
                    <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
                      <span className={`text-xs ${isCurrent(approach.date) ? 'text-nebula-purple font-bold' : 'text-gray-500'}`}>
                        {year}
                      </span>
                    </div>
                  )}

                  {/* Tooltip on hover */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                    <div className="bg-cosmic-black border border-nebula-purple/50 rounded-lg p-3 shadow-lg whitespace-nowrap">
                      <div className="text-xs space-y-1">
                        <div className="font-bold text-white">{approach.date}</div>
                        <div className={getDistanceTextColor(approach.missKm)}>
                          Distance: {(approach.missKm / 1000000).toFixed(2)}M km
                        </div>
                        <div className="text-gray-400">
                          {approach.missLunar.toFixed(2)}× Moon distance
                        </div>
                        <div className="text-star-blue">
                          Velocity: {(approach.velocityKmh / 1000).toFixed(0)}K km/h
                        </div>
                        {isFuture(approach.date) && (
                          <div className="text-nebula-purple text-xs italic">Predicted</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom axis */}
          <div className="mt-8 text-center text-xs text-gray-500">
            <div className="flex justify-between items-center">
              <span>← Past</span>
              <span>{earthApproaches.length} total approaches</span>
              <span>Future →</span>
            </div>
          </div>
        </div>
      </div>

      {/* Summary stats */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="bg-cosmic-black border border-star-blue/30 rounded-lg p-3">
          <div className="text-xs text-gray-400 mb-1">Closest Ever</div>
          <div className="text-lg font-bold text-star-blue">
            {(Math.min(...earthApproaches.map(a => a.missKm)) / 1000000).toFixed(2)}M km
          </div>
          <div className="text-xs text-gray-500">
            {earthApproaches.reduce((min, a) => a.missKm < min.missKm ? a : min).date}
          </div>
        </div>

        <div className="bg-cosmic-black border border-warning-orange/30 rounded-lg p-3">
          <div className="text-xs text-gray-400 mb-1">Average Distance</div>
          <div className="text-lg font-bold text-warning-orange">
            {(earthApproaches.reduce((sum, a) => sum + a.missKm, 0) / earthApproaches.length / 1000000).toFixed(2)}M km
          </div>
        </div>

        <div className="bg-cosmic-black border border-success-green/30 rounded-lg p-3">
          <div className="text-xs text-gray-400 mb-1">Next Approach</div>
          <div className="text-lg font-bold text-success-green">
            {earthApproaches.find(a => isFuture(a.date))
              ? earthApproaches.find(a => isFuture(a.date)).date
              : 'No future data'
            }
          </div>
        </div>
      </div>
    </div>
  );
}
