import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import RiskDistribution from '../components/Dashboard/RiskDistribution';
import WatchlistSection from '../components/Dashboard/WatchlistSection';
import AlertsSection from '../components/Dashboard/AlertsSection';
import ActivityLog from '../components/Dashboard/ActivityLog';
import SpeedDistanceScatter from '../components/Dashboard/SpeedDistanceScatter';
import WeeklyTrendChart from '../components/Dashboard/WeeklyTrendChart';
import MissDistanceBarChart from '../components/Dashboard/MissDistanceBarChart';
import ImpactCalculator from '../components/Dashboard/ImpactCalculator';
import ApproachCalendar from '../components/Dashboard/ApproachCalendar';
import './Dashboard.css';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [watchlistCount, setWatchlistCount] = useState(0);
  const [alertsCount, setAlertsCount] = useState(0);
  const [notificationsCount, setNotificationsCount] = useState(0);
  const [highRiskCount, setHighRiskCount] = useState(0);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [, setTick] = useState(0); // Force re-render for timestamp updates

  useEffect(() => {
    fetchDashboardData();

    // Set up auto-refresh polling every 60 seconds
    const refreshInterval = setInterval(() => {
      fetchDashboardData(true); // Pass true to indicate auto-refresh
    }, 60000); // 60 seconds

    // Update timestamp display every second
    const tickInterval = setInterval(() => {
      setTick(t => t + 1);
    }, 1000);

    // Cleanup intervals on component unmount
    return () => {
      clearInterval(refreshInterval);
      clearInterval(tickInterval);
    };
  }, []);

  const fetchDashboardData = async (isAutoRefresh = false) => {
    try {
      // Only show loading spinner on initial load, not during auto-refresh
      if (!isAutoRefresh) {
        setLoading(true);
      }

      // Fetch all dashboard data in parallel — each call is independent
      // so one failing shouldn't block the others
      const [statsResponse, watchlistResponse, alertsResponse, notifsResponse] = await Promise.allSettled([
        api.get('/api/asteroids/stats'),
        api.get('/api/watchlist'),
        api.get('/api/alerts'),
        api.get('/api/notifications'),
      ]);

      // Process asteroid stats
      if (statsResponse.status === 'fulfilled' && statsResponse.value.success) {
        setStats(statsResponse.value.stats);
      }

      // Process watchlist
      if (watchlistResponse.status === 'fulfilled' && watchlistResponse.value.success) {
        const watchlist = watchlistResponse.value.watchlist || [];
        setWatchlistCount(watchlist.length);
        const highRisk = watchlist.filter(a => a.riskScore >= 70).length;
        setHighRiskCount(highRisk);
      }

      // Process alerts
      if (alertsResponse.status === 'fulfilled' && alertsResponse.value.success) {
        const activeAlerts = (alertsResponse.value.alerts || []).filter(a => a.isActive);
        setAlertsCount(activeAlerts.length);
      }

      // Process notifications
      if (notifsResponse.status === 'fulfilled' && notifsResponse.value.success) {
        const notifications = notifsResponse.value.notifications || [];
        const today = new Date().toISOString().split('T')[0];
        const todayNotifs = notifications.filter(n => {
          if (!n.triggeredAt) return false;
          const notifDate = new Date(n.triggeredAt.seconds * 1000).toISOString().split('T')[0];
          return notifDate === today && !n.isRead;
        });
        setNotificationsCount(todayNotifs.length);
      }

      // Update last refresh timestamp
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      if (!isAutoRefresh) {
        setLoading(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="loading-container">
          <div className="loading-text">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  const formatLastRefresh = () => {
    const seconds = Math.floor((new Date() - lastRefresh) / 1000);
    if (seconds < 10) return 'Just now';
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return lastRefresh.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-shell">
        {/* Header */}
        <header className="dashboard-header">
          <div>
            <h1>
              Welcome back, {user?.displayName || user?.email || 'Explorer'} 👋
            </h1>
            <p>Your personalized asteroid monitoring dashboard</p>
          </div>
          <div className="dashboard-refresh-info">
            <span>
              Last updated: {formatLastRefresh()}
            </span>
            <button
              onClick={() => fetchDashboardData()}
              className="pill primary"
              title="Refresh dashboard data"
            >
              🔄 Refresh
            </button>
          </div>
        </header>

        {/* Top Row: Risk Distribution + User Stats */}
        <div className="dashboard-grid-2">
          <RiskDistribution riskDistribution={stats?.risk_distribution} />

          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Your Stats</h3>
            </div>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">⭐</div>
                <div className="stat-content">
                  <p>Watching</p>
                  <strong>{watchlistCount} asteroids</strong>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🔔</div>
                <div className="stat-content">
                  <p>Active Alerts</p>
                  <strong>{alertsCount} rules</strong>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">⚠️</div>
                <div className="stat-content">
                  <p>Triggered Today</p>
                  <strong>{notificationsCount} notifications</strong>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🔴</div>
                <div className="stat-content">
                  <p>High Risk</p>
                  <strong>{highRiskCount} in watchlist</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

      {/* Watchlist Section */}
      <WatchlistSection />

      {/* Alerts Section */}
      <AlertsSection />

      {/* Activity Log */}
      <ActivityLog />

        {/* Analytics Section */}
        <section>
          <p className="eyebrow">Data Insights</p>
          <h2 className="card-title" style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Analytics</h2>
          <div className="dashboard-grid-2">
            <SpeedDistanceScatter />
            <MissDistanceBarChart />
            <WeeklyTrendChart />
            <div className="card">
              <div className="empty-state">
                <div className="empty-state-icon">📊</div>
                <p className="empty-state-text">More analytics coming soon</p>
              </div>
            </div>
          </div>
        </section>

        {/* Impact Calculator */}
        <section>
          <p className="eyebrow">Simulation Tool</p>
          <h2 className="card-title" style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Impact Calculator</h2>
          <ImpactCalculator />
        </section>

        {/* Approach Calendar */}
        <ApproachCalendar />
      </div>
    </div>
  );
}
