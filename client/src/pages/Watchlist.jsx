import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { watchlistApi } from '../services/api';

export default function Watchlist() {
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
      const response = await watchlistApi.getAll();
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
      const response = await watchlistApi.remove(neoId);
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
    if (score >= 70) return 'bg-red-500/20 text-red-400 border border-red-500/50';
    if (score >= 40) return 'bg-orange-500/20 text-orange-400 border border-orange-500/50';
    if (score >= 20) return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50';
    return 'bg-green-500/20 text-green-400 border border-green-500/50';
  };

  const getRiskLabel = (score) => {
    if (score >= 70) return 'CRITICAL';
    if (score >= 40) return 'HIGH';
    if (score >= 20) return 'MEDIUM';
    return 'LOW';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-xl text-white animate-pulse">Loading watchlist...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">My Watchlist</h1>
          <p className="text-gray-400">
            Monitoring {watchlist.length} {watchlist.length === 1 ? 'asteroid' : 'asteroids'}
          </p>
        </div>
        <button
          onClick={() => navigate('/explore')}
          className="px-4 py-2 bg-star-blue/20 text-star-blue border border-star-blue/50 rounded-lg hover:bg-star-blue/30 transition flex items-center gap-2"
        >
          <span>🔭</span> Find More
        </button>
      </div>

      {watchlist.length === 0 ? (
        <div className="bg-cosmic-black/50 border border-gray-800 rounded-xl p-12 text-center">
          <div className="text-6xl mb-4">⭐</div>
          <h3 className="text-xl font-bold text-white mb-2">Your watchlist is empty</h3>
          <p className="text-gray-400 mb-6">Start exploring asteroids to add them to your tracking list.</p>
          <button
            onClick={() => navigate('/explore')}
            className="px-6 py-3 bg-star-blue text-white rounded-lg hover:bg-star-blue/80 transition"
          >
            Go to Explore
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {watchlist.map((asteroid) => {
            const approach = asteroid.closeApproaches?.[0];
            const riskChipClass = getRiskChipClass(asteroid.riskScore);
            const riskLabel = getRiskLabel(asteroid.riskScore);

            return (
              <div
                key={asteroid.id}
                className="group bg-cosmic-black/40 border border-gray-800 rounded-xl p-6 hover:border-star-blue/50 transition-all duration-300"
              >
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  {/* Asteroid Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-white group-hover:text-star-blue transition-colors">
                        {asteroid.name}
                      </h3>
                      <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${riskChipClass}`}>
                        {riskLabel} Risk ({asteroid.riskScore})
                      </span>
                      {asteroid.isHazardous && (
                        <span className="px-2 py-0.5 rounded text-xs font-bold uppercase bg-red-600/20 text-red-500 border border-red-600/30">
                          HAZARDOUS
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
                      <div>
                        <div className="text-gray-500 text-xs uppercase tracking-wider mb-1">Diameter</div>
                        <div className="text-gray-200 font-medium">
                          {asteroid.diameterMaxM?.toLocaleString()} m
                        </div>
                      </div>

                      {approach && (
                        <>
                          <div>
                            <div className="text-gray-500 text-xs uppercase tracking-wider mb-1">Close Approach</div>
                            <div className="text-gray-200 font-medium">
                              {new Date(approach.closeApproachDateFull).toLocaleDateString()}
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-500 text-xs uppercase tracking-wider mb-1">Pass Distance</div>
                            <div className="text-gray-200 font-medium">
                              {(approach.missDistanceKm / 1000000).toFixed(2)}M km
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-500 text-xs uppercase tracking-wider mb-1">Velocity</div>
                            <div className="text-gray-200 font-medium">
                              {parseFloat(approach.velocityKmh).toLocaleString()} km/h
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 w-full md:w-auto">
                    <button
                      onClick={() => navigate(`/asteroid/${asteroid.id}`)}
                      className="flex-1 md:flex-none px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 transition"
                    >
                      Details
                    </button>
                    <button
                      onClick={() => handleRemove(asteroid.id)}
                      disabled={removing === asteroid.id}
                      className="flex-1 md:flex-none px-4 py-2 border border-red-500/50 text-red-400 rounded hover:bg-red-500/10 transition disabled:opacity-50"
                    >
                      {removing === asteroid.id ? 'Removing...' : 'Remove'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
