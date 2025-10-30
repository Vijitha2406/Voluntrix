    import React, { useEffect, useRef } from 'react';

    export default function Impact() {
    const countersRef = useRef([]);

    useEffect(() => {
        const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
            countersRef.current.forEach(el => {
                const target = Number(el.dataset.count);
                let start = 0;
                const duration = 1600;
                const step = (timestamp) => {
                const progress = Math.min(1, (timestamp - start) / duration);
                el.textContent = Math.floor(target * (0.5 - Math.cos(Math.PI * progress) / 2)).toLocaleString();
                if (progress < 1) requestAnimationFrame(step);
                else el.textContent = target.toLocaleString();
                };
                requestAnimationFrame(step);
            });
            observer.disconnect();
            }
        });
        }, { threshold: 0.3 });
        observer.observe(document.getElementById('impact'));
    }, []);

    const stats = [
        { label: 'Volunteers Joined', count: 5000 },
        { label: 'Events Organized', count: 1200 },
        { label: 'Hours Contributed', count: 25000 },
    ];

    return (
        <section id="impact" className="section">
        <div className="section-head">
            <h2>Our growing impact</h2>
            <p>Numbers that showcase the power of community.</p>
        </div>
        <div className="stats">
            {stats.map((s, i) => (
            <div className="stat" key={i}>
                <span className="stat-number" data-count={s.count} ref={el => countersRef.current[i] = el}>0</span>
                <span className="stat-label">{s.label}</span>
            </div>
            ))}
        </div>
        </section>
    );
    }
