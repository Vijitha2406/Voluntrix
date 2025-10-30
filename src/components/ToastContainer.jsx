    import React from 'react';

    export default function ToastContainer({ toasts }) {
    return (
        <>
        {toasts.map(t => (
            <div key={t.id} className={`toast ${t.type} show`}>{t.message}</div>
        ))}
        </>
    );
    }
