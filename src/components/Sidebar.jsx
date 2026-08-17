import React from 'react';
import { NavLink } from 'react-router-dom';
import { useData } from '../context/DataContext';

export const Sidebar = () => {
    const { modules, checkPermission } = useData();

    const activeModules = modules.filter(m => m.status === 'Aktif');
    const topModules = activeModules.filter(m => (m.position || 'top') === 'top');
    const bottomModules = activeModules.filter(m => m.position === 'bottom');

    const renderLink = (m) => {
        const canView = checkPermission(m.key, 'view');
        if (!canView) return null;

        const targetPath = m.is_system ? (m.page === 'index.html' || m.page === 'dashboard' ? '/' : `/${m.key}`) : `/dynamic/${m.key}`;

        return (
            <NavLink
                key={m.modul_id}
                to={targetPath}
                className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
                style={({ isActive }) => ({
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 16px',
                    color: isActive ? '#00624F' : '#334155',
                    background: isActive ? '#e6f4f1' : 'transparent',
                    borderLeft: isActive ? '4px solid #00624F' : '4px solid transparent',
                    textDecoration: 'none',
                    fontSize: '13px',
                    fontWeight: isActive ? 800 : 600,
                    transition: 'all 0.2s ease'
                })}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <i className={m.icon || 'fa-solid fa-cube'} style={{ width: '16px', textAlign: 'center', color: '#00624F' }}></i>
                    <span>{m.key === 'penghapusan' ? 'Penghapusan' : m.label}</span>
                </div>
                {m.badge && m.badge !== 'REACT' && (
                    <span style={{
                        fontSize: '9px',
                        background: '#00624F',
                        color: '#fff',
                        padding: '2px 5px',
                        borderRadius: '4px',
                        fontWeight: 700
                    }}>
                        {m.badge}
                    </span>
                )}
            </NavLink>
        );
    };

    return (
        <aside className="sidebar" style={{
            width: '240px',
            background: '#fff',
            borderRight: '1px solid #cbd5e1',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
        }}>
            <div style={{ padding: '12px 0' }}>
                <div style={{ padding: '4px 16px 8px 16px', fontSize: '10px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Operasional Modul
                </div>
                {topModules.map(renderLink)}
                
                <NavLink
                    to="/analisis-kelayakan"
                    className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
                    style={({ isActive }) => ({
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 16px',
                        color: isActive ? '#00624F' : '#334155',
                        background: isActive ? '#e6f4f1' : 'transparent',
                        borderLeft: isActive ? '4px solid #00624F' : '4px solid transparent',
                        textDecoration: 'none',
                        fontSize: '13px',
                        fontWeight: isActive ? 800 : 600,
                        transition: 'all 0.2s ease'
                    })}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <i className="fa-solid fa-chart-pie" style={{ width: '16px', textAlign: 'center', color: '#00624F' }}></i>
                        <span>Analisis Kelayakan</span>
                    </div>
                    <span style={{
                        fontSize: '9px',
                        background: '#00624F',
                        color: '#fff',
                        padding: '2px 5px',
                        borderRadius: '4px',
                        fontWeight: 700
                    }}>
                        AI
                    </span>
                </NavLink>
            </div>

            <div style={{ borderTop: '1px solid #f1f5f9', padding: '12px 0 20px 0' }}>
                <div style={{ padding: '4px 16px 8px 16px', fontSize: '10px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Admin System & Security
                </div>
                {bottomModules.map(renderLink)}
            </div>
        </aside>
    );
};
