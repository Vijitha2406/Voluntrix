import React, { useState, useEffect } from 'react';

const EventManagement = ({ eventId, eventTitle, onClose }) => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingId, setProcessingId] = useState(null);
  
  const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";
  const token = localStorage.getItem("voluntrix_token");

  useEffect(() => {
    fetchApplications();
  }, [eventId]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/events/${eventId}/applications`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch applications');
      }

      const data = await response.json();
      setApplications(data.applications);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching applications:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateApplicationStatus = async (applicationId, status, feedback = '') => {
    try {
      setProcessingId(applicationId);
      const response = await fetch(`${API_BASE}/api/events/${eventId}/applications/${applicationId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status, feedback })
      });

      if (!response.ok) {
        throw new Error('Failed to update application');
      }

      // Refresh applications
      await fetchApplications();
    } catch (err) {
      console.error('Error updating application:', err);
      alert(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const setVolunteerHours = async (applicationId, hours) => {
    try {
      setProcessingId(applicationId);
      const response = await fetch(`${API_BASE}/api/events/${eventId}/applications/${applicationId}/hours`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ hours: parseFloat(hours) })
      });

      if (!response.ok) {
        throw new Error('Failed to set volunteer hours');
      }

      // Refresh applications
      await fetchApplications();
    } catch (err) {
      console.error('Error setting hours:', err);
      alert(err.message);
    } finally {
      setProcessingId(null);
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

  if (loading) {
    return (
      <div className="event-management-modal">
        <div className="modal-content">
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading applications...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="event-management-modal">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Manage Applications</h2>
          <p className="modal-subtitle">{eventTitle}</p>
          <button onClick={onClose} className="close-btn">×</button>
        </div>

        {error && (
          <div className="error-message">
            <span>❌</span>
            <span>{error}</span>
          </div>
        )}

        {applications.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <h3>No Applications Yet</h3>
            <p>No volunteers have applied to this event yet.</p>
          </div>
        ) : (
          <div className="applications-list">
            {applications.map((app) => (
              <div key={app.id} className="application-item">
                <div className="applicant-info">
                  <div className="applicant-header">
                    <h3>{app.user.firstName} {app.user.lastName}</h3>
                    {getStatusBadge(app.status)}
                  </div>
                  
                  <div className="applicant-details">
                    <p><strong>Email:</strong> {app.user.email}</p>
                    <p><strong>Applied:</strong> {formatDate(app.appliedAt)}</p>
                    {app.acceptedAt && (
                      <p><strong>Accepted:</strong> {formatDate(app.acceptedAt)}</p>
                    )}
                  </div>

                  {app.message && (
                    <div className="application-message">
                      <h4>Application Message:</h4>
                      <p>"{app.message}"</p>
                    </div>
                  )}

                  {app.user.skills && app.user.skills.length > 0 && (
                    <div className="applicant-skills">
                      <h4>Skills:</h4>
                      <div className="skills-tags">
                        {app.user.skills.slice(0, 5).map((skill, index) => (
                          <span key={index} className="skill-tag">
                            {skill.name}
                            {skill.level && (
                              <span className="skill-level">{skill.level}</span>
                            )}
                          </span>
                        ))}
                        {app.user.skills.length > 5 && (
                          <span className="skill-tag">+{app.user.skills.length - 5} more</span>
                        )}
                      </div>
                    </div>
                  )}

                  {app.user.location && (
                    <div className="applicant-location">
                      <h4>Location:</h4>
                      <p>📍 {app.user.location.city || 'Not specified'}</p>
                    </div>
                  )}
                </div>

                <div className="application-actions">
                  {app.status === 'pending' && (
                    <div className="action-buttons">
                      <button
                        onClick={() => updateApplicationStatus(app.id, 'accepted')}
                        disabled={processingId === app.id}
                        className="accept-btn"
                      >
                        {processingId === app.id ? 'Processing...' : 'Accept'}
                      </button>
                      <button
                        onClick={() => {
                          const feedback = prompt('Optional feedback for rejection:');
                          updateApplicationStatus(app.id, 'rejected', feedback || '');
                        }}
                        disabled={processingId === app.id}
                        className="reject-btn"
                      >
                        Reject
                      </button>
                    </div>
                  )}

                  {app.status === 'accepted' && (
                    <div className="action-buttons">
                      <button
                        onClick={() => updateApplicationStatus(app.id, 'completed')}
                        disabled={processingId === app.id}
                        className="complete-btn"
                      >
                        Mark Complete
                      </button>
                    </div>
                  )}

                  {app.status === 'completed' && (
                    <div className="hours-section">
                      <h4>Volunteer Hours:</h4>
                      <div className="hours-input-group">
                        <input
                          type="number"
                          min="0"
                          max="24"
                          step="0.5"
                          defaultValue={app.volunteerHours || 4}
                          placeholder="Hours"
                          className="hours-input"
                          onBlur={(e) => {
                            const hours = parseFloat(e.target.value);
                            if (hours && hours !== app.volunteerHours) {
                              setVolunteerHours(app.id, hours);
                            }
                          }}
                        />
                        <span>hours</span>
                      </div>
                      {app.volunteerHours && (
                        <p className="current-hours">
                          Current: {app.volunteerHours} hours
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EventManagement;