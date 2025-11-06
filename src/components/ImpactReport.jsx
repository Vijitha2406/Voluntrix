import React, { useState, useEffect } from 'react';

export default function ImpactReport({ user, token }) {
  const [impactData, setImpactData] = useState({
    totalHours: 0,
    eventsJoined: 0,
    eventsCreated: 0,
    communitiesHelped: 0,
    badges: [],
    monthlyProgress: [],
    categoryBreakdown: []
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('year'); // year, month, all

  const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';

  useEffect(() => {
    fetchImpactData();
  }, [token, timeRange]);

  const fetchImpactData = async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      
      // Fetch user's events
      const eventsRes = await fetch(`${API_BASE}/api/events/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (eventsRes.ok) {
        const eventsData = await eventsRes.json();
        
        // Calculate impact metrics
        const joined = eventsData.joined || [];
        const created = eventsData.created || [];
        
        // Estimate hours (4 hours per event average)
        const totalHours = joined.length * 4;
        
        // Calculate monthly progress for the last 6 months
        const monthlyData = calculateMonthlyProgress(joined);
        
        // Category breakdown
        const categoryData = calculateCategoryBreakdown([...joined, ...created]);
        
        // Generate badges based on achievements
        const badges = generateBadges({
          totalHours,
          eventsJoined: joined.length,
          eventsCreated: created.length
        });

        setImpactData({
          totalHours,
          eventsJoined: joined.length,
          eventsCreated: created.length,
          communitiesHelped: Math.ceil(totalHours / 10), // Estimate communities helped
          badges,
          monthlyProgress: monthlyData,
          categoryBreakdown: categoryData
        });
      }
    } catch (err) {
      console.error('Failed to fetch impact data:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateMonthlyProgress = (events) => {
    const months = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEvents = events.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate.getMonth() === month.getMonth() && 
               eventDate.getFullYear() === month.getFullYear() &&
               eventDate <= now;
      });
      
      months.push({
        month: month.toLocaleDateString('en', { month: 'short' }),
        events: monthEvents.length,
        hours: monthEvents.length * 4
      });
    }
    
    return months;
  };

  const calculateCategoryBreakdown = (events) => {
    const categories = {
      'Environment': 0,
      'Community': 0,
      'Education': 0,
      'Health': 0,
      'Other': 0
    };

    events.forEach(event => {
      // Simple categorization based on title/description keywords
      const text = `${event.title} ${event.description}`.toLowerCase();
      
      if (text.includes('environment') || text.includes('cleanup') || text.includes('green')) {
        categories['Environment']++;
      } else if (text.includes('education') || text.includes('teach') || text.includes('school')) {
        categories['Education']++;
      } else if (text.includes('health') || text.includes('medical') || text.includes('wellness')) {
        categories['Health']++;
      } else if (text.includes('community') || text.includes('food') || text.includes('shelter')) {
        categories['Community']++;
      } else {
        categories['Other']++;
      }
    });

    return Object.entries(categories).map(([name, count]) => ({
      name,
      count,
      percentage: events.length ? Math.round((count / events.length) * 100) : 0
    }));
  };

  const generateBadges = ({ totalHours, eventsJoined, eventsCreated }) => {
    const badges = [];

    // Hour-based badges
    if (totalHours >= 100) badges.push({ name: 'Century Volunteer', icon: '🏆', description: '100+ hours volunteered' });
    else if (totalHours >= 50) badges.push({ name: 'Dedicated Helper', icon: '🥇', description: '50+ hours volunteered' });
    else if (totalHours >= 20) badges.push({ name: 'Community Champion', icon: '🥈', description: '20+ hours volunteered' });
    else if (totalHours >= 5) badges.push({ name: 'Getting Started', icon: '🥉', description: '5+ hours volunteered' });

    // Event-based badges
    if (eventsJoined >= 20) badges.push({ name: 'Event Master', icon: '🎯', description: '20+ events joined' });
    else if (eventsJoined >= 10) badges.push({ name: 'Active Volunteer', icon: '⭐', description: '10+ events joined' });
    else if (eventsJoined >= 5) badges.push({ name: 'Team Player', icon: '🤝', description: '5+ events joined' });

    // Organizer badges
    if (eventsCreated >= 10) badges.push({ name: 'Event Creator', icon: '🚀', description: '10+ events organized' });
    else if (eventsCreated >= 5) badges.push({ name: 'Community Leader', icon: '👑', description: '5+ events organized' });
    else if (eventsCreated >= 1) badges.push({ name: 'First Organizer', icon: '🌟', description: 'First event organized' });

    return badges;
  };

  if (loading) {
    return (
      <div className="impact-report loading">
        <div className="loading-spinner"></div>
        <p>Generating your impact report...</p>
      </div>
    );
  }

  return (
    <div className="impact-report">
      <div className="impact-header">
        <h2>Your Impact Report</h2>
        <p>See the difference you're making in your community</p>
        <div className="time-filter">
          <button 
            className={timeRange === 'month' ? 'active' : ''}
            onClick={() => setTimeRange('month')}
          >
            This Month
          </button>
          <button 
            className={timeRange === 'year' ? 'active' : ''}
            onClick={() => setTimeRange('year')}
          >
            This Year
          </button>
          <button 
            className={timeRange === 'all' ? 'active' : ''}
            onClick={() => setTimeRange('all')}
          >
            All Time
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="impact-metrics">
        <div className="metric-card primary">
          <div className="metric-icon">⏰</div>
          <div className="metric-content">
            <h3>{impactData.totalHours}</h3>
            <p>Hours Contributed</p>
          </div>
        </div>
        
        <div className="metric-card">
          <div className="metric-icon">🎯</div>
          <div className="metric-content">
            <h3>{impactData.eventsJoined}</h3>
            <p>Events Joined</p>
          </div>
        </div>
        
        <div className="metric-card">
          <div className="metric-icon">🌍</div>
          <div className="metric-content">
            <h3>{impactData.communitiesHelped}</h3>
            <p>Communities Helped</p>
          </div>
        </div>
        
        {(user?.role === 'organizer' || user?.role === 'both') && (
          <div className="metric-card">
            <div className="metric-icon">🚀</div>
            <div className="metric-content">
              <h3>{impactData.eventsCreated}</h3>
              <p>Events Organized</p>
            </div>
          </div>
        )}
      </div>

      {/* Monthly Progress Chart */}
      <div className="progress-section">
        <h3>Monthly Activity</h3>
        <div className="progress-chart">
          {impactData.monthlyProgress.map((month, index) => (
            <div key={index} className="month-bar">
              <div 
                className="bar" 
                style={{ 
                  height: `${Math.max(20, (month.hours / Math.max(...impactData.monthlyProgress.map(m => m.hours)) || 1) * 100)}px` 
                }}
              ></div>
              <span className="month-label">{month.month}</span>
              <span className="month-value">{month.hours}h</span>
            </div>
          ))}
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="category-section">
        <h3>Impact by Category</h3>
        <div className="category-breakdown">
          {impactData.categoryBreakdown.map((category, index) => (
            <div key={index} className="category-item">
              <div className="category-info">
                <span className="category-name">{category.name}</span>
                <span className="category-count">{category.count} events</span>
              </div>
              <div className="category-bar">
                <div 
                  className="category-progress" 
                  style={{ width: `${category.percentage}%` }}
                ></div>
              </div>
              <span className="category-percentage">{category.percentage}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Badges & Achievements */}
      <div className="badges-section">
        <h3>Achievements & Badges</h3>
        <div className="badges-grid">
          {impactData.badges.map((badge, index) => (
            <div key={index} className="badge-card">
              <div className="badge-icon">{badge.icon}</div>
              <h4>{badge.name}</h4>
              <p>{badge.description}</p>
            </div>
          ))}
          
          {impactData.badges.length === 0 && (
            <div className="no-badges">
              <p>🌟 Start volunteering to earn your first badge!</p>
            </div>
          )}
        </div>
      </div>

      {/* Impact Statement */}
      <div className="impact-statement">
        <h3>Your Impact Story</h3>
        <div className="impact-story">
          <p>
            <strong>{user?.firstName || 'You'}</strong> have contributed{' '}
            <strong>{impactData.totalHours} hours</strong> of volunteer work,
            participating in <strong>{impactData.eventsJoined} events</strong> and 
            helping <strong>{impactData.communitiesHelped} communities</strong>.
            {impactData.eventsCreated > 0 && (
              <> You've also organized <strong>{impactData.eventsCreated} events</strong>, 
              creating opportunities for others to get involved.</>
            )}
          </p>
          <p>
            Your dedication is making a real difference! Keep up the amazing work 
            and inspire others to join the volunteer movement. 🌟
          </p>
        </div>
      </div>
    </div>
  );
}