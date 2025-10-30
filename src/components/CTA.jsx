    import React from 'react';

    export default function CTA({ openModal }) {
    return (
        <section className="cta">
        <h2>Ready to start making a difference?</h2>
        <p>Join Voluntrix today — it’s free and only takes a minute.</p>
        <button className="btn btn-primary" onClick={() => openModal('signup')}>Create your account</button>
        </section>
    );
    }
