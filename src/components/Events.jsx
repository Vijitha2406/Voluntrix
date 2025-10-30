import React, { useEffect, useState } from 'react';

export default function Events({ showToast }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState({}); // per-event loading state
  const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';

  const user = (() => {
    try { return JSON.parse(localStorage.getItem('voluntrix_user')) || null; } catch { return null; }
  })();
  const token = typeof window !== 'undefined' ? localStorage.getItem('voluntrix_token') : null;

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/events`);
      const data = await res.json();
      setEvents(data || []);
    } catch (err) {
      console.error(err);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchEvents(); }, []);

  const handleJoin = async (id) => {
    const toast = showToast || ((m,t)=> alert(m));
    if (!token) return toast('Please login to join an event', 'error');
    if (!confirm('Join this event?')) return;
    try {
      setBusy(prev => ({ ...prev, [id]: true }));
      const res = await fetch(`${API_BASE}/api/events/${id}/join`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) return toast(data?.message || 'Failed to join', 'error');
      toast('Joined event', 'success');
      await fetchEvents();
    } catch (err) {
      console.error(err);
      toast('Network error', 'error');
    } finally { setBusy(prev => ({ ...prev, [id]: false })); }
    };

  const handleLeave = async (id) => {
    const toast = showToast || ((m,t)=> alert(m));
    if (!token) return toast('Please login', 'error');
    if (!confirm('Leave this event?')) return;
    try {
      setBusy(prev => ({ ...prev, [id]: true }));
      const res = await fetch(`${API_BASE}/api/events/${id}/leave`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) return toast(data?.message || 'Failed to leave', 'error');
      toast('Left event', 'success');
      await fetchEvents();
    } catch (err) {
      console.error(err);
      toast('Network error', 'error');
    } finally { setBusy(prev => ({ ...prev, [id]: false })); }
  };

  const handleCancel = async (id) => {
    const toast = showToast || ((m,t)=> alert(m));
    if (!token) return toast('Please login', 'error');
    if (!confirm('Cancel this event? This cannot be undone.')) return;
    try {
      setBusy(prev => ({ ...prev, [id]: true }));
      const res = await fetch(`${API_BASE}/api/events/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) return toast(data?.message || 'Failed to cancel', 'error');
      toast('Event cancelled', 'success');
      await fetchEvents();
    } catch (err) {
      console.error(err);
      toast('Network error', 'error');
    } finally { setBusy(prev => ({ ...prev, [id]: false })); }
  };

  return (
    <section className="section">
      <div className="section-head">
        <h2>Upcoming events</h2>
        <p>Explore upcoming volunteer opportunities.</p>
      </div>
      <div className="grid features-grid">
        {loading ? <p>Loading...</p> : (events.length ? events.map((e) => (
          <article key={e.id || e._id} className="feature">
            <h3>{e.title}</h3>
            <p>{e.description}</p>
            <small>{new Date(e.date).toLocaleString()} · {e.location}</small>
                <div style={{ marginTop: 8 }}>
              <small>Organizer: {e.organizer || 'N/A'}</small>
              <div style={{ marginTop: 6 }}>
                {/* If user is organizer of this event, show cancel */}
                {user && (user.id === e.organizer) ? (
                  <button className="btn btn-danger" disabled={busy[e.id || e._id]} onClick={() => handleCancel(e.id || e._id)}>Cancel Event</button>
                ) : (
                  // if volunteer and already joined, show Leave; else Join
                  user && (e.volunteers || []).find(v => v === user.id) ? (
                    <button className="btn" disabled={busy[e.id || e._id]} onClick={() => handleLeave(e.id || e._id)}>Leave</button>
                  ) : (
                    <button className="btn" disabled={busy[e.id || e._id]} onClick={() => handleJoin(e.id || e._id)}>Join</button>
                  )
                )}
                <span style={{ marginLeft: 8 }}>{(e.volunteers || []).length} joined</span>
              </div>
            </div>
          </article>
        )) : <p>No upcoming events yet.</p>)}
      </div>
    </section>
  );
}
