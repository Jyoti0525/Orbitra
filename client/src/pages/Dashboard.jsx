import { useState, useEffect } from 'react';
import { asteroidApi } from '../services/api';
import Loading from '../components/Common/Loading';
import ErrorMessage from '../components/Common/ErrorMessage';

export default function Dashboard() {
  const [asteroids, setAsteroids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAsteroids();
  }, []);

  const fetchAsteroids = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get today's date
      const today = new Date().toISOString().split('T')[0];
      const data = await asteroidApi.getFeed(today);

      setAsteroids(data.asteroids || []);
    } catch (err) {
      console.error('Error fetching asteroids:', err);
      setError(err.message || 'Failed to load asteroids');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading message="Loading asteroids..." />;

  if (error) return <ErrorMessage message={error} onRetry={fetchAsteroids} />;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-gray-400">Real-time Near-Earth Objects feed</p>
      </div>

      <div className="grid gap-4">
        {asteroids.length === 0 ? (
          <div className="bg-deep-space rounded-lg p-8 text-center">
            <p className="text-gray-400">No asteroids approaching today</p>
          </div>
        ) : (
          asteroids.map(asteroid => (
            <div
              key={asteroid.id}
              className="bg-deep-space rounded-lg p-6 border border-nebula-purple/30 hover:border-star-blue/50 transition"
            >
              <h3 className="text-xl font-semibold mb-2">{asteroid.name}</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-400">Size</p>
                  <p className="font-semibold">{asteroid.diameterMax?.toFixed(2)} km</p>
                </div>
                <div>
                  <p className="text-gray-400">Velocity</p>
                  <p className="font-semibold">{asteroid.velocity?.toLocaleString()} km/h</p>
                </div>
                <div>
                  <p className="text-gray-400">Distance</p>
                  <p className="font-semibold">{asteroid.missDistance?.toFixed(3)} AU</p>
                </div>
                <div>
                  <p className="text-gray-400">Risk</p>
                  <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                    asteroid.riskLevel === 'HIGH' ? 'bg-danger-red/20 text-danger-red' :
                    asteroid.riskLevel === 'MEDIUM' ? 'bg-warning-orange/20 text-warning-orange' :
                    'bg-safe-green/20 text-safe-green'
                  }`}>
                    {asteroid.riskLevel}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
