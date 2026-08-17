import React from 'react';
import { useData } from '../context/DataContext';

export const Topbar = () => {
    const { currentUser } = useData();

    return (
        <header style={{
            height: '60px',
            background: '#ffffff',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 24px',
            position: 'sticky',
            top: 0,
            zIndex: 1000,
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
        }}>
            {/* Left Brand / System Title */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #00624F 0%, #00B14F 100%)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 900,
                    fontSize: '20px',
                    boxShadow: '0 2px 6px rgba(0,98,79,0.3)'
                }}>
                    <i className="fa-solid fa-car-side"></i>
                </div>
                <div>
                    <h1 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.3px' }}>
                        GoFleet <span style={{ color: '#00624F' }}>AMS</span>
                    </h1>
                    <p style={{ margin: 0, fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
                        Asset Management System
                    </p>
                </div>
            </div>

            {/* Right User Profile Info (Without Role Switcher & Without Logout) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>
                        {currentUser?.nama_lengkap || 'Administrator System'}
                    </div>
                    <div style={{ fontSize: '11px', color: '#00624F', fontWeight: 700, textTransform: 'uppercase' }}>
                        {currentUser?.role || 'ADMINISTRATOR SYSTEM'}
                    </div>
                </div>

                <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    background: '#dcfce7',
                    color: '#15803d',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '14px',
                    border: '2px solid #bbf7d0'
                }}>
                    {currentUser?.nama_lengkap ? currentUser.nama_lengkap.charAt(0).toUpperCase() : 'A'}
                </div>
            </div>
        </header>
    );
};
