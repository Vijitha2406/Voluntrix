import React, { useState, useEffect } from 'react';
import Calendar from '../components/Calendar';
import { formatLocationShort } from '../utils/formatLocation';

export default function CalendarPage() {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("voluntrix_user")) || null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem("voluntrix_token") || null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [calendarView, setCalendarView] = useState('month'); // month, week, day
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [filterType, setFilterType] = useState('all'); // all, joined, created
  const [searchTerm, setSearchTerm] = useState('');

  const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';

  useEffect(() => {
    fetchEvents();
  }, [token, filterType]);

  const fetchEvents = async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      let endpoint = '/api/events';
      
      if (filterType === 'joined' || filterType === 'created') {
        endpoint = '/api/events/me';
      }

      const res = await fetch(`${API_BASE}${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        let eventList = [];

        if (filterType === 'joined') {
          eventList = data.joined || [];
        } else if (filterType === 'created') {
          eventList = data.created || [];
        } else if (filterType === 'all') {
          if (Array.isArray(data)) {
            eventList = data;
          } else {
            eventList = [...(data.joined || []), ...(data.created || [])];
          }
        }

        // Filter by search term if provided
        if (searchTerm) {
          eventList = eventList.filter(event =>
            event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            event.description.toLowerCase().includes(searchTerm.toLowerCase())
          );
        }

        setEvents(eventList);
      }
    } catch (err) {
      console.error('Failed to fetch events:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
  };

  const getEventsForSelectedDate = () => {
    return events.filter(event => {
      const eventDate = new Date(event.date);
      return (
        eventDate.toDateString() === selectedDate.toDateString()
      );
    });
  };

  const getTotalEventsCount = () => {
    return events.length;
  };

  const getUpcomingEventsCount = () => {
    const now = new Date();
    return events.filter(event => new Date(event.date) > now).length;
  };

  const getPastEventsCount = () => {
    const now = new Date();
    return events.filter(event => new Date(event.date) <= now).length;
  };

  return (
    <div className="calendar-page">
      {/* Calendar Header */}
      <div className="calendar-page-header">
        <div className="header-content">
          <h1>Calendar</h1>
          <p>Manage your volunteer events and schedule</p>
        </div>
        
        {/* Calendar Stats */}
        <div className="calendar-stats">
          <div className="stat-card">
            <div className="stat-icon">📅</div>
            <div className="stat-content">
              <h3>{getTotalEventsCount()}</h3>
              <p>Total Events</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">⏰</div>
            <div className="stat-content">
              <h3>{getUpcomingEventsCount()}</h3>
              <p>Upcoming</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <h3>{getPastEventsCount()}</h3>
              <p>Completed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Controls */}
      <div className="calendar-controls">
        <div className="calendar-filters">
          {/* View Toggle */}
          <div className="view-toggle">
            <button 
              className={`toggle-btn ${calendarView === 'month' ? 'active' : ''}`}
              onClick={() => setCalendarView('month')}
            >
              Month
            </button>
            <button 
              className={`toggle-btn ${calendarView === 'week' ? 'active' : ''}`}
              onClick={() => setCalendarView('week')}
            >
              Week
            </button>
            <button 
              className={`toggle-btn ${calendarView === 'day' ? 'active' : ''}`}
              onClick={() => setCalendarView('day')}
            >
              Day
            </button>
          </div>

          {/* Event Type Filter */}
          <div className="event-filter">
            <select 
              value={filterType} 
              onChange={(e) => setFilterType(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Events</option>
              <option value="joined">Events I Joined</option>
              <option value="created">Events I Created</option>
            </select>
          </div>

          {/* Search */}
          <div className="search-box">
            <input
              type="text"
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <span className="search-icon">🔍</span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions">
          <button className="action-btn primary">
            <span>+</span>
            Create Event
          </button>
          <button className="action-btn secondary">
            <span>📤</span>
            Export Calendar
          </button>
        </div>
      </div>

      {/* Main Calendar Content */}
      <div className="calendar-content">
        {/* Calendar Grid */}
        <div className="calendar-main">
          {loading ? (
            <div className="calendar-loading">
              <div className="loading-spinner"></div>
              <p>Loading calendar...</p>
            </div>
          ) : (
            <Calendar 
              apiBase={API_BASE}
              events={events}
              view={calendarView}
              selectedDate={selectedDate}
              onDateSelect={handleDateSelect}
              user={user}
            />
          )}
        </div>

        {/* Sidebar */}
        <div className="calendar-sidebar">
          {/* Selected Date Info */}
          <div className="selected-date-panel">
            <h3>
              {selectedDate.toLocaleDateString('en', { 
                weekday: 'long',
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </h3>
            
            {getEventsForSelectedDate().length > 0 ? (
              <div className="date-events">
                <h4>Events on this day:</h4>
                <div className="event-list">
                  {getEventsForSelectedDate().map((event) => (
                    <div key={event._id} className="sidebar-event-item">
                      <div className="event-time">
                        {new Date(event.date).toLocaleTimeString('en', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                      <div className="event-details">
                        <h5>{event.title}</h5>
                        <p>{formatLocationShort(event.location)}</p>
                        <span className={`event-badge ${event.createdBy === user?._id ? 'created' : 'joined'}`}>
                          {event.createdBy === user?._id ? 'Created' : 'Joined'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="no-events">
                <p>No events scheduled for this day</p>
                <button className="create-event-btn">
                  + Schedule Event
                </button>
              </div>
            )}
          </div>

          {/* Upcoming Events Preview */}
          <div className="upcoming-events-panel">
            <h3>Next 7 Days</h3>
            <div className="upcoming-list">
              {events
                .filter(event => {
                  const eventDate = new Date(event.date);
                  const today = new Date();
                  const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
                  return eventDate >= today && eventDate <= nextWeek;
                })
                .sort((a, b) => new Date(a.date) - new Date(b.date))
                .slice(0, 5)
                .map((event) => (
                  <div key={event._id} className="upcoming-event-item">
                    <div className="event-date">
                      <span className="date-num">
                        {new Date(event.date).getDate()}
                      </span>
                      <span className="date-month">
                        {new Date(event.date).toLocaleDateString('en', { month: 'short' })}
                      </span>
                    </div>
                    <div className="event-info">
                      <h5>{event.title}</h5>
                      <p>{formatLocationShort(event.location)}</p>
                    </div>
                  </div>
                ))}
              
              {events.filter(event => {
                const eventDate = new Date(event.date);
                const today = new Date();
                const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
                return eventDate >= today && eventDate <= nextWeek;
              }).length === 0 && (
                <p className="no-upcoming">No upcoming events in the next 7 days</p>
              )}
            </div>
          </div>

          {/* Calendar Legend */}
          <div className="calendar-legend">
            <h4>Legend</h4>
            <div className="legend-items">
              <div className="legend-item">
                <span className="legend-dot created"></span>
                <span>Events I Created</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot joined"></span>
                <span>Events I Joined</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot today"></span>
                <span>Today</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
