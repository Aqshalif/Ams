import React from 'react';
import { Topbar } from './Topbar';
import { Sidebar } from './Sidebar';

export const Layout = ({ children }) => {
    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Topbar />
            <div style={{ display: 'flex', flex: 1 }}>
                <Sidebar />
                <main style={{ flex: 1, padding: '24px', maxWidth: 'calc(100vw - 240px)', boxSizing: 'border-box' }}>
                    {children}
                </main>
            </div>
        </div>
    );
};
