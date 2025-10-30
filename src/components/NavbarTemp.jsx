import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";

export default function NavbarTemp({ openModal, drawerOpen, setDrawerOpen, user, onLogout }) {
  const location = useLocation();
  const onDashboard = location.pathname.startsWith("/dashboard");
  const [menuOpen, setMenuOpen] = useState(false);

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
            <a href="#how-it-works" className="nav-link">How It Works</a>
            <a href="#impact" className="nav-link">Impact</a>
            <button
              className="btn btn-primary login-btn"
              onClick={() => openModal(openModal)}
            >
            Login / Signup
            </button>
          </>
        ) : (
          <div className="user-menu" style={{ position: 'relative' }}>
            <button className="btn btn-secondary" onClick={() => setMenuOpen(!menuOpen)}>
              {user?.firstName || user?.name || 'User'} ▾
            </button>
            {menuOpen && (
              <div className="user-dropdown" style={{ position: 'absolute', right: 0, background: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', borderRadius: 6, padding: 8 }}>
                <div style={{ padding: '6px 8px', borderBottom: '1px solid #eee' }}>
                  <strong>{user?.firstName || user?.name}</strong>
                  <div style={{ fontSize: 12, color: '#666' }}>{user?.role || 'N/A'}</div>
                </div>
                <div style={{ padding: '8px 4px' }}>
                  <Link to="/dashboard" onClick={() => setMenuOpen(false)} className="dropdown-link">Dashboard</Link>
                </div>
                <div style={{ padding: '8px 4px' }}>
                  <button className="btn" onClick={() => { onLogout(); setMenuOpen(false); }}>Logout</button>
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
              <a href="#how-it-works" onClick={() => setDrawerOpen(false)}>How It Works</a>
              <a href="#impact" onClick={() => setDrawerOpen(false)}>Impact</a>
              <button
                className="btn btn-primary"
                onClick={() => {
                  openModal("login");
                  setDrawerOpen(false);
                }}
              >
                Login / Signup
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
