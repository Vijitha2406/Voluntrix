import React, { useEffect, useState } from 'react';

export default function Calendar({ apiBase }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${apiBase}/api/events`);
        const data = await res.json();
        if (mounted) setEvents(data || []);
      } catch (err) {
        console.error('calendar fetch', err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
    return () => { mounted = false };
  }, [apiBase]);

  // group events by date (yyyy-mm-dd)
  const grouped = events.reduce((acc, e) => {
    const d = e.date ? new Date(e.date).toISOString().slice(0,10) : 'unscheduled';
    acc[d] = acc[d] || [];
    acc[d].push(e);
    return acc;
  }, {});

  const days = Object.keys(grouped).sort();

  return (
    <div className="calendar">
      <h3>Event Calendar</h3>
      {loading ? <p>Loading events…</p> : (
        <div>
          {days.length === 0 ? <p>No events scheduled</p> : days.map(day => (
            <div key={day} className="calendar-day">
              <h4>{day === 'unscheduled' ? 'Unscheduled' : new Date(day).toDateString()}</h4>
              <ul>
                {grouped[day].map(ev => (
                  <li key={ev.id || ev._id}><strong>{ev.title}</strong> — {ev.location || 'TBD'} @ {ev.date ? new Date(ev.date).toLocaleTimeString() : 'TBD'}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
