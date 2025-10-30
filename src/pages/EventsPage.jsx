import React from 'react';
import Events from '../components/Events';

export default function EventsPage({ showToast }) {
  return (
    <div className="page">
      <h2>Events</h2>
      <Events showToast={showToast} />
    </div>
  );
}
