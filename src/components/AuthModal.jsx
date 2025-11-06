    // AuthModal.jsx
    import React, { useState } from "react";
    import { useNavigate } from "react-router-dom";

export default function AuthModal({ formType, setFormType, closeModal, showToast, onLogin }) {
    const [formData, setFormData] = useState({});
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';

    // Toggle password visibility
    const togglePassword = (e) => {
        const input = e.target.parentElement.querySelector("input");
        if (!input) return;
        input.type = input.type === "password" ? "text" : "password";
    };

    // Handle form input changes
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    // Input validation
    const validateField = (id, value) => {
        if (!value) return "This field is required";
        if (id.includes("email")) {
        const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        if (!ok) return "Please enter a valid email";
        }
        if (id === "signup-password" && value.length < 8)
        return "Password must be at least 8 characters";
        return "";
    };

    // Form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        const errors = Object.entries(formData)
        .map(([id, value]) => validateField(id, value))
        .filter(Boolean);

        if (errors.length) return showToast(errors[0], "error");

        // Check role selection for signup
        if (formType === "signup" && !formData["signup-role"]) {
        return showToast("Please select a role to continue", "error");
        }

        try {
            setLoading(true);

            if (formType === 'login') {
                const res = await fetch(`${API_BASE}/api/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: formData['login-email'], password: formData['login-password'] }),
                });
                let data = null;
                try { data = await res.json(); } catch (err) { data = null; }
                setLoading(false);
                if (!res.ok) return showToast(data?.message || `Login failed (${res.status})`, 'error');

                // store token and user
                localStorage.setItem('voluntrix_token', data.token);
                localStorage.setItem('voluntrix_user', JSON.stringify(data.user));
                onLogin(data.user, data.token);
                showToast('Welcome back! Redirecting…', 'success');
                closeModal();
                navigate('/dashboard');
            } else if (formType === 'signup') {
                const res = await fetch(`${API_BASE}/api/auth/signup`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        firstName: formData['signup-firstname'],
                        lastName: formData['signup-lastname'],
                        email: formData['signup-email'],
                        password: formData['signup-password'],
                        role: formData['signup-role'],
                    }),
                });
                let data = null;
                try { data = await res.json(); } catch (err) { data = null; }
                setLoading(false);
                if (!res.ok) return showToast(data?.message || `Signup failed (${res.status})`, 'error');

                // After signup, redirect user to the login form (do not auto-login)
                showToast('Account created! Please login to continue.', 'success');
                // prefill login email for convenience
                setFormData({ ['login-email']: formData['signup-email'] || '', ['login-password']: '' });
                setFormType('login');
            }
        } catch (err) {
            setLoading(false);
            console.error(err);
            showToast('Network error', 'error');
        }
    };

    return (
        <div className="modal show" onClick={(e) => e.target === e.currentTarget && closeModal()}>
        <div className="modal-dialog">
            <button className="modal-close" onClick={closeModal}>×</button>

            {/* Toggle Login/Signup */}
            <div className="form-toggle">
            <button
                className={`toggle-btn ${formType === "login" ? "active" : ""}`}
                onClick={() => setFormType("login")}
            >
                Login
            </button>
            <button
                className={`toggle-btn ${formType === "signup" ? "active" : ""}`}
                onClick={() => setFormType("signup")}
            >
                Signup
            </button>
            <div className={`toggle-indicator ${formType === "signup" ? "slide-right" : ""}`}></div>
            </div>

            {/* Login Form */}
            {formType === "login" && (
            <form className="auth-form" onSubmit={handleSubmit}>
                <div className="form-group">
                <input
                    type="email"
                    id="login-email"
                    placeholder="Email address"
                    onChange={handleChange}
                    required
                />
                <label htmlFor="login-email">Email address</label>
                </div>

                <div className="form-group">
                <input
                    type="password"
                    id="login-password"
                    placeholder="Password"
                    onChange={handleChange}
                    required
                />
                <label htmlFor="login-password">Password</label>
                <button type="button" className="password-toggle" onClick={togglePassword}>👁</button>
                </div>

                <button
                className={`btn btn-primary submit-btn ${loading ? "loading" : ""}`}
                type="submit"
                >
                Log in
                </button>
            </form>
            )}

            {/* Signup Form */}
            {formType === "signup" && (
            <form className="auth-form" onSubmit={handleSubmit}>
                <div className="form-row">
                <div className="form-group">
                    <input
                    type="text"
                    id="signup-firstname"
                    placeholder="First name"
                    onChange={handleChange}
                    required
                    />
                    <label htmlFor="signup-firstname">First name</label>
                </div>
                <div className="form-group">
                    <input
                    type="text"
                    id="signup-lastname"
                    placeholder="Last name"
                    onChange={handleChange}
                    required
                    />
                    <label htmlFor="signup-lastname">Last name</label>
                </div>
                </div>

                <div className="form-group">
                <input
                    type="email"
                    id="signup-email"
                    placeholder="Email"
                    onChange={handleChange}
                    required
                />
                <label htmlFor="signup-email">Email address</label>
                </div>

                <div className="form-group">
                <input
                    type="password"
                    id="signup-password"
                    placeholder="Password"
                    onChange={handleChange}
                    required
                />
                <label htmlFor="signup-password">Password</label>
                <button type="button" className="password-toggle" onClick={togglePassword}>👁</button>
                </div>

                <div className="form-group">
                <select id="signup-role" onChange={handleChange} required>
                    <option value="">Select your role</option>
                    <option value="volunteer">Volunteer</option>
                    <option value="organizer">Event Organizer</option>
                    <option value="both">Both</option>
                </select>
                <label htmlFor="signup-role">I want to join as</label>
                </div>

                <div className="form-options">
                <label className="checkbox">
                    <input type="checkbox" id="terms-agreement" required />
                    <span className="checkmark"></span> I agree to the Terms and Privacy
                </label>
                </div>

                <button
                className={`btn btn-primary submit-btn ${loading ? "loading" : ""}`}
                type="submit"
                >
                Create account
                </button>
            </form>
            )}
        </div>
        </div>
    );
    }
