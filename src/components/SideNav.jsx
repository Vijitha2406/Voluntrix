import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function SideNav() {
  const location = useLocation();
  
  const navItems = [
    { path: '/dashboard', label: 'Home', icon: '🏠' },
    { path: '/events', label: 'Events', icon: '📅' },
    { path: '/recommendations', label: 'Recommendations', icon: '🎯' },
    { path: '/applications', label: 'My Applications', icon: '📝' },
    { path: '/calendar', label: 'Calendar', icon: '🗓️' },
    { path: '/impact', label: 'Impact Report', icon: '📊' },
    { path: '/profile', label: 'Profile', icon: '👤' },
    { path: '/about', label: 'About Us', icon: 'ℹ️' }
  ];

  return (
    <aside className="side-nav" style={{
      position: 'fixed',
      left: 0,
      top: 70, 
      bottom: 0,
      width: 220,
      background: '#fff',
      borderRight: '1px solid #e9ecef',
      padding: '20px 0',
      zIndex: 90,
      boxShadow: '2px 0 10px rgba(0,0,0,0.05)'
    }}>
      <nav style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%'
      }}>
        <div style={{ padding: '0 20px' }}>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link 
                key={item.path}
                to={item.path} 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  marginBottom: '8px',
                  borderRadius: '8px',
                  color: isActive ? '#fff' : '#1a1a1a',
                  backgroundColor: isActive ? 'var(--brand)' : 'transparent',
                  textDecoration: 'none',
                  transition: 'all 0.2s',
                  fontSize: '15px',
                  fontWeight: isActive ? 600 : 500
                }}
                className="nav-link"
              >
                <span style={{ fontSize: '16px' }}>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </div>
        
        {/* Footer */}
        <div style={{ 
          marginTop: 'auto', 
          padding: '20px', 
          borderTop: '1px solid #e9ecef',
          fontSize: '12px',
          color: '#6b7280'
        }}>
          <p style={{ margin: 0, textAlign: 'center' }}>
            Voluntrix v1.0
          </p>
        </div>
      </nav>
    </aside>
  );
}