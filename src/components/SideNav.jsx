import React from 'react';
import { Link } from 'react-router-dom';

export default function SideNav() {
  return (
    <aside className="side-nav" style={{
      position: 'fixed',
      left: 0,
      top: 70, 
      bottom: 0,
      width: 220,
      background: '#f8f9fa',
      borderRight: '1px solid #e9ecef',
      padding: '20px 0',
      zIndex: 90
    }}>
      <nav style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%'
      }}>
        <div style={{ padding: '0 20px' }}>
          <Link 
            to="/events" 
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '12px 16px',
              marginBottom: '8px',
              borderRadius: '8px',
              color: '#1a1a1a',
              textDecoration: 'none',
              transition: 'all 0.2s',
              fontSize: '15px',
              fontWeight: 500
            }}
            className="nav-link"
          >
            Events
          </Link>
          <Link 
            to="/calendar" 
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '12px 16px',
              marginBottom: '8px',
              borderRadius: '8px',
              color: '#1a1a1a',
              textDecoration: 'none',
              transition: 'all 0.2s',
              fontSize: '15px',
              fontWeight: 500
            }}
            className="nav-link"
          >
            Calendar
          </Link>
          <Link 
            to="/about" 
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '12px 16px',
              marginBottom: '8px',
              borderRadius: '8px',
              color: '#1a1a1a',
              textDecoration: 'none',
              transition: 'all 0.2s',
              fontSize: '15px',
              fontWeight: 500
            }}
            className="nav-link"
          >
            About Us
          </Link>
        </div>
      </nav>
    </aside>
  );
}