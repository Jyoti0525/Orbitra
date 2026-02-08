import { useState, useEffect } from 'react';
import { api } from '../../services/api';

export default function AlertsSection() {
  const [alerts, setAlerts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newAlert, setNewAlert] = useState({
    alertType: 'distance',
    thresholdValue: '',
  });

  const presets = [
    { label: 'All Hazardous', alertType: 'hazardous', thresholdValue: true, icon: '⚠️' },
    { label: 'Under 1M km', alertType: 'distance', thresholdValue: 1000000, icon: '📏' },
    { label: 'Over 500m', alertType: 'diameter', thresholdValue: 500, icon: '📐' },
    { label: 'Sentry Objects', alertType: 'sentry', thresholdValue: true, icon: '🎯' },
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [alertsRes, notificationsRes] = await Promise.all([
        api.get('/api/alerts'),
        api.get('/api/notifications?limit=20'),
      ]);

      if (alertsRes.success) {
        setAlerts(alertsRes.alerts || []);
      }
      if (notificationsRes.success) {
        setNotifications(notificationsRes.notifications || []);
      }
    } catch (error) {
      console.error('Failed to fetch alerts data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePresetClick = async (preset) => {
    try {
      setCreating(true);
      const response = await api.post('/api/alerts', {
        alertType: preset.alertType,
        thresholdValue: preset.thresholdValue,
        isActive: true,
      });

      if (response.success) {
        setAlerts(prev => [response.alert, ...prev]);
      }
    } catch (error) {
      console.error('Failed to create preset alert:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleCreateCustom = async (e) => {
    e.preventDefault();
    if (!newAlert.thresholdValue) return;

    try {
      setCreating(true);
      const response = await api.post('/api/alerts', {
        alertType: newAlert.alertType,
        thresholdValue: parseFloat(newAlert.thresholdValue),
        isActive: true,
      });

      if (response.success) {
        setAlerts(prev => [response.alert, ...prev]);
        setNewAlert({ alertType: 'distance', thresholdValue: '' });
      }
    } catch (error) {
      console.error('Failed to create custom alert:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleToggleAlert = async (alertId, currentStatus) => {
    try {
      const response = await api.patch(`/api/alerts/${alertId}/toggle`, {
        isActive: !currentStatus,
      });

      if (response.success) {
        setAlerts(prev =>
          prev.map(a => (a.id === alertId ? { ...a, isActive: !currentStatus } : a))
        );
      }
    } catch (error) {
      console.error('Failed to toggle alert:', error);
    }
  };

  const handleDeleteAlert = async (alertId) => {
    try {
      const response = await api.delete(`/api/alerts/${alertId}`);
      if (response.success) {
        setAlerts(prev => prev.filter(a => a.id !== alertId));
      }
    } catch (error) {
      console.error('Failed to delete alert:', error);
    }
  };

  const getAlertTypeLabel = (type) => {
    const labels = {
      distance: 'Distance',
      diameter: 'Diameter',
      hazardous: 'Hazardous',
      sentry: 'Sentry',
    };
    return labels[type] || type;
  };

  const formatThreshold = (type, value) => {
    if (type === 'distance') return `${(value / 1000000).toFixed(1)}M km`;
    if (type === 'diameter') return `${value}m`;
    if (type === 'hazardous' || type === 'sentry') return 'Enabled';
    return value;
  };

  const formatTimeAgo = (timestamp) => {
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  if (loading) {
    return (
      <div className="card">
        <h3 className="card-title">My Alerts</h3>
        <div className="loading-container">
          <div className="loading-text">Loading alerts...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <h3 className="card-title" style={{ marginBottom: '1.5rem' }}>My Alerts</h3>

      {/* Quick Presets */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h4 className="eyebrow">QUICK PRESETS</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.5rem' }}>
          {presets.map((preset) => (
            <button
              key={preset.label}
              onClick={() => handlePresetClick(preset)}
              disabled={creating}
              className="pill compact"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'center' }}
            >
              <span>{preset.icon}</span>
              <span>{preset.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Active Alerts */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h4 className="eyebrow">ACTIVE ALERTS</h4>
        {alerts.length === 0 ? (
          <div className="empty-state" style={{ padding: '1.5rem' }}>
            <div className="empty-state-text">No alerts configured. Use presets or create custom alerts below.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '300px', overflowY: 'auto' }}>
            {alerts.map((alert) => (
              <div
                key={alert.id}
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--detail-border)',
                  borderRadius: '12px',
                  padding: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                  <button
                    onClick={() => handleToggleAlert(alert.id, alert.isActive)}
                    style={{
                      width: '2.5rem',
                      height: '1.5rem',
                      borderRadius: '999px',
                      background: alert.isActive ? 'var(--success-green)' : '#4a5568',
                      transition: 'background 0.2s',
                      border: 'none',
                      cursor: 'pointer',
                      position: 'relative'
                    }}
                  >
                    <div
                      style={{
                        width: '1rem',
                        height: '1rem',
                        background: 'white',
                        borderRadius: '50%',
                        transition: 'transform 0.2s',
                        transform: alert.isActive ? 'translateX(1.25rem)' : 'translateX(0.25rem)',
                        position: 'absolute',
                        top: '0.25rem'
                      }}
                    />
                  </button>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: 'var(--detail-text)', fontSize: '0.85rem', fontWeight: 600 }}>
                      {getAlertTypeLabel(alert.alertType)}
                    </div>
                    <div style={{ color: 'var(--detail-muted)', fontSize: '0.75rem' }}>
                      {formatThreshold(alert.alertType, alert.thresholdValue)}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteAlert(alert.id)}
                  className="pill compact"
                  style={{ borderColor: 'var(--danger-red)', color: 'var(--danger-red)' }}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Custom Alert */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h4 className="eyebrow">CREATE CUSTOM ALERT</h4>
        <form onSubmit={handleCreateCustom} style={{ background: 'rgba(255, 255, 255, 0.02)', borderRadius: '12px', padding: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
            <div className="form-group">
              <label className="form-label">Type</label>
              <select
                value={newAlert.alertType}
                onChange={(e) => setNewAlert({ ...newAlert, alertType: e.target.value })}
                className="form-select"
              >
                <option value="distance">Distance (km)</option>
                <option value="diameter">Diameter (m)</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Threshold</label>
              <input
                type="number"
                value={newAlert.thresholdValue}
                onChange={(e) => setNewAlert({ ...newAlert, thresholdValue: e.target.value })}
                placeholder={newAlert.alertType === 'distance' ? '5000000' : '500'}
                className="form-input"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={creating || !newAlert.thresholdValue}
            className="pill primary"
            style={{ marginTop: '0.75rem', width: '100%' }}
          >
            {creating ? 'Creating...' : 'Create Alert'}
          </button>
        </form>
      </div>

      {/* Triggered Notifications */}
      <div>
        <h4 className="eyebrow">TRIGGERED NOTIFICATIONS</h4>
        {notifications.length === 0 ? (
          <div className="empty-state" style={{ padding: '1.5rem' }}>
            <div className="empty-state-text">No notifications yet</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '300px', overflowY: 'auto' }}>
            {notifications.map((notif) => (
              <div
                key={notif.id}
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 167, 38, 0.2)',
                  borderRadius: '12px',
                  padding: '0.75rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: 'var(--warning-orange)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                      ⚠ {notif.asteroidName}
                    </div>
                    <div style={{ color: 'var(--detail-text)', fontSize: '0.75rem' }}>{notif.message}</div>
                  </div>
                  <div style={{ color: 'var(--detail-muted)', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                    {formatTimeAgo(notif.triggeredAt)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
