    import React from 'react';

    export default function HowItWorks() {
    const steps = [
        { title: 'Create your profile', desc: 'Tell us your skills, availability, and causes you care about.' },
        { title: 'Find & join events', desc: 'Search or get matched to nearby opportunities. Apply in a click.' },
        { title: 'Volunteer & track', desc: 'Check in, log hours automatically, and collect badges & certificates.' },
    ];

    return (
        <section id="how" className="section alt">
        <div className="section-head">
            <h2>How it works</h2>
            <p>Three simple steps to start making an impact.</p>
        </div>
        <ol className="steps">
            {steps.map((s, i) => (
            <li key={i}>
                <span className="step-num">{i + 1}</span>
                <h4>{s.title}</h4>
                <p>{s.desc}</p>
            </li>
            ))}
        </ol>
        </section>
    );
    }
