import React, { useState, useEffect } from 'react';

const MyApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";
  const token = localStorage.getItem("voluntrix_token");

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/events/my-applications`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch applications');
      }

      const data = await response.json();
      setApplications(data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching applications:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      pending: { background: '#fff3cd', color: '#856404', border: '1px solid #ffeaa7' },
      accepted: { background: '#d4edda', color: '#155724', border: '1px solid #c3e6cb' },
      rejected: { background: '#f8d7da', color: '#721c24', border: '1px solid #f5c6cb' },
      completed: { background: '#d1ecf1', color: '#0c5460', border: '1px solid #bee5eb' }
    };

    const style = statusStyles[status] || statusStyles.pending;

    return (
      <span 
        className="status-badge"
        style={{
          ...style,
          padding: '4px 12px',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: '600',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}
      >
        {status}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeElapsed = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMs = now - date;
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return `${Math.floor(diffInDays / 30)} months ago`;
  };

  if (loading) {
    return (
      <div className="loading-state">
        <div className="loading-spinner"></div>
        <p>Loading your applications...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-state">
        <div className="error-icon">❌</div>
        <h3>Unable to Load Applications</h3>
        <p>{error}</p>
        <button onClick={fetchApplications} className="retry-btn">
          Try Again
        </button>
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📝</div>
        <h3>No Applications Yet</h3>
        <p>You haven't applied to any events yet. Browse our recommendations to find opportunities that match your interests!</p>
      </div>
    );
  }

  return (
    <div className="my-applications">
      <div className="applications-header">
        <h2>My Applications</h2>
        <p className="applications-subtitle">
          Track the status of your volunteer applications
        </p>
      </div>

      <div className="applications-grid">
        {applications.map((app) => (
          <div key={app.id} className="application-card">
            {/* Event Image */}
            {app.event.image ? (
              <img 
                src={app.event.image} 
                alt={app.event.title}
                className="event-image"
              />
            ) : (
              <div className="event-image-placeholder">
                📅
              </div>
            )}

            <div className="application-content">
              {/* Header with status */}
              <div className="application-header">
                <h3 className="event-title">{app.event.title}</h3>
                {getStatusBadge(app.status)}
              </div>

              {/* Event details */}
              <div className="event-details">
                <div className="detail-item">
                  <span className="detail-icon">📅</span>
                  <span>{formatDate(app.event.date)}</span>
                </div>
                
                {app.event.location && (
                  <div className="detail-item">
                    <span className="detail-icon">📍</span>
                    <span>
                      {app.event.location.isRemote 
                        ? 'Remote' 
                        : app.event.location.address || 'Location TBD'
                      }
                    </span>
                  </div>
                )}

                <div className="detail-item">
                  <span className="detail-icon">👤</span>
                  <span>
                    Organizer: {app.event.organizer?.firstName} {app.event.organizer?.lastName}
                  </span>
                </div>
              </div>

              {/* Application timeline */}
              <div className="application-timeline">
                <div className="timeline-item">
                  <span className="timeline-label">Applied:</span>
                  <span className="timeline-value">
                    {getTimeElapsed(app.appliedAt)}
                  </span>
                </div>

                {app.acceptedAt && (
                  <div className="timeline-item">
                    <span className="timeline-label">Accepted:</span>
                    <span className="timeline-value">
                      {getTimeElapsed(app.acceptedAt)}
                    </span>
                  </div>
                )}

                {app.completedAt && (
                  <div className="timeline-item">
                    <span className="timeline-label">Completed:</span>
                    <span className="timeline-value">
                      {getTimeElapsed(app.completedAt)}
                    </span>
                  </div>
                )}

                {app.volunteerHours && (
                  <div className="timeline-item">
                    <span className="timeline-label">Hours Earned:</span>
                    <span className="timeline-value volunteer-hours">
                      {app.volunteerHours} hours
                    </span>
                  </div>
                )}
              </div>

              {/* Application message */}
              {app.message && (
                <div className="application-message">
                  <h4>Your Message:</h4>
                  <p>"{app.message}"</p>
                </div>
              )}

              {/* Feedback from organizer */}
              {app.feedback && (
                <div className="organizer-feedback">
                  <h4>Organizer Feedback:</h4>
                  <p>"{app.feedback}"</p>
                </div>
              )}

              {/* Event description preview */}
              <div className="event-description">
                <p>{app.event.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyApplications;