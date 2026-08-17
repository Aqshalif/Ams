import React from 'react';
import { useData } from '../context/DataContext';

export default function ToastContainer() {
    const { toasts } = useData();

    if (!toasts || toasts.length === 0) return null;

    return (
        <div style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            maxWidth: '350px'
        }}>
            {toasts.map(t => {
                const bg = t.type === 'success' ? '#16a34a' : (t.type === 'danger' ? '#dc2626' : '#0288d1');
                const icon = t.type === 'success' ? 'fa-check-circle' : (t.type === 'danger' ? 'fa-triangle-exclamation' : 'fa-circle-info');
                return (
                    <div key={t.id} style={{
                        background: bg,
                        color: '#fff',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        fontSize: '13px',
                        fontWeight: '600',
                        animation: 'fadeIn 0.3s ease'
                    }}>
                        <i className={`fa-solid ${icon} fs-5`}></i>
                        <span>{t.message}</span>
                    </div>
                );
            })}
        </div>
    );
}
