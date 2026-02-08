import { useState, useEffect } from 'react';
import { api } from '../../services/api';

export default function ActivityLog() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchActivities();
  }, [page]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/activity?limit=20&page=${page}`);
      if (response.success) {
        setActivities(response.activities || []);
        setTotal(response.total || 0);
        setHasMore(response.hasMore || false);
      }
    } catch (error) {
      console.error('Failed to fetch activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type) => {
    const icons = {
      watch: '⭐',
      unwatch: '✖️',
      create_alert: '🔔',
      delete_alert: '🗑️',
      view_asteroid: '👁️',
      alert_triggered: '⚠️',
      impact_simulation: '💥',
    };
    return icons[type] || '📝';
  };

  const getActivityColorStyle = (type) => {
    if (type === 'watch') return { color: 'var(--accent2)' };
    if (type === 'unwatch') return { color: 'var(--detail-muted)' };
    if (type === 'create_alert') return { color: 'var(--success-green)' };
    if (type === 'delete_alert') return { color: 'var(--danger-red)' };
    if (type === 'alert_triggered') return { color: 'var(--warning-orange)' };
    return { color: 'var(--detail-text)' };
  };

  const formatActivityDescription = (activity) => {
    const { activityType, asteroidName, details } = activity;

    switch (activityType) {
      case 'watch':
        return `Watched asteroid ${asteroidName} (Risk: ${details?.riskLevel || 'Unknown'} ${details?.riskScore || ''})`;
      case 'unwatch':
        return `Removed ${asteroidName} from watchlist`;
      case 'create_alert':
        const condition = details?.condition || '';
        const value = details?.value || '';
        return `Created alert: ${details?.alertType} ${condition} ${value}`;
      case 'delete_alert':
        return `Deleted alert: ${details?.alertType}`;
      case 'view_asteroid':
        return `Viewed asteroid ${asteroidName}`;
      case 'alert_triggered':
        return `Alert triggered: ${asteroidName} ${details?.reason || ''}`;
      case 'impact_simulation':
        return `Viewed impact simulation for ${asteroidName}`;
      default:
        return `Activity: ${activityType}`;
    }
  };

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp?.seconds
      ? new Date(timestamp.seconds * 1000)
      : new Date(timestamp);
    const seconds = Math.floor((new Date() - date) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const groupActivitiesByDate = (activities) => {
    const groups = {};
    activities.forEach(activity => {
      const date = activity.createdAt?.seconds
        ? new Date(activity.createdAt.seconds * 1000)
        : new Date(activity.createdAt);
      const dateKey = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(activity);
    });
    return groups;
  };

  if (loading && page === 1) {
    return (
      <div className="card">
        <h3 className="card-title">Activity Log</h3>
        <div className="loading-container">
          <div className="loading-text">Loading activities...</div>
        </div>
      </div>
    );
  }

  const groupedActivities = groupActivitiesByDate(activities);

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Activity Log</h3>
        <span style={{ fontSize: '0.85rem', color: 'var(--detail-muted)' }}>
          {total} {total === 1 ? 'activity' : 'activities'}
        </span>
      </div>

      {activities.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📝</div>
          <p className="empty-state-text">No activity yet</p>
          <p style={{ fontSize: '0.85rem', color: 'var(--detail-muted)', marginTop: '0.5rem' }}>
            Start watching asteroids and creating alerts to see your activity here
          </p>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxHeight: '400px', overflowY: 'auto' }}>
            {Object.entries(groupedActivities).map(([date, dayActivities]) => (
              <div key={date}>
                <h4 className="eyebrow" style={{ position: 'sticky', top: 0, background: 'rgba(4, 5, 16, 0.9)', padding: '0.5rem 0' }}>
                  {date}
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {dayActivities.map((activity) => {
                    const icon = getActivityIcon(activity.activityType);
                    const colorStyle = getActivityColorStyle(activity.activityType);

                    return (
                      <div
                        key={activity.id}
                        className="timeline-item"
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                          <div style={{ fontSize: '1.5rem', flexShrink: 0 }}>{icon}</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.25rem', ...colorStyle }}>
                              {formatActivityDescription(activity)}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--detail-muted)' }}>
                              {formatTimeAgo(activity.createdAt)}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {(page > 1 || hasMore) && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--detail-border)' }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="pill compact"
              >
                Previous
              </button>
              <span style={{ fontSize: '0.85rem', color: 'var(--detail-muted)' }}>
                Page {page}
              </span>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={!hasMore}
                className="pill compact"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
