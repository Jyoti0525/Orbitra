import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import SizeComparison from './SizeComparison';
import DistanceScaleVisualizer from './DistanceScaleVisualizer';

export default function DetailDrawer({ asteroid, onClose }) {
  const { isAuthenticated } = useAuth();
  const [inWatchlist, setInWatchlist] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated && asteroid) {
      checkWatchlist();
    }
  }, [asteroid, isAuthenticated]);

  const checkWatchlist = async () => {
    try {
      const response = await api.get(`/api/watchlist/check/${asteroid.id}`);
      if (response.success) {
        setInWatchlist(response.inWatchlist);
      }
    } catch (error) {
      console.error('Failed to check watchlist:', error);
    }
  };

  const handleWatchlistToggle = async () => {
    if (!isAuthenticated) return;

    try {
      setLoading(true);
      if (inWatchlist) {
        const response = await api.delete(`/api/watchlist/${asteroid.id}`);
        if (response.success) {
          setInWatchlist(false);
        }
      } else {
        const response = await api.post(`/api/watchlist/${asteroid.id}`);
        if (response.success) {
          setInWatchlist(true);
        }
      }
    } catch (error) {
      console.error('Failed to update watchlist:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!asteroid) return null;

  const approach = asteroid.closeApproaches?.[0];
  const getRiskColor = (score) => {
    if (score >= 70) return 'text-danger-red';
    if (score >= 40) return 'text-warning-orange';
    return 'text-success-green';
  };

  const getRiskLabel = (score) => {
    if (score >= 70) return 'CRITICAL';
    if (score >= 40) return 'HIGH';
    if (score >= 20) return 'MEDIUM';
    return 'LOW';
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed bottom-0 left-0 right-0 bg-deep-space border-t-2 border-nebula-purple z-50 animate-slide-up max-h-[70vh] overflow-y-auto">
        <div className="container mx-auto px-6 py-8">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">{asteroid.name}</h2>
              <span className={`text-xl font-bold ${getRiskColor(asteroid.riskScore)}`}>
                {getRiskLabel(asteroid.riskScore)} {asteroid.riskScore}
              </span>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left: Data Cards */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {approach && (
                  <>
                    <div className="bg-cosmic-black/50 border border-star-blue/30 rounded-lg p-4">
                      <div className="text-sm text-gray-400 mb-1">Miss Distance</div>
                      <div className="text-2xl font-bold text-star-blue">
                        {(approach.missDistanceKm / 1000000).toFixed(2)}M km
                      </div>
                    </div>
                    <div className="bg-cosmic-black/50 border border-nebula-purple/30 rounded-lg p-4">
                      <div className="text-sm text-gray-400 mb-1">Velocity</div>
                      <div className="text-2xl font-bold text-nebula-purple">
                        {(approach.velocityKmh / 1000).toFixed(0)}K km/h
                      </div>
                    </div>
                  </>
                )}
                <div className="bg-cosmic-black/50 border border-success-green/30 rounded-lg p-4">
                  <div className="text-sm text-gray-400 mb-1">Diameter</div>
                  <div className="text-2xl font-bold text-success-green">
                    {asteroid.diameterMinM?.toFixed(0)}-{asteroid.diameterMaxM?.toFixed(0)}m
                  </div>
                </div>
                <div className="bg-cosmic-black/50 border border-warning-orange/30 rounded-lg p-4">
                  <div className="text-sm text-gray-400 mb-1">Magnitude</div>
                  <div className="text-2xl font-bold text-warning-orange">
                    {asteroid.absoluteMagnitude?.toFixed(1)}H
                  </div>
                </div>
              </div>

              {approach && (
                <div className="bg-cosmic-black/50 border border-nebula-purple/30 rounded-lg p-4">
                  <div className="text-sm text-gray-400 mb-2">Close Approach Date</div>
                  <div className="text-white">
                    {new Date(approach.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Right: Size Comparison */}
            <div className="bg-cosmic-black/50 border border-star-blue/30 rounded-lg p-6">
              <SizeComparison diameterKm={asteroid.diameterMaxKm || 0} />

              {/* Add to Watchlist */}
              {!isAuthenticated && (
                <div className="mt-6 text-center text-sm text-gray-400">
                  Sign in to add to watchlist
                </div>
              )}
              {isAuthenticated && (
                <button
                  onClick={handleWatchlistToggle}
                  disabled={loading}
                  className={`mt-6 w-full px-6 py-3 border rounded-lg transition disabled:opacity-50 ${
                    inWatchlist
                      ? 'bg-danger-red/20 text-danger-red border-danger-red hover:bg-danger-red hover:text-white'
                      : 'bg-star-blue/20 text-star-blue border-star-blue hover:bg-star-blue hover:text-white'
                  }`}
                >
                  {loading ? 'Loading...' : inWatchlist ? '✖ Remove from Watchlist' : '⭐ Add to Watchlist'}
                </button>
              )}
            </div>
          </div>

          {/* Distance Scale Visualizer */}
          {approach && (
            <DistanceScaleVisualizer missDistanceKm={approach.missDistanceKm} />
          )}
        </div>
      </div>
    </>
  );
}
