import { useState, useEffect } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis } from 'recharts';
import { api } from '../../services/api';

export default function SpeedDistanceScatter() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAsteroidData();
  }, []);

  const fetchAsteroidData = async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      const response = await api.get(`/api/asteroids/feed?start_date=${today}`);

      if (response.success) {
        // Transform asteroid data for scatter plot
        const chartData = response.asteroids
          .filter(a => a.closeApproaches && a.closeApproaches.length > 0)
          .map(asteroid => {
            const approach = asteroid.closeApproaches[0];
            return {
              name: asteroid.name,
              distance: approach.missDistanceKm / 1000000, // Convert to million km
              velocity: approach.velocityKmh / 1000, // Convert to thousand km/h
              diameter: asteroid.diameterMaxKm || 0.1,
              riskScore: asteroid.riskScore || 0,
              id: asteroid.id,
            };
          });

        setData(chartData);
      }
    } catch (error) {
      console.error('Failed to fetch asteroid data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (score) => {
    if (score >= 70) return '#E74C3C'; // danger-red
    if (score >= 40) return '#F39C12'; // warning-orange
    if (score >= 20) return '#9B59B6'; // nebula-purple
    return '#2ECC71'; // success-green
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-cosmic-black border border-nebula-purple/50 rounded-lg p-3 shadow-lg">
          <p className="text-white font-bold mb-1">{data.name}</p>
          <p className="text-gray-300 text-sm">Distance: {data.distance.toFixed(2)}M km</p>
          <p className="text-gray-300 text-sm">Velocity: {data.velocity.toFixed(1)}K km/h</p>
          <p className="text-gray-300 text-sm">Diameter: {(data.diameter * 1000).toFixed(0)}m</p>
          <p className="text-gray-300 text-sm">Risk Score: {data.riskScore}</p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="bg-cosmic-black/50 border border-nebula-purple/30 rounded-lg p-6 h-96 flex items-center justify-center">
        <div className="text-gray-400">Loading scatter plot...</div>
      </div>
    );
  }

  return (
    <div className="bg-cosmic-black/50 border border-nebula-purple/30 rounded-lg p-6">
      <h3 className="text-lg font-bold text-white mb-4">Speed vs Distance</h3>
      <p className="text-xs text-gray-400 mb-4">
        Each dot represents an asteroid. Size = diameter, Color = risk level
      </p>

      <ResponsiveContainer width="100%" height={300}>
        <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            type="number"
            dataKey="distance"
            name="Distance"
            label={{ value: 'Distance (M km)', position: 'insideBottom', offset: -10, fill: '#9CA3AF' }}
            stroke="#9CA3AF"
            tick={{ fill: '#9CA3AF' }}
          />
          <YAxis
            type="number"
            dataKey="velocity"
            name="Velocity"
            label={{ value: 'Velocity (K km/h)', angle: -90, position: 'insideLeft', fill: '#9CA3AF' }}
            stroke="#9CA3AF"
            tick={{ fill: '#9CA3AF' }}
          />
          <ZAxis
            type="number"
            dataKey="diameter"
            range={[50, 400]}
            name="Diameter"
          />
          <Tooltip content={<CustomTooltip />} />
          {data.map((entry, index) => (
            <Scatter
              key={`scatter-${index}`}
              data={[entry]}
              fill={getRiskColor(entry.riskScore)}
              shape="circle"
            />
          ))}
        </ScatterChart>
      </ResponsiveContainer>

      <div className="mt-4 flex flex-wrap gap-3 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-success-green"></div>
          <span className="text-gray-400">Low Risk</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-nebula-purple"></div>
          <span className="text-gray-400">Medium Risk</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-warning-orange"></div>
          <span className="text-gray-400">High Risk</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-danger-red"></div>
          <span className="text-gray-400">Critical Risk</span>
        </div>
      </div>
    </div>
  );
}
