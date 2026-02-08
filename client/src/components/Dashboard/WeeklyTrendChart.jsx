import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { api } from '../../services/api';

export default function WeeklyTrendChart() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrendsData();
  }, []);

  const fetchTrendsData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/asteroids/trends?days=7');

      if (response.success) {
        // Transform data for chart - convert date to day of week
        const chartData = response.trends.map(trend => {
          const date = new Date(trend.date);
          const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
          return {
            day: dayNames[date.getDay()],
            date: trend.date,
            total: trend.total,
            hazardous: trend.hazardous,
          };
        });

        setData(chartData);
      }
    } catch (error) {
      console.error('Failed to fetch trends data:', error);
    } finally {
      setLoading(false);
    }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-cosmic-black border border-nebula-purple/50 rounded-lg p-3 shadow-lg">
          <p className="text-white font-bold mb-1">{data.date}</p>
          <p className="text-star-blue text-sm">Total: {data.total}</p>
          <p className="text-danger-red text-sm">Hazardous: {data.hazardous}</p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="bg-cosmic-black/50 border border-nebula-purple/30 rounded-lg p-6 h-96 flex items-center justify-center">
        <div className="text-gray-400">Loading weekly trends...</div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-cosmic-black/50 border border-nebula-purple/30 rounded-lg p-6 h-96 flex items-center justify-center">
        <div className="text-gray-400">No trend data available</div>
      </div>
    );
  }

  return (
    <div className="bg-cosmic-black/50 border border-nebula-purple/30 rounded-lg p-6">
      <h3 className="text-lg font-bold text-white mb-4">Weekly Asteroid Trend</h3>
      <p className="text-xs text-gray-400 mb-4">
        Past 7 days of Near-Earth Object activity
      </p>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="day"
            stroke="#9CA3AF"
            tick={{ fill: '#9CA3AF' }}
            label={{ value: 'Day of Week', position: 'insideBottom', offset: -10, fill: '#9CA3AF' }}
          />
          <YAxis
            stroke="#9CA3AF"
            tick={{ fill: '#9CA3AF' }}
            label={{ value: 'Count', angle: -90, position: 'insideLeft', fill: '#9CA3AF' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="line"
            formatter={(value) => <span className="text-gray-300">{value}</span>}
          />
          <Line
            type="monotone"
            dataKey="total"
            stroke="#3B82F6"
            strokeWidth={2}
            name="Total Asteroids"
            dot={{ fill: '#3B82F6', r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="hazardous"
            stroke="#E74C3C"
            strokeWidth={2}
            name="Hazardous"
            dot={{ fill: '#E74C3C', r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>

      <div className="mt-4 flex items-center justify-center gap-6 text-xs text-gray-400">
        <div className="flex items-center gap-2">
          <div className="w-8 h-0.5 bg-star-blue"></div>
          <span>Total NEOs</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-0.5 bg-danger-red"></div>
          <span>Potentially Hazardous</span>
        </div>
      </div>
    </div>
  );
}
