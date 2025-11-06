import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// Components
import Navbar from "./components/NavbarTemp";
import LandingHome from "./components/LandingHome";
import Hero from "./components/HeroTemp";
import Features from "./components/Features";
import HowItWorks from "./components/HowItWorks";
import Impact from "./components/Impact";
import CTA from "./components/CTA";
import Footer from "./components/FooterTemp";
import AuthModal from "./components/AuthModal";
import ToastContainer from "./components/ToastContainer";
import HomePage from "./components/HomePage";
import Profile from "./components/Profile";
import Events from "./components/Events";
import SideNav from "./components/SideNav";
import ImpactReport from "./components/ImpactReport";

import RecommendationsPage from "./components/RecommendationsPage";
import MyApplicationsPage from "./components/MyApplicationsPage";

// Pages
import EventsPage from "./pages/EventsPage";
import CalendarPage from "./pages/CalendarPage";
import AboutPage from "./pages/AboutPage";

import "./index.css";

function App() {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalForm, setModalForm] = useState("login");
  const [toasts, setToasts] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("voluntrix_user")) || null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem("voluntrix_token") || null);

  const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

  // Validate token on app load
  useEffect(() => {
    const validateToken = async () => {
      if (!token) return;
      try {
        const res = await fetch(`${API_BASE}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.status === 401) {
          console.warn("Invalid or expired token. Logging out...");
          handleLogout();
          return;
        }

        if (!res.ok) throw new Error("Failed to validate token");
        const data = await res.json();
        setUser(data);
      } catch (err) {
        console.error("Token validation error:", err);
        handleLogout();
      }
    };

    validateToken();
  }, [token]);

  // Toast handler
  const showToast = (message, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3800);
  };

  // Auth handlers
  const openModal = (form) => {
    setModalForm(form);
    setModalOpen(true);
  };
  const closeModal = () => setModalOpen(false);

  const handleLogin = (userData, jwt) => {
    if (!jwt) {
      showToast("Login failed: Missing token", "error");
      return;
    }
    setUser(userData);
    setToken(jwt);
    localStorage.setItem("voluntrix_user", JSON.stringify(userData));
    localStorage.setItem("voluntrix_token", jwt);
    setModalOpen(false);
    showToast(`Welcome back, ${userData?.name || "User"}!`, "success");
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("voluntrix_user");
    localStorage.removeItem("voluntrix_token");
    showToast("You’ve been logged out successfully.", "info");
  };

  return (
    <Router>
      {/* Navbar always visible */}
      <Navbar
        openModal={openModal}
        drawerOpen={drawerOpen}
        setDrawerOpen={setDrawerOpen}
        user={user}
        onLogout={handleLogout}
      />

      <Routes>
        {/* Public Landing Page */}
        <Route
          path="/"
          element={
            !user ? (
              <>
                <LandingHome openModal={openModal} />
                <Features />
                <HowItWorks />
                <Impact />
                <CTA openModal={openModal} />
                <Footer />
              </>
            ) : (
              <Navigate to="/dashboard" />
            )
          }
        />

        {/* Protected Route */}
        <Route
          path="/dashboard"
          element={
            user ? (
              <div style={{ display: "flex" }}>
                <SideNav />
                <div style={{ flex: 1, marginLeft: 220 }}>
                  <HomePage
                    user={user}
                    token={token}
                    setUser={setUser}
                    showToast={showToast}
                  />
                </div>
              </div>
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        {/* Public Pages - only show SideNav when logged in */}
        <Route 
          path="/events" 
          element={
            user ? (
              <div style={{ display: "flex" }}>
                <SideNav />
                <div style={{ flex: 1, marginLeft: 220 }}>
                  <EventsPage showToast={showToast} />
                </div>
              </div>
            ) : (
              <EventsPage showToast={showToast} />
            )
          } 
        />
        <Route 
          path="/calendar" 
          element={
            user ? (
              <div style={{ display: "flex" }}>
                <SideNav />
                <div style={{ flex: 1, marginLeft: 220 }}>
                  <CalendarPage />
                </div>
              </div>
            ) : (
              <CalendarPage />
            )
          } 
        />
        <Route 
          path="/about" 
          element={
            user ? (
              <div style={{ display: "flex" }}>
                <SideNav />
                <div style={{ flex: 1, marginLeft: 220 }}>
                  <AboutPage />
                </div>
              </div>
            ) : (
              <AboutPage />
            )
          } 
        />

        {/* Impact Report Route */}
        <Route 
          path="/impact" 
          element={
            user ? (
              <div style={{ display: "flex" }}>
                <SideNav />
                <div style={{ flex: 1, marginLeft: 220, padding: "20px" }}>
                  <ImpactReport user={user} token={token} />
                </div>
              </div>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />

        {/* Recommendations Route */}
        <Route 
          path="/recommendations" 
          element={
            user ? (
              <div style={{ display: "flex" }}>
                <SideNav />
                <div style={{ flex: 1, marginLeft: 220 }}>
                  <RecommendationsPage />
                </div>
              </div>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />

        {/* Applications Route */}
        <Route 
          path="/applications" 
          element={
            user ? (
              <div style={{ display: "flex" }}>
                <SideNav />
                <div style={{ flex: 1, marginLeft: 220 }}>
                  <MyApplicationsPage />
                </div>
              </div>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />

        {/* Profile Route (with profile management and events) */}
        <Route
          path="/profile"
          element={
            user ? (
              <div style={{ display: "flex" }}>
                <SideNav />
                <div style={{ flex: 1, marginLeft: 220 }}>
                  <Profile
                    user={user}
                    token={token}
                    setUser={setUser}
                    showToast={showToast}
                  />
                </div>
              </div>
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to={user ? "/dashboard" : "/"} replace />} />
      </Routes>

      {/* Authentication Modal */}
      {modalOpen && (
        <AuthModal
          formType={modalForm}
          setFormType={setModalForm}
          closeModal={closeModal}
          showToast={showToast}
          onLogin={handleLogin}
        />
      )}

      {/* Toast Container */}
      <ToastContainer toasts={toasts} />
    </Router>
  );
}

export default App;
