import React, { useState, useEffect } from 'react';
import { formatLocationShort } from '../utils/formatLocation';

export default function RecommendationsSection({ token, showToast }) {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState({});
  
  const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';

  useEffect(() => {
    fetchRecommendations();
  }, [token]);

  const fetchRecommendations = async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/events/recommendations`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setRecommendations(data);
      } else {
        console.error('Failed to fetch recommendations');
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyToEvent = async (eventId) => {
    if (!token) {
      showToast?.('Please login to apply for events', 'error');
      return;
    }

    setBusy(prev => ({ ...prev, [eventId]: true }));

    try {
      const response = await fetch(`${API_BASE}/api/events/${eventId}/apply`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: 'I am interested in volunteering for this event and believe my skills would be a great fit.'
        })
      });

      const data = await response.json();

      if (response.ok) {
        showToast?.(`Successfully applied to "${data.event.title}"! Your application is pending review.`, 'success');
        // Remove the event from recommendations or refetch
        setRecommendations(prev => prev.filter(event => event.id !== eventId));
      } else {
        showToast?.(data.message || 'Failed to apply', 'error');
      }
    } catch (error) {
      console.error('Error applying to event:', error);
      showToast?.('Network error occurred', 'error');
    } finally {
      setBusy(prev => ({ ...prev, [eventId]: false }));
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#27ae60'; // Green
    if (score >= 60) return '#f39c12'; // Orange
    if (score >= 40) return '#e67e22'; // Dark orange
    return '#e74c3c'; // Red
  };

  const getScoreLabel = (score) => {
    if (score >= 80) return 'Excellent Match';
    if (score >= 60) return 'Good Match';
    if (score >= 40) return 'Fair Match';
    return 'Basic Match';
  };

  if (loading) {
    return (
      <div className="recommendations-section">
        <div className="section-card">
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Finding your perfect volunteer matches...</p>
          </div>
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="recommendations-section">
        <div className="section-card">
          <div className="section-header">
            <h2>🎯 Recommended for You</h2>
          </div>
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <h3>No recommendations available</h3>
            <p>Complete your profile with skills and interests to get personalized event recommendations!</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="recommendations-section">
      <div className="section-card">
        <div className="section-header">
          <h2>🎯 Recommended for You</h2>
          <p className="section-subtitle">
            Events that match your skills, interests, and availability
          </p>
        </div>

        <div className="recommendations-grid">
          {recommendations.map((event) => (
            <div key={event.id} className="recommendation-card">
              {/* Compatibility Score Badge */}
              <div 
                className="compatibility-badge"
                style={{ backgroundColor: getScoreColor(event.compatibilityScore) }}
              >
                <span className="score-value">{event.compatibilityScore}%</span>
                <span className="score-label">{getScoreLabel(event.compatibilityScore)}</span>
              </div>

              {/* Event Image */}
              {event.images && event.images.length > 0 ? (
                <img 
                  src={event.images[0]} 
                  alt={event.title} 
                  className="event-image"
                />
              ) : (
                <div className="event-image-placeholder">
                  📅
                </div>
              )}

              {/* Event Content */}
              <div className="event-content">
                <div className="event-header">
                  <h3 className="event-title">{event.title}</h3>
                  <div className="event-category">{event.category}</div>
                </div>

                <p className="event-description">{event.description}</p>

                <div className="event-details">
                  <div className="detail-item">
                    <span className="detail-icon">📅</span>
                    <span>{new Date(event.date).toLocaleDateString()}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-icon">📍</span>
                    <span>{formatLocationShort(event.location)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-icon">👥</span>
                    <span>{event.availableSpots || event.capacity} spots available</span>
                  </div>
                  {event.timeCommitment && (
                    <div className="detail-item">
                      <span className="detail-icon">⏰</span>
                      <span>{event.timeCommitment}</span>
                    </div>
                  )}
                </div>

                {/* Match Reasons */}
                {event.matchReasons && event.matchReasons.length > 0 && (
                  <div className="match-reasons">
                    <h4>Why this matches you:</h4>
                    <ul>
                      {event.matchReasons.map((reason, index) => (
                        <li key={index}>{reason}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Required Skills */}
                {event.requiredSkills && event.requiredSkills.length > 0 && (
                  <div className="required-skills">
                    <h4>Skills needed:</h4>
                    <div className="skills-tags">
                      {event.requiredSkills.map((skill, index) => (
                        <span key={index} className="skill-tag">
                          {skill.name}
                          {skill.level !== 'Beginner' && (
                            <span className="skill-level">({skill.level})</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Button */}
                <div className="event-actions">
                  <button
                    className="apply-btn"
                    disabled={busy[event.id]}
                    onClick={() => handleApplyToEvent(event.id)}
                  >
                    {busy[event.id] ? 'Applying...' : 'Apply Now'}
                  </button>
                  <button className="learn-more-btn">
                    Learn More
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {recommendations.length > 0 && (
          <div className="recommendations-footer">
            <button 
              className="refresh-btn"
              onClick={fetchRecommendations}
              disabled={loading}
            >
              🔄 Refresh Recommendations
            </button>
            <p className="footer-note">
              Recommendations update based on your profile and preferences. 
              Complete your skills and interests for better matches!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}