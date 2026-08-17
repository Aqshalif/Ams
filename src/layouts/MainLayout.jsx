import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { Topbar } from '../components/Topbar';
import { Sidebar } from '../components/Sidebar';
import ToastContainer from '../components/ToastContainer';

export default function MainLayout({ topTitle }) {
    const { currentUser } = useData();

    if (!currentUser) {
        return <Navigate to="/login" replace />;
    }

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>
            <Topbar topTitle={topTitle} />

            <div style={{ display: 'flex', flex: 1 }}>
                <Sidebar />

                <main id="main" style={{ flex: 1, padding: '24px 28px', minWidth: 0 }}>
                    <div id="content">
                        <Outlet />
                    </div>
                </main>
            </div>

            <ToastContainer />
        </div>
    );
}
