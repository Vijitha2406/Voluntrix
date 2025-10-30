import React from 'react';

export default function Hero({ openModal }) {
  return (
    <section className="hero">
      <div className="hero-content">
        <h1>Where volunteers meet meaningful opportunities</h1>
        <p>Discover causes that match your passion and skills. Join events, track hours, earn badges, and grow your impact — all in one place.</p>
        <div className="hero-actions">
          <a className="btn btn-ghost" href="#features">Learn more</a>
        </div>
        <ul className="trust-bullets" role="list">
          <li>No credit card required</li>
          <li>Secure & private</li>
          <li>For volunteers & organizers</li>
        </ul>
      </div>
      <div className="hero-visual" aria-hidden="true">
        <div className="card-mock">
          <div className="card-header">Upcoming Event</div>
          <div className="card-body">
            <div className="pill">Community • Environment</div>
            <h3>Beach Cleanup Drive</h3>
            <p>Sat, 8:00 AM · Marina</p>
            <div className="progress">
              <div className="bar" style={{ width: '72%' }}></div>
            </div>
            <small>36 / 50 volunteers</small>
          </div>
          <div className="card-footer">
            <button className="btn btn-light" onClick={() => openModal('login')}>Volunteer</button>
          </div>
        </div>
      </div>
    </section>
  );
}
