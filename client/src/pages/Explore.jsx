import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import ExploreTab from '../components/Explore/ExploreTab';
import CalendarTab from '../components/Explore/CalendarTab';
import ToolsTab from '../components/Explore/ToolsTab';
import './ExploreTabs.css';

export default function Explore() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('explore');
  const [asteroids, setAsteroids] = useState([]);
  const [loading, setLoading] = useState(true);

  // Date range picker state
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(tomorrow);

  useEffect(() => {
    fetchData();
  }, [startDate, endDate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/asteroids/feed?start_date=${startDate}&end_date=${endDate}`);

      if (response.success) {
        setAsteroids(response.asteroids || []);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const shiftDates = (days) => {
    const newStart = new Date(new Date(startDate).getTime() + days * 86400000);
    const newEnd = new Date(new Date(endDate).getTime() + days * 86400000);
    setStartDate(newStart.toISOString().split('T')[0]);
    setEndDate(newEnd.toISOString().split('T')[0]);
  };

  const resetToToday = () => {
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    setStartDate(today);
    setEndDate(tomorrow);
  };

  const validateDateRange = (start, end) => {
    const startMs = new Date(start).getTime();
    const endMs = new Date(end).getTime();
    const diffDays = (endMs - startMs) / 86400000;

    if (diffDays > 7) {
      alert('Date range cannot exceed 7 days (NASA API limit)');
      return false;
    }
    if (diffDays < 0) {
      alert('End date must be after start date');
      return false;
    }
    return true;
  };

  const handleStartDateChange = (e) => {
    const newStart = e.target.value;
    if (validateDateRange(newStart, endDate)) {
      setStartDate(newStart);
    }
  };

  const handleEndDateChange = (e) => {
    const newEnd = e.target.value;
    if (validateDateRange(startDate, newEnd)) {
      setEndDate(newEnd);
    }
  };

  const handleSignIn = () => {
    navigate('/login');
  };

  const handleDateChange = (newStartDate, newEndDate) => {
    setStartDate(newStartDate);
    setEndDate(newEndDate);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-deep-space flex items-center justify-center">
        <div className="text-white text-xl">Loading asteroid data...</div>
      </div>
    );
  }

  return (
    <div className="explore-page">
      <div className="explore-shell">
        {/* Masthead */}
        <header className="masthead">
          <div>
            <p className="eyebrow">Near-Earth Objects</p>
            <h1
              onClick={() => navigate('/')}
              style={{ cursor: 'pointer' }}
            >
              🌌 Orbitra
            </h1>
          </div>
          <div className="masthead-actions">
            {!isAuthenticated && (
              <button
                onClick={handleSignIn}
                className="pill primary"
              >
                Sign In
              </button>
            )}
            {isAuthenticated && (
              <button
                onClick={() => navigate('/dashboard')}
                className="pill primary"
              >
                Dashboard
              </button>
            )}
          </div>
        </header>

        {/* Tab Navigation */}
        <nav className="explore-tabs-nav">
          <button
            className={activeTab === 'explore' ? 'active' : ''}
            onClick={() => setActiveTab('explore')}
          >
            🔍 Explore
          </button>
          <button
            className={activeTab === 'calendar' ? 'active' : ''}
            onClick={() => setActiveTab('calendar')}
          >
            📅 Calendar
          </button>
          <button
            className={activeTab === 'tools' ? 'active' : ''}
            onClick={() => setActiveTab('tools')}
          >
            🛠️ Tools
          </button>
        </nav>

        {/* Tab Content */}
        <div className="explore-content">
          {activeTab === 'explore' && (
            <ExploreTab
              asteroids={asteroids}
              startDate={startDate}
              endDate={endDate}
              onDateChange={handleDateChange}
            />
          )}
          {activeTab === 'calendar' && <CalendarTab />}
          {activeTab === 'tools' && <ToolsTab />}
        </div>
      </div>
    </div>
  );
}
