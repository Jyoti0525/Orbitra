import { useMemo, useState } from 'react';

export default function MultiBodyApproaches({ closeApproaches }) {
  const [selectedBody, setSelectedBody] = useState('Earth');

  // Group approaches by orbiting body
  const groupedApproaches = useMemo(() => {
    if (!closeApproaches || closeApproaches.length === 0) return {};

    const grouped = {};

    closeApproaches.forEach(ca => {
      const body = ca.orbitingBody || 'Earth';
      if (!grouped[body]) {
        grouped[body] = [];
      }
      grouped[body].push({
        date: ca.date,
        missKm: ca.missDistanceKm,
        velocityKmh: ca.velocityKmh,
      });
    });

    // Sort each body's approaches by date
    Object.keys(grouped).forEach(body => {
      grouped[body].sort((a, b) => new Date(a.date) - new Date(b.date));
    });

    return grouped;
  }, [closeApproaches]);

  // Calculate summary for each body
  const bodySummaries = useMemo(() => {
    return Object.entries(groupedApproaches).map(([body, approaches]) => {
      const closestApproach = approaches.reduce((min, a) =>
        a.missKm < min.missKm ? a : min
      , approaches[0]);

      const nextApproach = approaches.find(a => new Date(a.date) > new Date());

      return {
        body,
        totalApproaches: approaches.length,
        closestKm: closestApproach.missKm,
        closestDate: closestApproach.date,
        nextApproach: nextApproach ? nextApproach.date : null,
        approaches,
      };
    }).sort((a, b) => b.totalApproaches - a.totalApproaches);
  }, [groupedApproaches]);

  const getBodyIcon = (body) => {
    const icons = {
      'Earth': '🌍',
      'Venus': '♀',
      'Mercury': '☿',
      'Mars': '♂',
      'Merc': '☿',
      'Juptr': '♃',
    };
    return icons[body] || '🪐';
  };

  const getBodyColor = (body) => {
    const colors = {
      'Earth': 'star-blue',
      'Venus': 'warning-orange',
      'Mercury': 'lunar-gray',
      'Mars': 'danger-red',
      'Merc': 'lunar-gray',
    };
    return colors[body] || 'nebula-purple';
  };

  if (Object.keys(groupedApproaches).length === 0) {
    return null;
  }

  return (
    <div className="bg-cosmic-black/50 border border-nebula-purple/30 rounded-lg p-6">
      <div className="mb-4">
        <h3 className="text-xl font-bold text-white mb-2">🪐 Multi-Body Approaches</h3>
        <p className="text-sm text-gray-400">
          This asteroid passes near {bodySummaries.length} celestial {bodySummaries.length === 1 ? 'body' : 'bodies'}
        </p>
      </div>

      {/* Body summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {bodySummaries.map((summary) => {
          const color = getBodyColor(summary.body);
          const isSelected = selectedBody === summary.body;

          return (
            <div
              key={summary.body}
              onClick={() => setSelectedBody(summary.body)}
              className={`
                bg-cosmic-black border rounded-lg p-4 cursor-pointer
                transition-all duration-200 hover:scale-105
                ${isSelected
                  ? `border-${color} ring-2 ring-${color}/50`
                  : `border-${color}/30 hover:border-${color}/60`
                }
              `}
            >
              {/* Body header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-3xl">{getBodyIcon(summary.body)}</span>
                  <span className={`font-bold text-${color}`}>{summary.body}</span>
                </div>
                {isSelected && (
                  <span className="text-xs text-nebula-purple">● Selected</span>
                )}
              </div>

              {/* Stats */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Approaches:</span>
                  <span className="text-white font-semibold">{summary.totalApproaches}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-400">Closest Ever:</span>
                  <span className={`text-${color} font-semibold`}>
                    {(summary.closestKm / 1000000).toFixed(2)}M km
                  </span>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-gray-400">Date:</span>
                  <span className="text-xs text-gray-300">{summary.closestDate}</span>
                </div>

                {summary.nextApproach && (
                  <div className="flex flex-col gap-1 pt-2 border-t border-gray-700">
                    <span className="text-gray-400">Next Approach:</span>
                    <span className="text-xs text-success-green">{summary.nextApproach}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected body detail */}
      {selectedBody && groupedApproaches[selectedBody] && (
        <div className="bg-cosmic-black border border-nebula-purple/30 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-bold text-white">
              {getBodyIcon(selectedBody)} {selectedBody} Approach Details
            </h4>
            <span className="text-sm text-gray-400">
              {groupedApproaches[selectedBody].length} total approaches
            </span>
          </div>

          {/* Approach list (scrollable) */}
          <div className="max-h-[300px] overflow-y-auto space-y-2">
            {groupedApproaches[selectedBody].map((approach, index) => {
              const isPast = new Date(approach.date) < new Date();
              const isFuture = !isPast;

              return (
                <div
                  key={index}
                  className={`
                    flex items-center justify-between p-3 rounded-lg
                    ${isPast ? 'bg-gray-800/30' : 'bg-nebula-purple/10 border border-nebula-purple/30'}
                  `}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-center min-w-[80px]">
                      <div className={`text-sm font-semibold ${isFuture ? 'text-success-green' : 'text-gray-400'}`}>
                        {approach.date}
                      </div>
                      {isFuture && (
                        <div className="text-xs text-nebula-purple">Predicted</div>
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="text-sm text-white">
                        Distance: <span className={`font-semibold text-${getBodyColor(selectedBody)}`}>
                          {(approach.missKm / 1000000).toFixed(3)}M km
                        </span>
                      </div>
                      <div className="text-xs text-gray-400">
                        Velocity: {(approach.velocityKmh / 1000).toFixed(0)}K km/h
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs text-gray-500">
                      #{index + 1}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Comparison note */}
      {bodySummaries.length > 1 && (
        <div className="mt-4 p-3 bg-star-blue/10 border border-star-blue/30 rounded-lg">
          <div className="flex items-start gap-2">
            <span className="text-star-blue">ℹ️</span>
            <p className="text-xs text-gray-300">
              <strong>Orbital Path:</strong> This asteroid's orbit brings it close to multiple celestial bodies.
              The high number of Earth approaches ({bodySummaries.find(s => s.body === 'Earth')?.totalApproaches || 0})
              suggests it follows an orbit similar to Earth's, making it an interesting candidate for study and potential
              future missions.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
