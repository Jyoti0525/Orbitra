import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';

export default function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [theme, setTheme] = useState('dark');
  const [alertDelivery, setAlertDelivery] = useState('dashboard');

  useEffect(() => {
    fetchProfile();
    fetchHistory();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/user/profile');

      if (response.success && response.profile) {
        setProfile(response.profile);
        // Use user.displayName if profile is fallback, otherwise use profile.displayName
        const effectiveName = response.profile.isFallback && user?.displayName
          ? user.displayName
          : (response.profile.displayName || '');
        setDisplayName(effectiveName);
        setTheme(response.profile.preferences?.theme || 'dark');
        setAlertDelivery(response.profile.preferences?.alertDelivery || 'dashboard');
      } else {
        console.error('Profile fetch failed:', response);
        // Fallback or show specific error
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      // Don't leave the user in infinite loading if it fails
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await api.get('/api/user/history?limit=50');

      if (response.success) {
        setHistory(response.history);
      }
    } catch (error) {
      console.error('Failed to fetch history:', error);
    }
  };

  const handleSave = async () => {
    try {
      setUpdating(true);

      const response = await api.put('/api/user/profile', {
        displayName,
        preferences: {
          theme,
          alertDelivery,
        },
      });

      if (response.success) {
        setProfile(response.profile);
        alert('Profile updated successfully!');
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('Failed to update profile');
    } finally {
      setUpdating(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return parts[0][0] + parts[1][0];
    }
    return name.slice(0, 2);
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatHistoryEntry = (entry) => {
    switch (entry.type) {
      case 'watch':
        return `Watched ${entry.asteroidName} — ${entry.riskScore >= 70 ? 'CRITICAL' : entry.riskScore >= 40 ? 'HIGH' : entry.riskScore >= 20 ? 'MEDIUM' : 'LOW'} risk`;
      case 'alert_created':
        return `Set alert: ${entry.alertType} (threshold: ${entry.threshold})`;
      case 'alert_triggered':
        return `Alert triggered: ${entry.asteroidName} — ${entry.message}`;
      default:
        return 'Unknown activity';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white text-xl">Loading profile...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500 text-xl">Failed to load profile</div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-cosmic-black/50 border border-nebula-purple/30 rounded-lg p-6">
        <div className="flex items-start gap-6">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {profile.isFallback && user?.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName}
                className="w-24 h-24 rounded-full border-2 border-nebula-purple object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <div
              className="w-24 h-24 rounded-full bg-nebula-purple/30 border-2 border-nebula-purple flex items-center justify-center text-3xl font-bold text-white"
              style={{ display: (profile.isFallback && user?.photoURL) ? 'none' : 'flex' }}
            >
              {getInitials(profile.isFallback && user?.displayName ? user.displayName : profile.displayName)}
            </div>
          </div>

          {/* User Info */}
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white mb-2">
              {profile.isFallback && user?.displayName ? user.displayName : profile.displayName}
            </h1>
            <p className="text-gray-400 mb-1">
              {profile.isFallback && user?.email ? user.email : profile.email}
            </p>
            <p className="text-sm text-gray-500">
              Joined: {new Date(profile.createdAt).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Activity Stats */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4">YOUR ACTIVITY</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-cosmic-black/50 border border-star-blue/30 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="text-3xl">⭐</div>
              <div>
                <div className="text-gray-400 text-sm">Watching</div>
                <div className="text-white font-bold text-xl">{profile.stats.watching} asteroids</div>
              </div>
            </div>
          </div>

          <div className="bg-cosmic-black/50 border border-nebula-purple/30 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="text-3xl">🔔</div>
              <div>
                <div className="text-gray-400 text-sm">Active Alerts</div>
                <div className="text-white font-bold text-xl">{profile.stats.activeAlerts} rules</div>
              </div>
            </div>
          </div>

          <div className="bg-cosmic-black/50 border border-warning-orange/30 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="text-3xl">⚠️</div>
              <div>
                <div className="text-gray-400 text-sm">Notifications Received</div>
                <div className="text-white font-bold text-xl">{profile.stats.notificationsReceived} notifications</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Watch History */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4">WATCH HISTORY</h2>
        <div className="bg-cosmic-black/50 border border-nebula-purple/30 rounded-lg p-4">
          {history.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              <div className="text-4xl mb-2">📋</div>
              <p>No activity history yet</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {history.map((entry, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 bg-cosmic-black rounded-lg border border-gray-700 hover:border-star-blue/50 transition"
                >
                  <div className="text-xs text-gray-500 whitespace-nowrap">
                    {formatTimestamp(entry.timestamp)}
                  </div>
                  <div className="flex-1 text-sm text-gray-300">
                    {formatHistoryEntry(entry)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Settings */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4">SETTINGS</h2>
        <div className="bg-cosmic-black/50 border border-nebula-purple/30 rounded-lg p-6 space-y-4">
          {/* Display Name */}
          <div className="flex items-center gap-4">
            <label className="text-gray-400 w-32">Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="flex-1 bg-cosmic-black border border-gray-700 rounded px-4 py-2 text-white focus:border-star-blue focus:outline-none"
              placeholder="Enter your display name"
            />
          </div>

          {/* Email (read-only) */}
          <div className="flex items-center gap-4">
            <label className="text-gray-400 w-32">Email</label>
            <input
              type="email"
              value={profile.isFallback && user?.email ? user.email : profile.email}
              readOnly
              className="flex-1 bg-gray-800/50 border border-gray-700 rounded px-4 py-2 text-gray-500 cursor-not-allowed"
            />
          </div>

          {/* Alert Delivery */}
          <div className="flex items-center gap-4">
            <label className="text-gray-400 w-32">Alert Delivery</label>
            <div className="flex-1 flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="alertDelivery"
                  value="dashboard"
                  checked={alertDelivery === 'dashboard'}
                  onChange={(e) => setAlertDelivery(e.target.value)}
                  className="text-star-blue focus:ring-star-blue"
                />
                <span className="text-white">Dashboard only</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="alertDelivery"
                  value="email"
                  checked={alertDelivery === 'email'}
                  onChange={(e) => setAlertDelivery(e.target.value)}
                  className="text-star-blue focus:ring-star-blue"
                />
                <span className="text-white">Email too</span>
              </label>
            </div>
          </div>

          {/* Theme */}
          <div className="flex items-center gap-4">
            <label className="text-gray-400 w-32">Theme</label>
            <div className="flex-1 flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="theme"
                  value="dark"
                  checked={theme === 'dark'}
                  onChange={(e) => setTheme(e.target.value)}
                  className="text-star-blue focus:ring-star-blue"
                />
                <span className="text-white">Dark</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="theme"
                  value="oled"
                  checked={theme === 'oled'}
                  onChange={(e) => setTheme(e.target.value)}
                  className="text-star-blue focus:ring-star-blue"
                />
                <span className="text-white">OLED</span>
              </label>
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-4">
            <button
              onClick={handleSave}
              disabled={updating}
              className="px-6 py-2 bg-star-blue text-white rounded hover:bg-star-blue/80 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updating ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
