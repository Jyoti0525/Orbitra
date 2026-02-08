import { useState, useEffect } from 'react';
import { api, alertsApi, notificationsApi } from '../services/api';

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newAlert, setNewAlert] = useState({
    alertType: 'distance',
    thresholdValue: '',
  });

  const presets = [
    { label: 'All Hazardous', alertType: 'hazardous', thresholdValue: true, icon: '⚠️', description: 'Notify on any potentially hazardous asteroid' },
    { label: 'Under 1M km', alertType: 'distance', thresholdValue: 1000000, icon: '📏', description: 'Notify when approach is closer than 1 million km' },
    { label: 'Over 500m Size', alertType: 'diameter', thresholdValue: 500, icon: '📐', description: 'Notify when asteroid diameter exceeds 500 meters' },
    { label: 'Sentry Objects', alertType: 'sentry', thresholdValue: true, icon: '🎯', description: 'Notify on asteroids in the Sentry monitoring list' },
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [alertsRes, notificationsRes] = await Promise.all([
        alertsApi.getAll(),
        notificationsApi.getAll(),
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
      const response = await alertsApi.create({
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
      const response = await alertsApi.create({
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
      const response = await alertsApi.toggle(alertId, !currentStatus);

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
      const response = await alertsApi.delete(alertId);
      if (response.success) {
        setAlerts(prev => prev.filter(a => a.id !== alertId));
      }
    } catch (error) {
      console.error('Failed to delete alert:', error);
    }
  };

  const getAlertTypeLabel = (type) => {
    const labels = {
      distance: 'Close Approach Distance',
      diameter: 'Diameter Size',
      hazardous: 'Hazardous Flag',
      sentry: 'Sentry Object',
    };
    return labels[type] || type;
  };

  const formatThreshold = (type, value) => {
    if (type === 'distance') return `< ${(value / 1000000).toFixed(1)}M km`;
    if (type === 'diameter') return `> ${value}m`;
    if (type === 'hazardous' || type === 'sentry') return 'Enabled';
    return value;
  };

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp.seconds * 1000);
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-xl text-white animate-pulse">Loading alerts...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Alert Configurator</h1>
        <p className="text-gray-400">Set up rules to get notified when interesting asteroids approach Earth.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Create & Active */}
        <div className="lg:col-span-2 space-y-8">

          {/* Presets */}
          <section>
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Quick Presets</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {presets.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => handlePresetClick(preset)}
                  disabled={creating}
                  className="flex items-start gap-4 p-4 bg-cosmic-black/40 border border-gray-800 rounded-xl hover:border-star-blue/50 hover:bg-cosmic-black/60 transition text-left group"
                >
                  <div className="text-2xl bg-gray-800 rounded-lg w-12 h-12 flex items-center justify-center group-hover:bg-star-blue/20 transition-colors">
                    {preset.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-white group-hover:text-star-blue transition-colors">{preset.label}</h3>
                    <p className="text-xs text-gray-400 mt-1">{preset.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* Create Custom */}
          <section className="bg-cosmic-black/40 border border-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-bold text-white mb-4">Create Custom Rule</h2>
            <form onSubmit={handleCreateCustom} className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-1 w-full">
                <label className="block text-xs text-gray-500 uppercase mb-2">Alert Type</label>
                <select
                  value={newAlert.alertType}
                  onChange={(e) => setNewAlert({ ...newAlert, alertType: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:border-star-blue focus:outline-none"
                >
                  <option value="distance">Close Approach Distance</option>
                  <option value="diameter">Asteroid Diameter</option>
                </select>
              </div>
              <div className="flex-1 w-full">
                <label className="block text-xs text-gray-500 uppercase mb-2">
                  Threshold {newAlert.alertType === 'distance' ? '(in meters)' : '(in meters)'}
                </label>
                <input
                  type="number"
                  value={newAlert.thresholdValue}
                  onChange={(e) => setNewAlert({ ...newAlert, thresholdValue: e.target.value })}
                  placeholder={newAlert.alertType === 'distance' ? 'e.g. 5000000 (5M km)' : 'e.g. 500'}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:border-star-blue focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={creating || !newAlert.thresholdValue}
                className="w-full sm:w-auto px-6 py-2.5 bg-star-blue text-white rounded-lg hover:bg-star-blue/80 transition disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {creating ? 'Creating...' : '+ Create Rule'}
              </button>
            </form>
          </section>

          {/* Active List */}
          <section>
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Active Rules</h2>
            {alerts.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-gray-800 rounded-xl">
                <div className="text-4xl mb-3">🔕</div>
                <p className="text-gray-400">No active alert rules configured.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-center justify-between p-4 bg-cosmic-black/40 border border-gray-800 rounded-xl hover:border-gray-700 transition"
                  >
                    <div className="flex items-center gap-4">
                      {/* Toggle Switch */}
                      <button
                        onClick={() => handleToggleAlert(alert.id, alert.isActive)}
                        className={`relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none ${alert.isActive ? 'bg-star-blue' : 'bg-gray-700'
                          }`}
                      >
                        <span
                          className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${alert.isActive ? 'translate-x-6' : 'translate-x-0'
                            }`}
                        />
                      </button>

                      <div>
                        <div className="font-bold text-white">{getAlertTypeLabel(alert.alertType)}</div>
                        <div className="text-sm text-gray-400">
                          Threshold: <span className="text-star-blue">{formatThreshold(alert.alertType, alert.thresholdValue)}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteAlert(alert.id)}
                      className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                      title="Delete Rule"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right Column: Notifications Feed */}
        <div className="space-y-6">
          <section className="bg-cosmic-black/60 border border-gray-800 rounded-xl p-6 h-full sticky top-6">
            <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <span>🔔</span> Recent Notifications
            </h2>

            {notifications.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-gray-500">No notifications yet.</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-4 rounded-lg border ${notif.isRead
                        ? 'bg-transparent border-gray-800 opacity-60'
                        : 'bg-gradient-to-r from-orange-500/10 to-transparent border-orange-500/30'
                      }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-xs font-bold text-orange-400 uppercase tracking-wider">Alert Triggered</span>
                      <span className="text-[10px] text-gray-500">{formatTimeAgo(notif.triggeredAt)}</span>
                    </div>
                    <div className="font-bold text-white mb-1">{notif.asteroidName}</div>
                    <p className="text-sm text-gray-400 leading-relaxed">{notif.message}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
