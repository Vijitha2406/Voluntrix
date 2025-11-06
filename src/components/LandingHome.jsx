import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { formatLocationShort } from '../utils/formatLocation';

export default function LandingHome({ openModal }) {
  const [featuredEvents, setFeaturedEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';

  useEffect(() => {
    fetchFeaturedEvents();
  }, []);

  const fetchFeaturedEvents = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/events`);
      if (res.ok) {
        const data = await res.json();
        setFeaturedEvents(data.slice(0, 3)); // Get first 3 events for better layout
      }
    } catch (err) {
      console.error('Failed to fetch events:', err);
    } finally {
      setLoading(false);
    }
  };

  // Sample event images (you can replace these with actual uploaded images)
  const eventImages = [
    'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1569019807512-3d7d69d4c3cb?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=400&h=300&fit=crop'
  ];

  return (
    <div className="landing-home">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-text">
            <h1>Connect. Volunteer. Make Impact.</h1>
            <p className="hero-subtitle">
              Join thousands of volunteers making a difference in communities worldwide. 
              Discover meaningful opportunities, track your impact, and connect with like-minded people.
            </p>
            <div className="hero-stats">
              <div className="stat-item">
                <span className="stat-number">5,000+</span>
                <span className="stat-label">Active Volunteers</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">1,200+</span>
                <span className="stat-label">Events Completed</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">25,000+</span>
                <span className="stat-label">Hours Contributed</span>
              </div>
            </div>
            <div className="hero-actions">
              <button className="btn btn-primary btn-large" onClick={() => openModal('signup')}>
                Start Volunteering
              </button>
              <button className="btn btn-ghost btn-large" onClick={() => openModal('login')}>
                I'm an Organizer
              </button>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-image-grid">
              <img src="https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=500&h=600&fit=crop" alt="Volunteers helping" />
              <img src="https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=500&h=300&fit=crop" alt="Community service" />
              <img src="https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=500&h=300&fit=crop" alt="Environmental cleanup" />
            </div>
          </div>
        </div>
      </section>

      {/* Featured Events Section */}
      <section className="featured-events">
        <div className="container">
          <div className="section-header">
            <h2>Featured Volunteer Opportunities</h2>
            <p>Join these upcoming events and make a difference in your community</p>
          </div>
          
          {loading ? (
            <div className="loading-grid">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="event-card-skeleton"></div>
              ))}
            </div>
          ) : (
            <div className="events-grid">
              {featuredEvents.map((event, index) => (
                <div key={event.id || event._id} className="event-card">
                  <div className="event-image">
                    <img 
                      src={eventImages[index % eventImages.length]} 
                      alt={event.title}
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=400&h=300&fit=crop';
                      }}
                    />
                    <div className="event-badge">
                      {new Date(event.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                  <div className="event-content">
                    <h3>{event.title}</h3>
                    <p className="event-description">{event.description}</p>
                    <div className="event-meta">
                      <span className="event-location">📍 {formatLocationShort(event.location) || 'Location TBD'}</span>
                      <span className="event-volunteers">
                        {(event.volunteers || []).length} volunteers joined
                      </span>
                    </div>
                    <button 
                      className="btn btn-outline"
                      onClick={() => openModal('login')}
                    >
                      Join Event
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <div className="section-footer">
            <button className="btn btn-ghost" onClick={() => openModal('login')}>
              View All Events →
            </button>
          </div>
        </div>
      </section>

      {/* Impact Stories Section */}
      <section className="impact-stories-modern">
        <div className="container">
          <div className="section-header-modern">
            <div className="section-badge">
              <span>💫</span>
              <span>Real Impact</span>
            </div>
            <h2>Stories That Inspire Change</h2>
            <p>Hear from volunteers and organizers creating meaningful impact worldwide</p>
          </div>
          
          <div className="stories-grid-modern">
            <div className="story-card-modern featured">
              <div className="story-background">
                <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop&crop=face" alt="Sarah's story" />
                <div className="story-overlay"></div>
              </div>
              <div className="story-content-modern">
                <div className="story-quote">
                  "Volunteering through Voluntrix transformed my perspective on community service. 
                  I've organized 8 beach cleanups and helped protect our marine ecosystem."
                </div>
                <div className="story-author-modern">
                  <div className="author-avatar">
                    <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&h=60&fit=crop&crop=face" alt="Sarah" />
                    <div className="author-badge">🌟</div>
                  </div>
                  <div className="author-info">
                    <div className="author-name">Sarah Johnson</div>
                    <div className="author-role">Environmental Advocate</div>
                    <div className="author-stats">127 hours • 23 events</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="story-card-modern">
              <div className="story-content-modern">
                <div className="story-quote">
                  "As an organizer, Voluntrix streamlined our volunteer management. 
                  We've coordinated 500+ volunteers for disaster relief efforts."
                </div>
                <div className="story-author-modern">
                  <div className="author-avatar">
                    <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=60&h=60&fit=crop&crop=face" alt="Michael" />
                    <div className="author-badge">🎯</div>
                  </div>
                  <div className="author-info">
                    <div className="author-name">Michael Chen</div>
                    <div className="author-role">Disaster Relief Coordinator</div>
                    <div className="author-stats">350 hours • 12 major events</div>
                  </div>
                </div>
              </div>
            </div>
            
          </div>
          
          <div className="impact-metrics">
          </div>
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="final-cta">
        <div className="cta-background">
          <div className="cta-pattern"></div>
          <div className="cta-glow"></div>
        </div>
        
        <div className="container">
          <div className="cta-content-modern">
            <div className="cta-text-section">
              <h2>Ready to Create Impact?</h2>
              <p>
                Join thousands of changemakers who are already making a difference. 
                Start your volunteer journey today and become part of something bigger.
              </p>
              
              <div className="cta-features">
                <div className="feature-item">
                  <div className="feature-icon">⚡</div>
                  <span>Instant matching with local opportunities</span>
                </div>
                <div className="feature-item">
                  <div className="feature-icon">📊</div>
                  <span>Track your impact and growth</span>
                </div>
                <div className="feature-item">
                  <div className="feature-icon">🌟</div>
                  <span>Connect with like-minded volunteers</span>
                </div>
              </div>
              
              <div className="cta-buttons">
                <button className="cta-primary large" onClick={() => openModal('signup')}>
                  <span>Join the Movement</span>
                  <div className="button-shine"></div>
                </button>
                <button className="cta-secondary large" onClick={() => openModal('login')}>
                  <span>Sign In</span>
                </button>
              </div>
              
              <div className="cta-guarantee">
                <div className="guarantee-icon">🛡️</div>
                <span>100% Free Forever • No Hidden Fees • Cancel Anytime</span>
              </div>
            </div>
            
            <div className="cta-visual-section">
              <div className="cta-image-container">
                <img src="https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=500&h=600&fit=crop" alt="Volunteers celebrating" />
                <div className="floating-element element-1">
                  <div className="element-content">
                    <span className="element-icon">🎉</span>
                    <span className="element-text">New Event!</span>
                  </div>
                </div>
                <div className="floating-element element-2">
                  <div className="element-content">
                    <span className="element-icon">👥</span>
                    <span className="element-text">+15 Joined</span>
                  </div>
                </div>
                <div className="floating-element element-3">
                  <div className="element-content">
                    <span className="element-icon">⭐</span>
                    <span className="element-text">Impact +50</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}