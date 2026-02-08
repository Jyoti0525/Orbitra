import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';

export default function ApproachCalendar() {
  const navigate = useNavigate();
  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 7));
  const [calendarData, setCalendarData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(null);

  useEffect(() => {
    fetchCalendarData();
  }, [currentMonth]);

  const fetchCalendarData = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/asteroids/calendar?month=${currentMonth}`);

      if (response.success) {
        setCalendarData(response);
      }
    } catch (error) {
      console.error('Failed to fetch calendar data:', error);
    } finally {
      setLoading(false);
    }
  };

  const changeMonth = (offset) => {
    const [year, month] = currentMonth.split('-').map(Number);
    const newDate = new Date(year, month - 1 + offset, 1);
    setCurrentMonth(newDate.toISOString().slice(0, 7));
  };

  const getDaysInMonth = () => {
    const [year, month] = currentMonth.split('-').map(Number);
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);

    // Get the day of week for the first day (0 = Sunday)
    const startDayOfWeek = firstDay.getDay();

    // Create array of all days in the month
    const days = [];

    // Add empty slots for days before the first of the month
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const dateStr = `${currentMonth}-${String(day).padStart(2, '0')}`;
      const dayData = calendarData?.days?.find(d => d.date === dateStr);

      days.push({
        day,
        date: dateStr,
        data: dayData,
      });
    }

    return days;
  };

  const getDayClass = (dayObj) => {
    if (!dayObj) return '';

    const today = new Date().toISOString().split('T')[0];
    const isToday = dayObj.date === today;
    const hasApproaches = dayObj.data && dayObj.data.total > 0;
    const hasHazardous = dayObj.data && dayObj.data.hazardous > 0;
    const isSelected = selectedDay === dayObj.date;

    let classes = 'relative p-2 min-h-[80px] border border-gray-700 rounded-lg cursor-pointer transition-all duration-200 ';

    if (isSelected) {
      classes += 'bg-nebula-purple/30 ring-2 ring-nebula-purple ';
    } else if (isToday) {
      classes += 'bg-star-blue/20 ring-2 ring-star-blue/50 ';
    } else if (hasApproaches) {
      classes += 'bg-cosmic-black hover:bg-gray-800 ';
    } else {
      classes += 'bg-cosmic-black/30 hover:bg-gray-800/50 ';
    }

    return classes;
  };

  const handleDayClick = (dayObj) => {
    if (!dayObj) return;

    setSelectedDay(dayObj.date);

    // If the day has approaches, navigate to Explore page with that date
    if (dayObj.data && dayObj.data.total > 0) {
      navigate(`/explore?date=${dayObj.date}`);
    }
  };

  const getMonthName = () => {
    const [year, month] = currentMonth.split('-').map(Number);
    return new Date(year, month - 1, 1).toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="bg-cosmic-black/50 border border-nebula-purple/30 rounded-lg p-6">
        <div className="text-white text-center">Loading calendar...</div>
      </div>
    );
  }

  const days = getDaysInMonth();

  return (
    <div className="bg-cosmic-black/50 border border-nebula-purple/30 rounded-lg p-6">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white">📅 Approach Calendar</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => changeMonth(-1)}
              className="px-3 py-1 bg-cosmic-black border border-nebula-purple/30 rounded text-gray-400 hover:text-white hover:border-star-blue transition"
            >
              ← Prev
            </button>
            <span className="text-white font-semibold px-4">{getMonthName()}</span>
            <button
              onClick={() => changeMonth(1)}
              className="px-3 py-1 bg-cosmic-black border border-nebula-purple/30 rounded text-gray-400 hover:text-white hover:border-star-blue transition"
            >
              Next →
            </button>
          </div>
        </div>

        <p className="text-sm text-gray-400">
          {calendarData?.daysWithApproaches || 0} days with asteroid approaches this month
        </p>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-4 text-xs text-gray-400 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-star-blue rounded"></div>
          <span>Today</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-danger-red rounded-full"></div>
          <span>Has hazardous</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-warning-orange rounded-full"></div>
          <span>Close approach</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-success-green rounded-full"></div>
          <span>Normal approach</span>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Day headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="text-center text-sm font-semibold text-gray-400 pb-2">
            {day}
          </div>
        ))}

        {/* Calendar days */}
        {days.map((dayObj, index) => (
          <div
            key={index}
            className={getDayClass(dayObj)}
            onClick={() => handleDayClick(dayObj)}
          >
            {dayObj && (
              <>
                {/* Day number */}
                <div className="text-sm font-semibold text-white mb-1">
                  {dayObj.day}
                </div>

                {/* Approach indicators */}
                {dayObj.data && dayObj.data.total > 0 && (
                  <div className="space-y-1">
                    {/* Count badge */}
                    <div className="text-xs text-center bg-nebula-purple/30 text-nebula-purple rounded px-1 py-0.5">
                      {dayObj.data.total} NEO{dayObj.data.total > 1 ? 's' : ''}
                    </div>

                    {/* Status dots */}
                    <div className="flex items-center justify-center gap-1">
                      {dayObj.data.hazardous > 0 && (
                        <div
                          className="w-2 h-2 bg-danger-red rounded-full"
                          title={`${dayObj.data.hazardous} hazardous`}
                        ></div>
                      )}
                      {dayObj.data.closestKm && dayObj.data.closestKm < 1000000 && (
                        <div
                          className="w-2 h-2 bg-warning-orange rounded-full"
                          title={`Closest: ${(dayObj.data.closestKm / 1000000).toFixed(2)}M km`}
                        ></div>
                      )}
                      {dayObj.data.closestKm && dayObj.data.closestKm >= 1000000 && !dayObj.data.hazardous && (
                        <div
                          className="w-2 h-2 bg-success-green rounded-full"
                          title={`Safe distance: ${(dayObj.data.closestKm / 1000000).toFixed(2)}M km`}
                        ></div>
                      )}
                    </div>

                    {/* Closest distance */}
                    {dayObj.data.closestKm && (
                      <div className="text-xs text-gray-500 text-center">
                        {(dayObj.data.closestKm / 1000000).toFixed(1)}M km
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>

      {/* Selected day detail */}
      {selectedDay && calendarData?.days?.find(d => d.date === selectedDay) && (
        <div className="mt-4 p-4 bg-cosmic-black border border-nebula-purple/50 rounded-lg">
          <h4 className="text-sm font-bold text-white mb-2">
            {selectedDay} - Approaches
          </h4>
          {(() => {
            const dayData = calendarData.days.find(d => d.date === selectedDay);
            return (
              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-gray-400">Total:</span>{' '}
                    <span className="text-white font-semibold">{dayData.total}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Hazardous:</span>{' '}
                    <span className="text-danger-red font-semibold">{dayData.hazardous}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Closest:</span>{' '}
                    <span className="text-star-blue font-semibold">
                      {(dayData.closestKm / 1000000).toFixed(2)}M km
                    </span>
                  </div>
                </div>

                {dayData.asteroids && dayData.asteroids.length > 0 && (
                  <div className="mt-2">
                    <div className="text-xs text-gray-400 mb-1">Top Approaches:</div>
                    <div className="space-y-1">
                      {dayData.asteroids.slice(0, 3).map((asteroid, i) => (
                        <div key={i} className="text-xs flex items-center justify-between bg-gray-800/30 rounded px-2 py-1">
                          <span className={asteroid.isHazardous ? 'text-danger-red' : 'text-white'}>
                            {asteroid.name}
                          </span>
                          <span className="text-gray-500">
                            {(asteroid.missKm / 1000000).toFixed(2)}M km
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={() => navigate(`/explore?date=${selectedDay}`)}
                  className="w-full mt-2 px-4 py-2 bg-star-blue/20 text-star-blue border border-star-blue rounded hover:bg-star-blue hover:text-white transition"
                >
                  View in Explore →
                </button>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
