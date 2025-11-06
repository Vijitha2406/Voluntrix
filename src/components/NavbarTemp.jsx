import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";

export default function NavbarTemp({ openModal, drawerOpen, setDrawerOpen, user, onLogout }) {
  const location = useLocation();
  const onDashboard = location.pathname.startsWith("/dashboard");
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [menuOpen]);

  return (
    <nav className="navbar">
      {/* Logo */}
      <div className="nav-left">
        <Link to="/" className="logo">Voluntrix</Link>
      </div>

      {/* Desktop Menu */}
      <div className="nav-right">
        {!user ? (
          <>
            <a href="#features" className="nav-link">Features</a>
            <a href="#how" className="nav-link">How It Works</a>
            <a href="#impact" className="nav-link">Impact</a>
            <button
              className="btn btn-primary"
              onClick={() => openModal('login')}
            >
              Login / Sign Up
            </button>
          </>
        ) : (
          <div className="user-menu" style={{ position: 'relative' }} ref={menuRef}>
            <button 
              className="profile-btn" 
              onClick={() => setMenuOpen(!menuOpen)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                background: 'transparent',
                border: '1px solid var(--ring)',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <div className="profile-avatar" style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--brand), #ff6b6b)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '14px',
                position: 'relative',
                border: '2px solid white',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
              }}>
                {(user?.firstName || user?.name || 'U')[0].toUpperCase()}
                {/* Optional notification badge */}
                {/* <div style={{
                  position: 'absolute',
                  top: '-2px',
                  right: '-2px',
                  width: '8px',
                  height: '8px',
                  background: '#10b981',
                  borderRadius: '50%',
                  border: '2px solid white'
                }}></div> */}
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: '600', fontSize: '14px', color: 'var(--ink)' }}>
                  {user?.firstName || user?.name || 'User'}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--muted)', textTransform: 'capitalize' }}>
                  {user?.role || 'Member'}
                </div>
              </div>
              <span style={{ fontSize: '12px', color: 'var(--muted)' }}>▾</span>
            </button>
            
            {menuOpen && (
              <div className="user-dropdown" style={{ 
                position: 'absolute', 
                right: 0, 
                top: '100%',
                marginTop: '8px',
                background: '#fff', 
                boxShadow: '0 10px 40px rgba(0,0,0,0.15)', 
                borderRadius: '12px', 
                padding: '12px 0',
                minWidth: '200px',
                border: '1px solid var(--ring)',
                zIndex: 1000
              }}>
                {/* User Info Header */}
                <div style={{ 
                  padding: '12px 16px', 
                  borderBottom: '1px solid var(--ring)',
                  marginBottom: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <div className="dropdown-avatar" style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--brand), #ff6b6b)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '18px',
                    border: '3px solid white',
                    boxShadow: '0 2px 12px rgba(0, 0, 0, 0.15)',
                    flexShrink: 0
                  }}>
                    {(user?.firstName || user?.name || 'U')[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '600', color: 'var(--ink)', marginBottom: '2px' }}>
                      {user?.firstName || user?.name}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '4px' }}>
                      {user?.email}
                    </div>
                    <div style={{ 
                      fontSize: '11px', 
                      color: 'var(--brand)', 
                      textTransform: 'uppercase',
                      fontWeight: '600',
                      background: 'var(--brand-light)',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      display: 'inline-block'
                    }}>
                      {user?.role || 'Member'}
                    </div>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="dropdown-menu-items">
                  <Link 
                    to="/dashboard" 
                    onClick={() => setMenuOpen(false)} 
                    className="dropdown-item"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 16px',
                      color: 'var(--ink)',
                      textDecoration: 'none',
                      transition: 'background-color 0.2s'
                    }}
                  >
                    <span style={{ fontSize: '16px' }}>🏠</span>
                    <span>Dashboard</span>
                  </Link>

                  <Link 
                    to="/profile" 
                    onClick={() => setMenuOpen(false)} 
                    className="dropdown-item"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 16px',
                      color: 'var(--ink)',
                      textDecoration: 'none',
                      transition: 'background-color 0.2s'
                    }}
                  >
                    <span style={{ fontSize: '16px' }}>⚙️</span>
                    <span>Profile Settings</span>
                  </Link>

                  <Link 
                    to="/events" 
                    onClick={() => setMenuOpen(false)} 
                    className="dropdown-item"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 16px',
                      color: 'var(--ink)',
                      textDecoration: 'none',
                      transition: 'background-color 0.2s'
                    }}
                  >
                    <span style={{ fontSize: '16px' }}>📅</span>
                    <span>My Events</span>
                  </Link>

                  <Link 
                    to="/recommendations" 
                    onClick={() => setMenuOpen(false)} 
                    className="dropdown-item"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 16px',
                      color: 'var(--ink)',
                      textDecoration: 'none',
                      transition: 'background-color 0.2s'
                    }}
                  >
                    <span style={{ fontSize: '16px' }}>🎯</span>
                    <span>Recommendations</span>
                  </Link>

                  <Link 
                    to="/applications" 
                    onClick={() => setMenuOpen(false)} 
                    className="dropdown-item"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 16px',
                      color: 'var(--ink)',
                      textDecoration: 'none',
                      transition: 'background-color 0.2s'
                    }}
                  >
                    <span style={{ fontSize: '16px' }}>📝</span>
                    <span>My Applications</span>
                  </Link>

                  {(user?.role === 'organizer' || user?.role === 'both') && (
                    <Link 
                      to="/profile?action=create" 
                      onClick={() => setMenuOpen(false)} 
                      className="dropdown-item"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '10px 16px',
                        color: 'var(--ink)',
                        textDecoration: 'none',
                        transition: 'background-color 0.2s'
                      }}
                    >
                      <span style={{ fontSize: '16px' }}>➕</span>
                      <span>Create Event</span>
                    </Link>
                  )}

                  {/* Divider */}
                  <div style={{ 
                    height: '1px', 
                    background: 'var(--ring)', 
                    margin: '8px 16px' 
                  }}></div>

                  <button 
                    className="dropdown-item logout-btn"
                    onClick={() => { 
                      onLogout(); 
                      setMenuOpen(false); 
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 16px',
                      background: 'transparent',
                      border: 'none',
                      color: '#dc2626',
                      textDecoration: 'none',
                      transition: 'background-color 0.2s',
                      width: '100%',
                      textAlign: 'left',
                      cursor: 'pointer'
                    }}
                  >
                    <span style={{ fontSize: '16px' }}>🚪</span>
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mobile Drawer Toggle */}
      <button
        className="menu-toggle"
        onClick={() => setDrawerOpen(!drawerOpen)}
      >
        ☰
      </button>

      {/* Mobile Drawer Menu */}
      {drawerOpen && (
        <div className="mobile-drawer">
          {!user ? (
            <>
              <a href="#features" onClick={() => setDrawerOpen(false)}>Features</a>
              <a href="#how" onClick={() => setDrawerOpen(false)}>How It Works</a>
              <a href="#impact" onClick={() => setDrawerOpen(false)}>Impact</a>
              <button
                className="btn btn-primary"
                onClick={() => {
                  openModal("login");
                  setDrawerOpen(false);
                }}
              >
                Login / Sign Up
              </button>
            </>
          ) : (
            <button
              className="btn btn-danger"
              onClick={() => {
                onLogout();
                setDrawerOpen(false);
              }}
            >
              Logout
            </button>
          )}
        </div>
      )}
    </nav>
  );
}
