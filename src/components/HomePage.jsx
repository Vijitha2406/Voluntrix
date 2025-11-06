import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { formatLocationShort } from '../utils/formatLocation';

export default function HomePage({ user, token, showToast }) {
  const [stats, setStats] = useState({
    hoursVolunteered: 0,
    eventsJoined: 0,
    eventsCreated: 0,
    upcomingEvents: 0
  });
  const [recentEvents, setRecentEvents] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

  useEffect(() => {
    fetchUserData();
  }, [token]);

  const fetchUserData = async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      
      // Fetch user's events
      const eventsRes = await fetch(`${API_BASE}/api/events/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (eventsRes.ok) {
        const eventsData = await eventsRes.json();
        setStats(prev => ({
          ...prev,
          eventsJoined: eventsData.joined?.length || 0,
          eventsCreated: eventsData.created?.length || 0,
          hoursVolunteered: (eventsData.joined?.length || 0) * 4, // Estimated 4 hours per event
        }));
        
        // Set recent and upcoming events
        const allEvents = [...(eventsData.joined || []), ...(eventsData.created || [])];
        const now = new Date();
        const upcoming = allEvents.filter(event => new Date(event.date) > now).slice(0, 3);
        const recent = allEvents.filter(event => new Date(event.date) <= now).slice(0, 3);
        
        setUpcomingEvents(upcoming);
        setRecentEvents(recent);
        setStats(prev => ({ ...prev, upcomingEvents: upcoming.length }));
      }
      
    } catch (error) {
      console.error("Error fetching user data:", error);
      showToast?.("Failed to load dashboard data", "error");
    } finally {
      setLoading(false);
    }
  };

  // Animate stats on load
  useEffect(() => {
    const animateStats = () => {
      const counters = document.querySelectorAll(".stat-number");
      counters.forEach((counter) => {
        const target = parseInt(counter.dataset.count);
        let current = 0;
        const increment = target / 50; // Animate over 50 frames
        
        const updateCounter = () => {
          current += increment;
          if (current < target) {
            counter.textContent = Math.floor(current);
            requestAnimationFrame(updateCounter);
          } else {
            counter.textContent = target;
          }
        };
        
        requestAnimationFrame(updateCounter);
      });
    };

    if (!loading) {
      setTimeout(animateStats, 100);
    }
  }, [loading]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const quickActions = [
    {
      title: "Browse Events",
      description: "Find new volunteering opportunities",
      icon: "🔍",
      path: "/events",
      color: "#e53935"
    },
    {
      title: "Get Recommendations",
      description: "AI-powered events matched to you",
      icon: "🎯",
      path: "/recommendations",
      color: "#9c27b0"
    },
    {
      title: "View Calendar",
      description: "See your upcoming commitments",
      icon: "📅",
      path: "/calendar",
      color: "#1976d2"
    },
    {
      title: "Create Event",
      description: "Organize a new volunteer event",
      icon: "➕",
      path: "/profile?action=create",
      color: "#388e3c",
      show: user?.role === 'organizer' || user?.role === 'both'
    },
    {
      title: "Impact Report",
      description: "Track your volunteering impact",
      icon: "📊",
      path: "/impact",
      color: "#f57c00"
    }
  ];

  if (loading) {
    return (
      <div className="home-page loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="home-page">
      {/* Welcome Header */}
      <div className="welcome-header">
        <div className="welcome-content">
          <h1>{getGreeting()}, {user?.firstName || user?.name || 'Volunteer'}! 👋</h1>
          <p className="welcome-subtitle">
            Ready to make an impact today? Here's what's happening in your volunteer journey.
          </p>
        </div>
        <div className="user-avatar">
          <div 
            className="avatar-circle"
            style={{
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat'
            }}
          >
            {(user?.firstName || user?.name || 'U')[0].toUpperCase()}
          </div>
          <div className="user-info">
            <span className="user-role">{user?.role || 'Volunteer'}</span>
          </div>
        </div>
      </div>

      {/* Stats Dashboard */}
      <div className="stats-section">
        <h2>Your Impact At A Glance</h2>
        <div className="stats-grid">
          <div className="stat-card hours">
            <div className="stat-icon">⏰</div>
            <div className="stat-content">
              <span className="stat-number" data-count={stats.hoursVolunteered}>0</span>
              <span className="stat-label">Hours Volunteered</span>
            </div>
          </div>
          
          <div className="stat-card events">
            <div className="stat-icon">🎯</div>
            <div className="stat-content">
              <span className="stat-number" data-count={stats.eventsJoined}>0</span>
              <span className="stat-label">Events Joined</span>
            </div>
          </div>
          
          {(user?.role === 'organizer' || user?.role === 'both') && (
            <div className="stat-card created">
              <div className="stat-icon">🚀</div>
              <div className="stat-content">
                <span className="stat-number" data-count={stats.eventsCreated}>0</span>
                <span className="stat-label">Events Created</span>
              </div>
            </div>
          )}
          
          <div className="stat-card upcoming">
            <div className="stat-icon">📅</div>
            <div className="stat-content">
              <span className="stat-number" data-count={stats.upcomingEvents}>0</span>
              <span className="stat-label">Upcoming Events</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions-section">
        <h2>Quick Actions</h2>
        <div className="actions-grid">
          {quickActions
            .filter(action => action.show !== false)
            .map((action, index) => (
              <Link 
                key={index} 
                to={action.path} 
                className="action-card"
                style={{ borderLeftColor: action.color }}
              >
                <div className="action-icon" style={{ backgroundColor: action.color }}>
                  {action.icon}
                </div>
                <div className="action-content">
                  <h3>{action.title}</h3>
                  <p>{action.description}</p>
                </div>
                <div className="action-arrow">→</div>
              </Link>
            ))}
        </div>
      </div>

      {/* Recent & Upcoming Events */}
      <div className="events-overview">
        <div className="events-section">
          <div className="section-header">
            <h2>Upcoming Events</h2>
            <Link to="/events" className="view-all-link">View All →</Link>
          </div>
          
          {upcomingEvents.length > 0 ? (
            <div className="events-list">
              {upcomingEvents.map((event, index) => (
                <div key={index} className="event-preview">
                  <div className="event-date">
                    <span className="month">{new Date(event.date).toLocaleDateString('en', { month: 'short' })}</span>
                    <span className="day">{new Date(event.date).getDate()}</span>
                  </div>
                  <div className="event-details">
                    <h4>{event.title}</h4>
                    <p>{formatLocationShort(event.location) || 'Location TBD'}</p>
                    <span className="event-time">
                      {new Date(event.date).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="event-status">
                    {event.organizer === user?.id ? (
                      <span className="badge organizer">Organizing</span>
                    ) : (
                      <span className="badge joined">Joined</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>No upcoming events. <Link to="/events">Browse available opportunities →</Link></p>
            </div>
          )}
        </div>

        {recentEvents.length > 0 && (
          <div className="events-section">
            <h2>Recent Activity</h2>
            <div className="recent-activity">
              {recentEvents.map((event, index) => (
                <div key={index} className="activity-item">
                  <div className="activity-icon">✅</div>
                  <div className="activity-content">
                    <p>
                      {event.organizer === user?.id ? 'Organized' : 'Participated in'} 
                      <strong> {event.title}</strong>
                    </p>
                    <span className="activity-date">
                      {new Date(event.date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Motivational Footer */}
      <div className="motivation-section">
        <div className="motivation-card">
          <h3>Keep Making a Difference! 🌟</h3>
          <p>
            Every hour you volunteer creates ripple effects of positive change in your community. 
            Thank you for being part of the Voluntrix family!
          </p>
          <Link to="/events" className="btn btn-primary">Find More Opportunities</Link>
        </div>
      </div>
    </div>
  );
}