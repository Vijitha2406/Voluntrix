    import React from 'react';

    export default function Features() {
    const features = [
        { title: 'Smart Matching', desc: 'Personalized opportunities based on your interests, skills, and location.' },
        { title: 'Event Management', desc: 'Create events, manage capacity & check-ins, and message volunteers with ease.' },
        { title: 'Impact Tracking', desc: 'Auto-log hours, issue digital certificates, and earn badges for milestones.' },
        { title: 'Community & Recognition', desc: 'Leaderboards, feedback, and highlights to celebrate your contributions.' },
    ];

    return (
        <section id="features" className="section">
        <div className="section-head">
            <h2>Built to help you help others</h2>
            <p>Everything you need to find events, manage signups, and recognize impact.</p>
        </div>
        <div className="grid features-grid">
            {features.map((f, i) => (
            <article key={i} className="feature">
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
            </article>
            ))}
        </div>
        </section>
    );
    }
