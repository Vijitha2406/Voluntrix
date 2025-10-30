import React from 'react';
import Calendar from '../components/Calendar';

export default function CalendarPage() {
  const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';

  return (
    <div className="page">
      <h2>Calendar</h2>
      <Calendar apiBase={API_BASE} />
    </div>
  );
}
