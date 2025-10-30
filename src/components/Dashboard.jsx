import React, { useState, useEffect } from "react";
import Calendar from "./Calendar";
import Events from "./Events";
import SideNav from "./SideNav";

export default function Dashboard({ user, setUser, token ,showToast}) {
  const [profile, setProfile] = useState({
    firstName: user?.firstName || user?.name || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    role: user?.role || "",
  });
  const [myCreated, setMyCreated] = useState([]);
  const [myJoined, setMyJoined] = useState([]);

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setUser(profile); // update parent App state
    alert("Profile updated successfully!");
  };

  // Animate stats numbers
  useEffect(() => {
    const counters = document.querySelectorAll(".stat-number");
    counters.forEach((el) => {
      const target = +el.dataset.count || 0;
      let count = 0;
      const increment = Math.ceil(target / 100);

      const updateCounter = () => {
        count += increment;
        if (count < target) {
          el.textContent = count;
          requestAnimationFrame(updateCounter);
        } else {
          el.textContent = target;
        }
      };
      requestAnimationFrame(updateCounter);
    });
  }, []);

  const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

  // Fetch user's events
  const fetchMyEvents = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/events/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      setMyCreated(data.created || []);
      setMyJoined(data.joined || []);
    } catch (err) {
      console.error("fetchMyEvents", err);
    }
  };

  useEffect(() => {
    fetchMyEvents();
  }, [token]);

  return (
    <div style={{ display: "flex" }}>
      {/* ✅ Fixed sidebar */}
      <SideNav />

      {/* ✅ Main dashboard content */}
      <div
        className="dashboard-section section"
        style={{
          flex: 1,
          marginLeft: 220, // matches SideNav width
          padding: "20px",
        }}
      >
        {/* Top nav inside dashboard */}
        <nav
          className="dashboard-topnav"
          style={{ display: "flex", gap: 12, marginBottom: 12 }}
        >
          <a href="/events" className="nav-link">
            Events
          </a>
          <a href="#about" className="nav-link">
            About Us
          </a>
          <a href="#features" className="nav-link">
            Features
          </a>
          <a href="#calendar" className="nav-link">
            Calendar
          </a>
        </nav>

        <header className="dashboard-header">
          <h1>Welcome, {profile.firstName || "User"}!</h1>
          <p>Role: {profile.role || "N/A"}</p>
        </header>

        {/* Stats Section */}
        <div className="stats">
          <div className="stat">
            <span className="stat-number" data-count="120">
              0
            </span>
            <span className="stat-label">Volunteered Hours</span>
          </div>
          <div className="stat">
            <span className="stat-number" data-count="15">
              0
            </span>
            <span className="stat-label">Projects Joined</span>
          </div>
          <div className="stat">
            <span className="stat-number" data-count="8">
              0
            </span>
            <span className="stat-label">Upcoming Events</span>
          </div>
        </div>

        {/* Profile Section */}
        <section className="dashboard-profile">
          <h2>Update Profile</h2>
          <form onSubmit={handleSubmit} className="profile-form">
            <div className="form-row">
              <div className="form-group">
                <input
                  name="firstName"
                  value={profile.firstName}
                  onChange={handleChange}
                  placeholder="Enter your first name"
                  required
                />
              </div>
              <div className="form-group">
                <input
                  name="lastName"
                  value={profile.lastName}
                  onChange={handleChange}
                  placeholder="Enter your last name"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <input
                name="email"
                type="email"
                value={profile.email}
                onChange={handleChange}
                placeholder="Enter your email address"
                required
              />
            </div>

            <div className="form-group">
              <select
                name="role"
                value={profile.role}
                onChange={handleChange}
                required
              >
                <option value="">Select role</option>
                <option value="volunteer">Volunteer</option>
                <option value="organizer">Event Organizer</option>
                <option value="both">Both</option>
              </select>
            </div>

            <button className="btn btn-primary" type="submit">
              Save Changes
            </button>
          </form>
        </section>

        {/* Quick Actions */}
        <section className="dashboard-features">
          <h2>Quick Actions</h2>
          <div className="features-grid">
            <div
              className="feature btn-card"
              onClick={() => alert("Impact Tracker clicked!")}
            >
              <h3>Impact Tracker</h3>
              <p>View your volunteering impact and contributions.</p>
            </div>
            <div
              className="feature btn-card"
              onClick={() => alert("Explore Opportunities clicked!")}
            >
              <h3>Explore Opportunities</h3>
              <p>Find new volunteering events to join.</p>
            </div>
            <div
              className="feature btn-card"
              onClick={() => alert("Profile Settings clicked!")}
            >
              <h3>Profile Settings</h3>
              <p>Manage your account information and preferences.</p>
            </div>
          </div>
        </section>

        {/* Organizer / Volunteer Sections */}
        {(user?.role === "organizer" || user?.role === "both") && (
          <section className="dashboard-actions">
            <h2>Create an event</h2>
            <CreateEventForm token={token} onCreated={fetchMyEvents} />

            <h3 style={{ marginTop: 18 }}>Your created events</h3>
            <div className="grid features-grid">
              {myCreated.length ? (
                myCreated.map((e) => (
                  <article key={e.id || e._id} className="feature">
                    <h4>{e.title}</h4>
                    <p>{e.description}</p>
                    <small>
                      {new Date(e.date).toLocaleString()} · {e.location}
                    </small>
                  </article>
                ))
              ) : (
                <p>You haven't created any events yet.</p>
              )}
            </div>
          </section>
        )}

        {(user?.role === "volunteer" || user?.role === "both") && (
          <section className="dashboard-actions">
            <h2>Events</h2>
            <TabEvents
              token={token}
              myJoined={myJoined}
              apiBase={API_BASE}
              showToast={showToast}
            />
          </section>
        )}

        <section id="calendar" style={{ marginTop: 24 }}>
          <Calendar apiBase={API_BASE} />
        </section>
      </div>
    </div>
  );
}

/* ---------- Helper Components ---------- */

function TabEvents({ token, myJoined, apiBase, showToast }) {
  const [tab, setTab] = useState("browse");
  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button
          className={`btn ${tab === "browse" ? "active" : ""}`}
          onClick={() => setTab("browse")}
        >
          Browse Events
        </button>
        <button
          className={`btn ${tab === "my" ? "active" : ""}`}
          onClick={() => setTab("my")}
        >
          My Joined Events
        </button>
      </div>
      {tab === "browse" ? (
        <Events showToast={showToast} />
      ) : (
        <div>
          {myJoined.length ? (
            myJoined.map((e) => (
              <article key={e.id || e._id} className="feature">
                <h4>{e.title}</h4>
                <p>{e.description}</p>
                <small>
                  {new Date(e.date).toLocaleString()} · {e.location}
                </small>
              </article>
            ))
          ) : (
            <p>You haven't joined any events yet.</p>
          )}
        </div>
      )}
    </div>
  );
}

function CreateEventForm({ token, onCreated }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    date: "",
    location: "",
    capacity: 20,
  });
  const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";
  const effectiveToken =
    token ||
    (typeof window !== "undefined"
      ? localStorage.getItem("voluntrix_token")
      : null);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/api/events`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${effectiveToken}`,
        },
        body: JSON.stringify({ ...form, date: form.date }),
      });
      const data = await res.json();
      if (!res.ok) return alert(data?.message || "Failed to create event");
      alert("Event created");
      setForm({ title: "", description: "", date: "", location: "", capacity: 20 });
      if (typeof onCreated === "function") onCreated();
    } catch (err) {
      console.error(err);
      alert("Network error");
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 680 }}>
      <div className="form-group">
        <input
          name="title"
          placeholder="Event title"
          value={form.title}
          onChange={handleChange}
          required
        />
      </div>
      <div className="form-group">
        <input
          name="date"
          type="datetime-local"
          value={form.date}
          onChange={handleChange}
          required
        />
      </div>
      <div className="form-group">
        <input
          name="location"
          placeholder="Location"
          value={form.location}
          onChange={handleChange}
        />
      </div>
      <div className="form-group">
        <textarea
          name="description"
          placeholder="Description"
          value={form.description}
          onChange={handleChange}
        />
      </div>
      <div className="form-group">
        <input
          name="capacity"
          type="number"
          min="1"
          value={form.capacity}
          onChange={handleChange}
        />
      </div>
      <button className="btn btn-primary" type="submit">
        Create Event
      </button>
    </form>
  );
}
