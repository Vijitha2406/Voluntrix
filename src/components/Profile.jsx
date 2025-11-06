import React, { useState, useEffect } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import CreateEventModal from "./CreateEventModal";
import { formatLocationShort } from '../utils/formatLocation';

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

export default function Profile({ user, setUser, token, showToast }) {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState("profile");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSkill, setNewSkill] = useState({ name: "", level: "Beginner" });
  const [newInterest, setNewInterest] = useState("");
  const [profile, setProfile] = useState({
    firstName: user?.firstName || user?.name || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    role: user?.role || "",
    bio: user?.bio || "",
    phone: user?.phone || "",
    dateOfBirth: user?.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : "",
    location: {
      city: user?.location?.city || "",
      state: user?.location?.state || "",
      country: user?.location?.country || ""
    },
    skills: user?.skills || [],
    interests: user?.interests || [],
    preferences: {
      availabilityDays: user?.preferences?.availabilityDays || [],
      timeCommitment: user?.preferences?.timeCommitment || "",
      travelDistance: user?.preferences?.travelDistance || 25,
      remoteWork: user?.preferences?.remoteWork || false
    },
    socialLinks: {
      linkedin: user?.socialLinks?.linkedin || "",
      twitter: user?.socialLinks?.twitter || "",
      website: user?.socialLinks?.website || ""
    },
    notificationSettings: {
      emailNotifications: user?.notificationSettings?.emailNotifications ?? true,
      pushNotifications: user?.notificationSettings?.pushNotifications ?? true,
      eventReminders: user?.notificationSettings?.eventReminders ?? true,
      weeklyDigest: user?.notificationSettings?.weeklyDigest ?? true
    }
  });
  const [myCreated, setMyCreated] = useState([]);
  const [myJoined, setMyJoined] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [participatedEvents, setParticipatedEvents] = useState([]);

  // Handle URL parameters on component mount
  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'create') {
      setShowCreateModal(true);
    }
  }, [searchParams]);

  // Update profile state when user prop changes
  useEffect(() => {
    if (user) {
      setProfile({
        firstName: user?.firstName || user?.name || "",
        lastName: user?.lastName || "",
        email: user?.email || "",
        role: user?.role || "",
        bio: user?.bio || "",
        phone: user?.phone || "",
        dateOfBirth: user?.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : "",
        location: {
          city: user?.location?.city || "",
          state: user?.location?.state || "",
          country: user?.location?.country || ""
        },
        skills: user?.skills || [],
        interests: user?.interests || [],
        preferences: {
          availabilityDays: user?.preferences?.availabilityDays || [],
          timeCommitment: user?.preferences?.timeCommitment || "",
          travelDistance: user?.preferences?.travelDistance || 25,
          remoteWork: user?.preferences?.remoteWork || false
        },
        socialLinks: {
          linkedin: user?.socialLinks?.linkedin || "",
          twitter: user?.socialLinks?.twitter || "",
          website: user?.socialLinks?.website || ""
        },
        notificationSettings: {
          emailNotifications: user?.notificationSettings?.emailNotifications ?? true,
          pushNotifications: user?.notificationSettings?.pushNotifications ?? true,
          eventReminders: user?.notificationSettings?.eventReminders ?? true,
          weeklyDigest: user?.notificationSettings?.weeklyDigest ?? true
        }
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setProfile(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setProfile(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleNestedChange = (parent, child, value) => {
    setProfile(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [child]: value
      }
    }));
  };

  const addSkill = () => {
    if (newSkill.name.trim()) {
      setProfile(prev => ({
        ...prev,
        skills: [...prev.skills, { ...newSkill, id: Date.now() }]
      }));
      setNewSkill({ name: "", level: "Beginner" });
    }
  };

  const removeSkill = (index) => {
    setProfile(prev => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index)
    }));
  };

  const addInterest = () => {
    if (newInterest.trim() && !profile.interests.includes(newInterest)) {
      setProfile(prev => ({
        ...prev,
        interests: [...prev.interests, newInterest]
      }));
      setNewInterest("");
    }
  };

  const removeInterest = (index) => {
    setProfile(prev => ({
      ...prev,
      interests: prev.interests.filter((_, i) => i !== index)
    }));
  };

  const handleAvailabilityChange = (day) => {
    setProfile(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        availabilityDays: prev.preferences.availabilityDays.includes(day)
          ? prev.preferences.availabilityDays.filter(d => d !== day)
          : [...prev.preferences.availabilityDays, day]
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const updatedProfile = { ...profile };
      
      // Make API call to update profile on backend
      const response = await fetch(`${API_BASE}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatedProfile),
      });
      
      if (response.ok) {
        const updatedUserData = await response.json();
        
        // Update both local state and parent App state
        setProfile(updatedProfile);
        
        // Create updated user object
        const updatedUser = { ...user, ...updatedUserData };
        
        // Update parent App state
        setUser(updatedUser);
        
        // Update localStorage
        try {
          localStorage.setItem("voluntrix_user", JSON.stringify(updatedUser));
        } catch (error) {
          console.error("Error updating localStorage:", error);
        }
        
        showToast?.("Profile updated successfully!", "success");
      } else {
        // If API call fails, still update locally for now
        console.warn("API update failed, updating locally");
        
        // Update both local state and parent App state
        setProfile(updatedProfile);
        
        // Create updated user object
        const updatedUser = { ...user, ...updatedProfile };
        
        // Update parent App state
        setUser(updatedUser);
        
        // Update localStorage
        try {
          localStorage.setItem("voluntrix_user", JSON.stringify(updatedUser));
        } catch (error) {
          console.error("Error updating localStorage:", error);
        }
        
        showToast?.("Profile updated locally (server update failed)", "warning");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      
      // Fallback to local update
      const updatedProfile = { ...profile };
      
      // Update both local state and parent App state
      setProfile(updatedProfile);
      
      // Create updated user object
      const updatedUser = { ...user, ...updatedProfile };
      
      // Update parent App state
      setUser(updatedUser);
      
      // Update localStorage
      try {
        localStorage.setItem("voluntrix_user", JSON.stringify(updatedUser));
      } catch (error) {
        console.error("Error updating localStorage:", error);
      }
      
      showToast?.("Profile updated locally (network error)", "warning");
    }
  };

    const fetchMyEvents = async () => {
    if (!token) return;
    
    try {
      const res = await fetch(`${API_BASE}/api/events/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (res.ok) {
        const data = await res.json();
        setMyCreated(data.created || []);
        setMyJoined(data.joined || []);
        
        // Separate upcoming and participated events
        const now = new Date();
        const upcoming = [];
        const participated = [];
        
        [...(data.created || []), ...(data.joined || [])].forEach(event => {
          if (new Date(event.date) > now) {
            upcoming.push(event);
          } else {
            participated.push(event);
          }
        });
        
        setUpcomingEvents(upcoming);
        setParticipatedEvents(participated);
      }
      
    } catch (err) {
      console.error("fetchMyEvents", err);
    }
  };

  const handleEventCreated = () => {
    fetchMyEvents(); // Refresh events after creating new one
  };

  useEffect(() => {
    fetchMyEvents();
  }, [token]);

  return (
    <>
      <div className="dashboard-section section" style={{ padding: "20px" }}>
        {/* Profile Header */}
        <header className="profile-header" style={{
          background: 'linear-gradient(135deg, var(--brand), #c62828)',
          color: 'white',
          borderRadius: '16px',
          padding: '32px',
          marginBottom: '32px',
          textAlign: 'center'
        }}>
          <div className="profile-avatar" style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            fontSize: '32px',
            fontWeight: 'bold'
          }}>
            {(profile.firstName || 'U')[0].toUpperCase()}
          </div>
          <h1 style={{ margin: '0 0 8px 0', fontSize: '28px' }}>
            {profile.firstName} {profile.lastName}
          </h1>
          <p style={{ margin: '0', fontSize: '16px', opacity: '0.9' }}>
            {profile.role || 'Volunteer'} • {profile.email}
          </p>
        </header>

        {/* Tab Navigation */}
        <div className="profile-tabs" style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '32px',
          borderBottom: '1px solid #e9ecef',
          paddingBottom: '0'
        }}>
          {[
            { id: 'profile', label: 'Basic Info', icon: '👤' },
            { id: 'skills', label: 'Skills & Interests', icon: '🎯' },
            { id: 'preferences', label: 'Preferences', icon: '⚙️' },
            { id: 'stats', label: 'My Impact', icon: '�' },
            { id: 'upcoming', label: 'Upcoming Events', icon: '📅' },
            { id: 'registered', label: 'Registered Events', icon: '📝' },
            { id: 'participated', label: 'Participated Events', icon: '✅' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '12px 20px',
                border: 'none',
                background: activeTab === tab.id ? 'var(--brand)' : 'transparent',
                color: activeTab === tab.id ? 'white' : 'var(--ink)',
                borderRadius: '8px 8px 0 0',
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontSize: '14px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === 'profile' && (
            <BasicProfileSection 
              profile={profile}
              handleChange={handleChange}
              handleNestedChange={handleNestedChange}
              handleSubmit={handleSubmit}
              showCreateModal={() => setShowCreateModal(true)}
            />
          )}
          
          {activeTab === 'skills' && (
            <SkillsInterestsSection 
              profile={profile}
              newSkill={newSkill}
              setNewSkill={setNewSkill}
              newInterest={newInterest}
              setNewInterest={setNewInterest}
              addSkill={addSkill}
              removeSkill={removeSkill}
              addInterest={addInterest}
              removeInterest={removeInterest}
              handleSubmit={handleSubmit}
            />
          )}
          
          {activeTab === 'preferences' && (
            <PreferencesSection 
              profile={profile}
              handleChange={handleChange}
              handleNestedChange={handleNestedChange}
              handleAvailabilityChange={handleAvailabilityChange}
              handleSubmit={handleSubmit}
            />
          )}
          
          {activeTab === 'stats' && (
            <StatsSection user={user} />
          )}
          
          {activeTab === 'upcoming' && (
            <EventsSection 
              title="Upcoming Events"
              events={upcomingEvents}
              emptyMessage="No upcoming events scheduled."
              icon="📅"
            />
          )}
          
          {activeTab === 'registered' && (
            <EventsSection 
              title="All Registered Events"
              events={myJoined}
              emptyMessage="You haven't registered for any events yet."
              icon="📝"
            />
          )}
          
          {activeTab === 'participated' && (
            <EventsSection 
              title="Participated Events"
              events={participatedEvents}
              emptyMessage="No events participated yet."
              icon="✅"
            />
          )}
        </div>
      </div>
      
      {/* Create Event Modal */}
      <CreateEventModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleEventCreated}
        showToast={showToast}
      />
    </>
  );
}

// Basic Profile Section Component
function BasicProfileSection({ 
  profile, 
  handleChange, 
  handleNestedChange, 
  handleSubmit, 
  showCreateModal
}) {
  const isOrganizer = profile.role === 'organizer' || profile.role === 'both';
  
  return (
    <div className="profile-section">
      <div className="section-card">
        <div className="section-header">
          <h2>Basic Profile Information</h2>
          {isOrganizer && (
            <button 
              type="button"
              onClick={showCreateModal}
              className="btn-primary create-event-btn"
            >
              <span>➕</span>
              Create Event
            </button>
          )}
        </div>
        
        <form onSubmit={handleSubmit} className="profile-form">
          {/* Basic Information */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstName">First Name *</label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                placeholder="Enter your first name"
                value={profile.firstName}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="lastName">Last Name *</label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                placeholder="Enter your last name"
                value={profile.lastName}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="email">Email Address *</label>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="Enter your email address"
                value={profile.email}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="phone">Phone Number</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                placeholder="Enter your phone number"
                value={profile.phone}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="role">Role *</label>
              <select
                id="role"
                name="role"
                value={profile.role}
                onChange={handleChange}
                required
              >
                <option value="">Select your role</option>
                <option value="volunteer">🙋‍♂️ Volunteer</option>
                <option value="organizer">👨‍💼 Organizer</option>
                <option value="both">🤝 Both Volunteer & Organizer</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="dateOfBirth">Date of Birth</label>
              <input
                type="date"
                id="dateOfBirth"
                name="dateOfBirth"
                value={profile.dateOfBirth}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Bio Section */}
          <div className="form-group">
            <label htmlFor="bio">Bio</label>
            <textarea
              id="bio"
              name="bio"
              placeholder="Tell us about yourself, your interests, and what motivates you to volunteer..."
              value={profile.bio}
              onChange={handleChange}
              rows="4"
              maxLength="500"
            />
            <small className="char-count">{profile.bio.length}/500 characters</small>
          </div>

          {/* Location Section */}
          <div className="form-section">
            <h3>Location</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="city">City</label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  placeholder="Enter your city"
                  value={profile.location.city}
                  onChange={(e) => handleNestedChange('location', 'city', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="state">State/Province</label>
                <input
                  type="text"
                  id="state"
                  name="state"
                  placeholder="Enter your state or province"
                  value={profile.location.state}
                  onChange={(e) => handleNestedChange('location', 'state', e.target.value)}
                />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="country">Country</label>
              <input
                type="text"
                id="country"
                name="country"
                placeholder="Enter your country"
                value={profile.location.country}
                onChange={(e) => handleNestedChange('location', 'country', e.target.value)}
              />
            </div>
          </div>

          {/* Social Links */}
          <div className="form-section">
            <h3>Social Links</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="linkedin">LinkedIn</label>
                <input
                  type="url"
                  id="linkedin"
                  name="linkedin"
                  placeholder="https://linkedin.com/in/yourprofile"
                  value={profile.socialLinks.linkedin}
                  onChange={(e) => handleNestedChange('socialLinks', 'linkedin', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="website">Personal Website</label>
                <input
                  type="url"
                  id="website"
                  name="website"
                  placeholder="https://yourwebsite.com"
                  value={profile.socialLinks.website}
                  onChange={(e) => handleNestedChange('socialLinks', 'website', e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary">
              <span>💾</span>
              Update Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Skills and Interests Section Component
function SkillsInterestsSection({ 
  profile, 
  newSkill, 
  setNewSkill, 
  newInterest, 
  setNewInterest, 
  addSkill, 
  removeSkill, 
  addInterest, 
  removeInterest,
  handleSubmit 
}) {
  const skillCategories = [
    'Environment', 'Education', 'Health', 'Community', 'Animals', 'Seniors', 
    'Children', 'Disaster Relief', 'Technology', 'Arts & Culture', 'Sports', 'Other'
  ];

  return (
    <div className="profile-section">
      <div className="section-card">
        <div className="section-header">
          <h2>Skills & Interests</h2>
        </div>
        
        <form onSubmit={handleSubmit}>
          {/* Skills Section */}
          <div className="form-section">
            <h3>Your Skills</h3>
            <p className="section-description">
              Add your skills to help us match you with relevant volunteer opportunities.
            </p>
            
            <div className="add-item-form">
              <div className="form-row">
                <div className="form-group">
                  <input
                    type="text"
                    placeholder="Enter a skill (e.g., Teaching, Cooking, Marketing)"
                    value={newSkill.name}
                    onChange={(e) => setNewSkill(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <select
                    value={newSkill.level}
                    onChange={(e) => setNewSkill(prev => ({ ...prev, level: e.target.value }))}
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                    <option value="Expert">Expert</option>
                  </select>
                </div>
                <button type="button" onClick={addSkill} className="btn-secondary">
                  Add Skill
                </button>
              </div>
            </div>

            <div className="items-list">
              {profile.skills.map((skill, index) => (
                <div key={index} className="item-tag skill-tag">
                  <span className="skill-name">{skill.name}</span>
                  <span className="skill-level">{skill.level}</span>
                  <button 
                    type="button" 
                    onClick={() => removeSkill(index)}
                    className="remove-btn"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Interests Section */}
          <div className="form-section">
            <h3>Your Interests</h3>
            <p className="section-description">
              Select categories you're passionate about to discover relevant volunteer opportunities.
            </p>
            
            <div className="add-item-form">
              <div className="form-row">
                <div className="form-group">
                  <select
                    value={newInterest}
                    onChange={(e) => setNewInterest(e.target.value)}
                  >
                    <option value="">Select an interest category</option>
                    {skillCategories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
                <button type="button" onClick={addInterest} className="btn-secondary">
                  Add Interest
                </button>
              </div>
            </div>

            <div className="items-list">
              {profile.interests.map((interest, index) => (
                <div key={index} className="item-tag interest-tag">
                  <span>{interest}</span>
                  <button 
                    type="button" 
                    onClick={() => removeInterest(index)}
                    className="remove-btn"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary">
              <span>💾</span>
              Save Skills & Interests
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Preferences Section Component
function PreferencesSection({ 
  profile, 
  handleChange, 
  handleNestedChange, 
  handleAvailabilityChange, 
  handleSubmit 
}) {
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <div className="profile-section">
      <div className="section-card">
        <div className="section-header">
          <h2>Volunteer Preferences</h2>
        </div>
        
        <form onSubmit={handleSubmit}>
          {/* Availability */}
          <div className="form-section">
            <h3>Availability</h3>
            <p className="section-description">
              When are you typically available to volunteer?
            </p>
            
            <div className="checkbox-grid">
              {daysOfWeek.map(day => (
                <label key={day} className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={profile.preferences.availabilityDays.includes(day)}
                    onChange={() => handleAvailabilityChange(day)}
                  />
                  <span className="checkmark"></span>
                  {day}
                </label>
              ))}
            </div>
          </div>

          {/* Time Commitment */}
          <div className="form-section">
            <h3>Time Commitment</h3>
            <div className="form-group">
              <label htmlFor="timeCommitment">Preferred time commitment per event</label>
              <select
                id="timeCommitment"
                value={profile.preferences.timeCommitment}
                onChange={(e) => handleNestedChange('preferences', 'timeCommitment', e.target.value)}
              >
                <option value="">Select time commitment</option>
                <option value="1-2 hours">1-2 hours</option>
                <option value="3-5 hours">3-5 hours</option>
                <option value="6-8 hours">6-8 hours</option>
                <option value="Full day">Full day</option>
                <option value="Multiple days">Multiple days</option>
              </select>
            </div>
          </div>

          {/* Travel Preferences */}
          <div className="form-section">
            <h3>Travel Preferences</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="travelDistance">Maximum travel distance (km)</label>
                <input
                  type="number"
                  id="travelDistance"
                  min="1"
                  max="500"
                  value={profile.preferences.travelDistance}
                  onChange={(e) => handleNestedChange('preferences', 'travelDistance', parseInt(e.target.value))}
                />
              </div>
              <div className="form-group">
                <label className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={profile.preferences.remoteWork}
                    onChange={(e) => handleNestedChange('preferences', 'remoteWork', e.target.checked)}
                  />
                  <span className="checkmark"></span>
                  Interested in remote volunteer opportunities
                </label>
              </div>
            </div>
          </div>

          {/* Notification Preferences */}
          <div className="form-section">
            <h3>Notification Preferences</h3>
            <div className="checkbox-list">
              <label className="checkbox-item">
                <input
                  type="checkbox"
                  checked={profile.notificationSettings.emailNotifications}
                  onChange={(e) => handleNestedChange('notificationSettings', 'emailNotifications', e.target.checked)}
                />
                <span className="checkmark"></span>
                Email notifications for new opportunities
              </label>
              
              <label className="checkbox-item">
                <input
                  type="checkbox"
                  checked={profile.notificationSettings.pushNotifications}
                  onChange={(e) => handleNestedChange('notificationSettings', 'pushNotifications', e.target.checked)}
                />
                <span className="checkmark"></span>
                Push notifications
              </label>
              
              <label className="checkbox-item">
                <input
                  type="checkbox"
                  checked={profile.notificationSettings.eventReminders}
                  onChange={(e) => handleNestedChange('notificationSettings', 'eventReminders', e.target.checked)}
                />
                <span className="checkmark"></span>
                Event reminders
              </label>
              
              <label className="checkbox-item">
                <input
                  type="checkbox"
                  checked={profile.notificationSettings.weeklyDigest}
                  onChange={(e) => handleNestedChange('notificationSettings', 'weeklyDigest', e.target.checked)}
                />
                <span className="checkmark"></span>
                Weekly opportunity digest
              </label>
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary">
              <span>💾</span>
              Save Preferences
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Stats Section Component
function StatsSection({ user }) {
  const stats = user?.volunteerStats || {};
  
  return (
    <div className="profile-section">
      <div className="section-card">
        <div className="section-header">
          <h2>My Volunteer Impact</h2>
        </div>
        
        <div className="stats-grid">
          <div className="stat-item">
            <div className="stat-icon">⏰</div>
            <div className="stat-value">{stats.totalHours || 0}</div>
            <div className="stat-label">Hours Volunteered</div>
          </div>
          
          <div className="stat-item">
            <div className="stat-icon">🎯</div>
            <div className="stat-value">{stats.eventsCompleted || 0}</div>
            <div className="stat-label">Events Completed</div>
          </div>
          
          <div className="stat-item">
            <div className="stat-icon">⭐</div>
            <div className="stat-value">{stats.averageRating?.toFixed(1) || 'N/A'}</div>
            <div className="stat-label">Average Rating</div>
          </div>
          
          <div className="stat-item">
            <div className="stat-icon">🏆</div>
            <div className="stat-value">{stats.badges?.length || 0}</div>
            <div className="stat-label">Badges Earned</div>
          </div>
        </div>
        
        {stats.badges && stats.badges.length > 0 && (
          <div className="badges-section">
            <h3>Achievement Badges</h3>
            <div className="badges-grid">
              {stats.badges.map((badge, index) => (
                <div key={index} className="badge-item">
                  <div className="badge-icon">{badge.icon}</div>
                  <div className="badge-info">
                    <div className="badge-name">{badge.name}</div>
                    <div className="badge-description">{badge.description}</div>
                    <div className="badge-date">
                      Earned: {new Date(badge.earnedDate).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {stats.certificates && stats.certificates.length > 0 && (
          <div className="certificates-section">
            <h3>Certificates</h3>
            <div className="certificates-list">
              {stats.certificates.map((cert, index) => (
                <div key={index} className="certificate-item">
                  <div className="certificate-icon">📜</div>
                  <div className="certificate-info">
                    <div className="certificate-id">Certificate #{cert.certificateId}</div>
                    <div className="certificate-date">
                      Issued: {new Date(cert.issuedDate).toLocaleDateString()}
                    </div>
                    <div className="certificate-verification">
                      Verification Code: {cert.verificationCode}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Profile Update Section Component
function ProfileUpdateSection({ profile, handleSubmit, handleChange, showCreateModal }) {
  const isOrganizer = profile.role === 'organizer' || profile.role === 'both';
  
  return (
    <div className="profile-update-section">
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '32px',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.05)',
        border: '1px solid #f0f0f0'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '24px' 
        }}>
          <h2 style={{ margin: 0, color: 'var(--ink)', fontSize: '24px', fontWeight: '600' }}>
            Update Profile Information
          </h2>
          
          {isOrganizer && (
            <button 
              type="button"
              onClick={showCreateModal}
              style={{
                background: 'var(--brand)',
                color: 'white',
                border: 'none',
                padding: '12px 20px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.3s ease'
              }}
            >
              <span>➕</span>
              Create Event
            </button>
          )}
        </div>
        
        <form onSubmit={handleSubmit} className="profile-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstName"></label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                placeholder="Enter your first name"
                value={profile.firstName}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="lastName"></label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                placeholder="Enter your last name"
                value={profile.lastName}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="email"></label>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="Enter your email address"
                value={profile.email}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="role"></label>
              <select
                id="role"
                name="role"
                value={profile.role}
                onChange={handleChange}
                required
              >
                <option value="">Select your role</option>
                <option value="volunteer">🙋‍♂️ Volunteer</option>
                <option value="organizer">👨‍💼 Organizer</option>
                <option value="both">🤝 Both Volunteer & Organizer</option>
              </select>
            </div>
          </div>
          <button type="submit">
            <span>💾</span>
            Update Profile
          </button>
        </form>
      </div>
    </div>
  );
}

// Events Section Component
function EventsSection({ title, events, emptyMessage, icon }) {
  return (
    <div className="events-section">
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '32px',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.05)'
      }}>
        <h2 style={{ 
          marginBottom: '24px', 
          color: 'var(--ink)', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px' 
        }}>
          <span style={{ fontSize: '24px' }}>{icon}</span>
          {title}
        </h2>
        
        {events.length > 0 ? (
          <div style={{ display: 'grid', gap: '16px' }}>
            {events.map((event) => (
              <div
                key={event.id || event._id}
                style={{
                  border: '1px solid #e9ecef',
                  borderRadius: '8px',
                  padding: '20px',
                  transition: 'all 0.2s',
                  background: '#f8f9fa'
                }}
              >
                <h4 style={{ margin: '0 0 8px 0', color: 'var(--brand)', fontSize: '18px' }}>
                  {event.title}
                </h4>
                <p style={{ margin: '0 0 12px 0', color: 'var(--muted)', fontSize: '14px' }}>
                  {event.description}
                </p>
                <div style={{ 
                  fontSize: '13px', 
                  color: 'var(--muted)',
                  display: 'flex',
                  gap: '16px',
                  alignItems: 'center'
                }}>
                  <span>📍 {formatLocationShort(event.location)}</span>
                  <span>🕒 {new Date(event.date).toLocaleString()}</span>
                  {event.capacity && <span>👥 Capacity: {event.capacity}</span>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{
            textAlign: 'center',
            padding: '48px 20px',
            color: 'var(--muted)'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px', opacity: '0.5' }}>
              {icon}
            </div>
            <p style={{ margin: 0, fontSize: '16px' }}>{emptyMessage}</p>
          </div>
        )}
      </div>
    </div>
  );
}