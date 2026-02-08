import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
import { api } from '../../services/api';

export default function MissDistanceBarChart() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const MOON_DISTANCE = 384400; // km

  useEffect(() => {
    fetchAsteroidData();
  }, []);

  const fetchAsteroidData = async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      const response = await api.get(`/api/asteroids/feed?start_date=${today}`);

      if (response.success) {
        // Sort by closest approaches and take top 10
        const sortedData = response.asteroids
          .filter(a => a.closeApproaches && a.closeApproaches.length > 0)
          .map(asteroid => {
            const approach = asteroid.closeApproaches[0];
            return {
              name: asteroid.name.length > 12 ? asteroid.name.substring(0, 12) + '...' : asteroid.name,
              fullName: asteroid.name,
              distance: approach.missDistanceKm,
              distanceM: approach.missDistanceKm / 1000000, // Million km for display
              lunarMultiple: (approach.missDistanceKm / MOON_DISTANCE).toFixed(1),
              riskScore: asteroid.riskScore || 0,
              id: asteroid.id,
            };
          })
          .sort((a, b) => a.distance - b.distance)
          .slice(0, 10);

        setData(sortedData);
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
          <p className="text-white font-bold mb-1">{data.fullName}</p>
          <p className="text-gray-300 text-sm">Distance: {data.distanceM.toFixed(2)}M km</p>
          <p className="text-gray-300 text-sm">Lunar Distance: {data.lunarMultiple}× Moon</p>
          <p className="text-gray-300 text-sm">Risk Score: {data.riskScore}</p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="bg-cosmic-black/50 border border-nebula-purple/30 rounded-lg p-6 h-96 flex items-center justify-center">
        <div className="text-gray-400">Loading bar chart...</div>
      </div>
    );
  }

  return (
    <div className="bg-cosmic-black/50 border border-nebula-purple/30 rounded-lg p-6">
      <h3 className="text-lg font-bold text-white mb-4">Miss Distance Comparison</h3>
      <p className="text-xs text-gray-400 mb-4">
        Top 10 closest approaches today (dashed line = Moon distance)
      </p>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            type="number"
            stroke="#9CA3AF"
            tick={{ fill: '#9CA3AF' }}
            label={{ value: 'Distance (M km)', position: 'insideBottom', offset: -5, fill: '#9CA3AF' }}
          />
          <YAxis
            type="category"
            dataKey="name"
            stroke="#9CA3AF"
            tick={{ fill: '#9CA3AF', fontSize: 11 }}
            width={100}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine
            x={MOON_DISTANCE / 1000000}
            stroke="#9CA3AF"
            strokeDasharray="5 5"
            label={{
              value: '🌙 Moon',
              position: 'top',
              fill: '#9CA3AF',
              fontSize: 11,
            }}
          />
          <Bar dataKey="distanceM" radius={[0, 4, 4, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getRiskColor(entry.riskScore)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-4 flex items-center justify-between text-xs text-gray-400">
        <div>
          Closest: <span className="text-white font-semibold">{data[0]?.distanceM.toFixed(2)}M km</span>
        </div>
        <div>
          Moon: <span className="text-white font-semibold">0.38M km</span>
        </div>
      </div>
    </div>
  );
}
