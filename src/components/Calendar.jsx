import React, { useState, useEffect } from 'react';
import { formatLocationShort } from '../utils/formatLocation';

export default function Calendar({ apiBase, events = [], view = 'month', selectedDate, onDateSelect, user = null }) {
  const [currentDate, setCurrentDate] = useState(selectedDate || new Date());
  const [calendarEvents, setCalendarEvents] = useState(events);

  useEffect(() => {
    setCalendarEvents(events);
  }, [events]);

  useEffect(() => {
    if (selectedDate) {
      setCurrentDate(selectedDate);
    }
  }, [selectedDate]);

  // Calendar navigation
  const goToPrevious = () => {
    const newDate = new Date(currentDate);
    if (view === 'month') {
      newDate.setMonth(currentDate.getMonth() - 1);
    } else if (view === 'week') {
      newDate.setDate(currentDate.getDate() - 7);
    } else if (view === 'day') {
      newDate.setDate(currentDate.getDate() - 1);
    }
    setCurrentDate(newDate);
  };

  const goToNext = () => {
    const newDate = new Date(currentDate);
    if (view === 'month') {
      newDate.setMonth(currentDate.getMonth() + 1);
    } else if (view === 'week') {
      newDate.setDate(currentDate.getDate() + 7);
    } else if (view === 'day') {
      newDate.setDate(currentDate.getDate() + 1);
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Get events for a specific date
  const getEventsForDate = (date) => {
    return calendarEvents.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  // Check if user is registered for an event
  const isUserRegistered = (event) => {
    if (!user || !event.volunteers) return false;
    return event.volunteers.some(volunteer => 
      volunteer.user === user._id || volunteer.user === user.id
    );
  };

  // Check if user has any events on a date
  const hasUserEventsOnDate = (date) => {
    const dayEvents = getEventsForDate(date);
    return dayEvents.some(event => isUserRegistered(event));
  };

  // Truncate event title for calendar display
  const truncateTitle = (title, maxLength = 20) => {
    if (title.length <= maxLength) return title;
    return title.substring(0, maxLength) + '...';
  };

  // Calendar rendering functions
  const renderMonthView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Get first day of the month and number of days
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    // Get previous month's last few days
    const prevMonth = new Date(year, month - 1, 0);
    const daysFromPrevMonth = startingDayOfWeek;
    
    const days = [];
    
    // Previous month's trailing days
    for (let i = daysFromPrevMonth; i > 0; i--) {
      const day = prevMonth.getDate() - i + 1;
      const date = new Date(year, month - 1, day);
      days.push({
        date: date,
        day: day,
        isCurrentMonth: false,
        isToday: false,
        isPrevMonth: true,
        isNextMonth: false,
        isSelected: selectedDate && date.toDateString() === selectedDate.toDateString()
      });
    }
    
    // Current month's days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const isToday = date.toDateString() === new Date().toDateString();
      const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
      
      days.push({
        date: date,
        day: day,
        isCurrentMonth: true,
        isToday: isToday,
        isPrevMonth: false,
        isNextMonth: false,
        isSelected: isSelected
      });
    }
    
    // Next month's leading days
    const totalCells = 42; // 6 weeks × 7 days
    const remainingCells = totalCells - days.length;
    for (let day = 1; day <= remainingCells; day++) {
      const date = new Date(year, month + 1, day);
      days.push({
        date: date,
        day: day,
        isCurrentMonth: false,
        isToday: false,
        isPrevMonth: false,
        isNextMonth: true,
        isSelected: selectedDate && date.toDateString() === selectedDate.toDateString()
      });
    }

    return (
      <div className="modern-calendar-grid">
        {/* Day headers with better styling */}
        {[
          { short: 'Sun', full: 'Sunday' },
          { short: 'Mon', full: 'Monday' },
          { short: 'Tue', full: 'Tuesday' },
          { short: 'Wed', full: 'Wednesday' },
          { short: 'Thu', full: 'Thursday' },
          { short: 'Fri', full: 'Friday' },
          { short: 'Sat', full: 'Saturday' }
        ].map((day, index) => (
          <div key={day.short} className={`modern-day-header ${index === 0 || index === 6 ? 'weekend-header' : ''}`}>
            <span className="day-short">{day.short}</span>
            <span className="day-full">{day.full}</span>
          </div>
        ))}
        
        {/* Calendar days with enhanced styling */}
        {days.map((dayObj, index) => {
          const dayEvents = getEventsForDate(dayObj.date);
          const hasEvents = dayEvents.length > 0;
          const hasUserEvents = hasUserEventsOnDate(dayObj.date);
          const isWeekend = dayObj.date.getDay() === 0 || dayObj.date.getDay() === 6;
          
          return (
            <div
              key={index}
              className={`
                modern-calendar-day 
                ${!dayObj.isCurrentMonth ? 'other-month' : 'current-month'}
                ${dayObj.isPrevMonth ? 'prev-month' : ''}
                ${dayObj.isNextMonth ? 'next-month' : ''}
                ${dayObj.isToday ? 'today-cell' : ''}
                ${dayObj.isSelected ? 'selected-cell' : ''}
                ${hasEvents ? 'has-events-cell' : ''}
                ${hasUserEvents ? 'has-user-events' : ''}
                ${isWeekend ? 'weekend-cell' : 'weekday-cell'}
              `}
              onClick={() => onDateSelect && onDateSelect(dayObj.date)}
            >
              <div className="day-number-container">
                <span className="day-number">{dayObj.day}</span>
                {dayObj.isToday && <div className="today-indicator"></div>}
                {hasUserEvents && <div className="user-event-indicator"></div>}
              </div>
              
              {hasEvents && (
                <div className="event-indicators-container">
                  {dayEvents.slice(0, 2).map((event, eventIndex) => {
                    const userRegistered = isUserRegistered(event);
                    
                    return (
                      <div 
                        key={eventIndex} 
                        className={`event-dot ${userRegistered ? 'user-registered-event' : 'other-event'}`}
                        title={`${event.title} - ${formatLocationShort(event.location)}`}
                      >
                        <span className="event-preview-text">{truncateTitle(event.title, 12)}</span>
                      </div>
                    );
                  })}
                  {dayEvents.length > 2 && (
                    <div className="more-events-indicator">
                      +{dayEvents.length - 2}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderWeekView = () => {
    // Get the start of the week (Sunday)
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    startOfWeek.setDate(currentDate.getDate() - day);
    
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      weekDays.push(date);
    }

    return (
      <div className="week-view">
        <div className="week-header">
          {weekDays.map((date, index) => (
            <div key={index} className="week-day-header">
              <div className="day-name">
                {date.toLocaleDateString('en', { weekday: 'short' })}
              </div>
              <div className={`day-number ${date.toDateString() === new Date().toDateString() ? 'today' : ''}`}>
                {date.getDate()}
              </div>
            </div>
          ))}
        </div>
        
        <div className="week-content">
          {weekDays.map((date, index) => {
            const dayEvents = getEventsForDate(date);
            
            return (
              <div
                key={index}
                className={`week-day ${selectedDate && date.toDateString() === selectedDate.toDateString() ? 'selected' : ''}`}
                onClick={() => onDateSelect && onDateSelect(date)}
              >
                {dayEvents.map((event, eventIndex) => (
                  <div key={eventIndex} className="week-event">
                    <div className="event-time">
                      {new Date(event.date).toLocaleTimeString('en', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                    <div className="event-title">{event.title}</div>
                    <div className="event-location">{formatLocationShort(event.location)}</div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    const dayEvents = getEventsForDate(currentDate);
    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
      <div className="day-view">
        <div className="day-header">
          <h3>
            {currentDate.toLocaleDateString('en', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </h3>
        </div>
        
        <div className="day-content">
          {hours.map(hour => {
            const hourEvents = dayEvents.filter(event => {
              const eventHour = new Date(event.date).getHours();
              return eventHour === hour;
            });
            
            return (
              <div key={hour} className="hour-slot">
                <div className="hour-label">
                  {hour === 0 ? '12 AM' : hour <= 12 ? `${hour} AM` : `${hour - 12} PM`}
                </div>
                <div className="hour-events">
                  {hourEvents.map((event, index) => (
                    <div key={index} className="day-event">
                      <div className="event-title">{event.title}</div>
                      <div className="event-location">{formatLocationShort(event.location)}</div>
                      <div className="event-description">{event.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const getViewTitle = () => {
    if (view === 'month') {
      const monthName = currentDate.toLocaleDateString('en', { month: 'long' });
      const year = currentDate.getFullYear();
      return { month: monthName, year: year, type: 'month' };
    } else if (view === 'week') {
      const startOfWeek = new Date(currentDate);
      const day = startOfWeek.getDay();
      startOfWeek.setDate(currentDate.getDate() - day);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      
      return { 
        month: `${startOfWeek.toLocaleDateString('en', { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString('en', { month: 'short', day: 'numeric' })}`, 
        year: endOfWeek.getFullYear(), 
        type: 'week' 
      };
    } else {
      const monthName = currentDate.toLocaleDateString('en', { month: 'long' });
      const day = currentDate.getDate();
      const year = currentDate.getFullYear();
      const weekday = currentDate.toLocaleDateString('en', { weekday: 'long' });
      return { month: monthName, year: year, day: day, weekday: weekday, type: 'day' };
    }
  };

  return (
    <div className="modern-calendar-container">
      {/* Enhanced Calendar Header */}
      <div className="modern-calendar-header">
        <div className="calendar-navigation">
          <button className="modern-nav-button prev" onClick={goToPrevious}>
            <span className="nav-icon">←</span>
            <span className="nav-text">Previous</span>
          </button>
          <button className="modern-nav-button today" onClick={goToToday}>
            <span className="nav-icon">●</span>
            <span className="nav-text">Today</span>
          </button>
          <button className="modern-nav-button next" onClick={goToNext}>
            <span className="nav-text">Next</span>
            <span className="nav-icon">→</span>
          </button>
        </div>
        
        <div className="modern-date-display">
          {(() => {
            const titleInfo = getViewTitle();
            if (titleInfo.type === 'day') {
              return (
                <>
                  <span className="weekday-display">{titleInfo.weekday}</span>
                  <span className="month-display">{titleInfo.month}</span>
                  <span className="day-display">{titleInfo.day}</span>
                  <span className="year-display">{titleInfo.year}</span>
                </>
              );
            } else {
              return (
                <>
                  <span className="month-display">{titleInfo.month}</span>
                  <span className="year-display">{titleInfo.year}</span>
                </>
              );
            }
          })()}
        </div>
        
        <div className="calendar-info-section">
          <div className="event-count-badge">
            <span className="count-number">{calendarEvents.length}</span>
            <span className="count-label">events</span>
          </div>
          <div className="view-indicator">
            <span className="current-view">{view}</span>
            <span className="view-label">view</span>
          </div>
        </div>
      </div>

      {/* Calendar View */}
      <div className="modern-calendar-view">
        {view === 'month' && renderMonthView()}
        {view === 'week' && renderWeekView()}
        {view === 'day' && renderDayView()}
      </div>
    </div>
  );
}
