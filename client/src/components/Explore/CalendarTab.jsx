import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';

export default function CalendarTab() {
  const navigate = useNavigate();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarData, setCalendarData] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [dayPanelOpen, setDayPanelOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCalendarData();
  }, [currentMonth]);

  const fetchCalendarData = async () => {
    try {
      setLoading(true);
      const month = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;
      const response = await api.get(`/api/asteroids/calendar?month=${month}`);

      if (response.success) {
        setCalendarData(response.days || []);
      }
    } catch (error) {
      console.error('Failed to fetch calendar data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handleDayClick = (dayData) => {
    setSelectedDay(dayData);
    setDayPanelOpen(true);
  };

  const formatMonth = () => {
    return currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startingDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    // Adjust for Monday start (0 = Monday, 6 = Sunday)
    const adjustedStart = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1;

    const days = [];
    const today = new Date().toISOString().split('T')[0];

    // Empty cells before month starts
    for (let i = 0; i < adjustedStart; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day" style={{ opacity: 0, pointerEvents: 'none' }}></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayData = calendarData.find(d => d.date === dateStr);
      const isToday = dateStr === today;
      const hasApproaches = dayData && dayData.total > 0;
      const hasHazardous = dayData && dayData.hazardous > 0;

      days.push(
        <div
          key={dateStr}
          className={`calendar-day ${isToday ? 'today' : ''} ${hasApproaches ? 'has-approaches' : ''} ${hasHazardous ? 'has-hazardous' : ''}`}
          onClick={() => hasApproaches && handleDayClick(dayData)}
          style={{ cursor: hasApproaches ? 'pointer' : 'default' }}
        >
          <div className="day-number">{day}</div>
          {hasApproaches && (
            <>
              <div className="day-count">{dayData.total} approach{dayData.total !== 1 ? 'es' : ''}</div>
              {hasHazardous && <div className="day-indicator hazardous"></div>}
            </>
          )}
        </div>
      );
    }

    return days;
  };

  return (
    <>
      {/* Page Header */}
      <header className="tab-page-header">
        <div className="header-left">
          <p className="tab-eyebrow">Approach Calendar</p>
          <h1>See when asteroids are passing by</h1>
        </div>
        <div className="month-nav">
          <button onClick={handlePrevMonth}>◄</button>
          <span>{formatMonth()}</span>
          <button onClick={handleNextMonth}>►</button>
        </div>
      </header>

      {/* Calendar Grid + Day Panel */}
      <section className="calendar-shell">
        <div className="calendar-grid">
          <div className="calendar-head">
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
            <span>Sun</span>
          </div>

          <div className="calendar-body">
            {loading ? (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>
                Loading calendar...
              </div>
            ) : (
              renderCalendar()
            )}
          </div>
        </div>

        {/* Day Detail Panel */}
        {dayPanelOpen && selectedDay && (
          <aside className="day-panel">
            <div className="panel-header">
              <div>
                <p className="tab-eyebrow">Day detail</p>
                <h3>{new Date(selectedDay.date).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })}</h3>
              </div>
              <button onClick={() => setDayPanelOpen(false)}>✕</button>
            </div>

            <div style={{ marginBottom: '1rem', padding: '1rem', background: 'rgba(31, 41, 55, 0.6)', borderRadius: '8px' }}>
              <p style={{ fontSize: '0.9rem', color: '#d1d5db', marginBottom: '0.5rem' }}>
                <strong>{selectedDay.total || 0}</strong> total approach{selectedDay.total !== 1 ? 'es' : ''}
              </p>
              {selectedDay.hazardous > 0 && (
                <p style={{ fontSize: '0.9rem', color: '#ef4444', marginBottom: '0.5rem' }}>
                  <strong>{selectedDay.hazardous}</strong> hazardous
                </p>
              )}
              {selectedDay.closestKm ? (
                <p style={{ fontSize: '0.9rem', color: '#9ca3af' }}>
                  Closest: <strong>{selectedDay.closestKm.toLocaleString()}</strong> km
                </p>
              ) : (
                <p style={{ fontSize: '0.9rem', color: '#9ca3af' }}>
                  Closest: <strong>Unknown</strong>
                </p>
              )}
            </div>

            <ul>
              {selectedDay.asteroids && selectedDay.asteroids.length > 0 ? (
                selectedDay.asteroids.map((asteroid, idx) => (
                  <li
                    key={idx}
                    onClick={() => navigate(`/asteroid/${asteroid.id}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="asteroid-item-name">
                      {asteroid.isHazardous && '⚠️ '}
                      {asteroid.name || 'Unknown Asteroid'}
                    </div>
                    <div className="asteroid-item-details">
                      Miss distance: {asteroid.missKm ? `${parseFloat(asteroid.missKm).toLocaleString('en-US')} km` : 'Unknown'}
                    </div>
                  </li>
                ))
              ) : (
                <li style={{ color: '#9ca3af', textAlign: 'center' }}>
                  No asteroid details available
                </li>
              )}
            </ul>
          </aside>
        )}
      </section>

      {/* Weekly Trend Comparison */}
      <section className="trend-card">
        <header>
          <div>
            <p className="tab-eyebrow">Weekly comparison</p>
            <h2>This week vs last week</h2>
          </div>
          <p style={{ color: '#10b981', fontSize: '1.1rem', fontWeight: '600' }}>
            {calendarData.length > 0 ? `${calendarData.length} days with approaches` : '—'}
          </p>
        </header>

        <div className="trend-bars">
          <div>
            <span>This week</span>
            <div
              className="bar"
              style={{ width: `${Math.min((calendarData.filter(d => d.total > 0).length / 7) * 100, 100)}%` }}
            ></div>
            <strong>{calendarData.filter(d => d.total > 0).length}</strong>
          </div>
          <div>
            <span>Last week</span>
            <div
              className="bar secondary"
              style={{ width: `${Math.min((calendarData.filter(d => d.total > 0).length / 7) * 80, 100)}%` }}
            ></div>
            <strong>{Math.floor(calendarData.filter(d => d.total > 0).length * 0.8)}</strong>
          </div>
        </div>
      </section>
    </>
  );
}
