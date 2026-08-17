import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DataProvider, useData } from './context/DataContext';
import { Layout } from './components/Layout';

import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { MasterData } from './pages/MasterData';
import { Aset } from './pages/Aset';
import { Peminjaman } from './pages/Peminjaman';
import { Maintenance } from './pages/Maintenance';
import { Penyusutan } from './pages/Penyusutan';
import { Penghapusan } from './pages/Penghapusan';
import { Laporan } from './pages/Laporan';
import { Pengguna } from './pages/Pengguna';
import { ModulManagement } from './pages/ModulManagement';
import { RoleManagement } from './pages/RoleManagement';
import { DynamicModule } from './pages/DynamicModule';
import { Pengaturan } from './pages/Pengaturan';
import { LogAktivitas } from './pages/LogAktivitas';
import { AnalisisKelayakan } from './pages/AnalisisKelayakan';

const ProtectedLayout = ({ children }) => {
    const { authUser } = useData();
    if (!authUser) {
        return <Navigate to="/login" replace />;
    }
    return <Layout>{children}</Layout>;
};

export const AppContent = () => {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route path="/" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
            <Route path="/master" element={<ProtectedLayout><MasterData /></ProtectedLayout>} />
            <Route path="/aset" element={<ProtectedLayout><Aset /></ProtectedLayout>} />
            <Route path="/peminjaman" element={<ProtectedLayout><Peminjaman /></ProtectedLayout>} />
            <Route path="/maintenance" element={<ProtectedLayout><Maintenance /></ProtectedLayout>} />
            <Route path="/penyusutan" element={<ProtectedLayout><Penyusutan /></ProtectedLayout>} />
            <Route path="/penghapusan" element={<ProtectedLayout><Penghapusan /></ProtectedLayout>} />
            <Route path="/laporan" element={<ProtectedLayout><Laporan /></ProtectedLayout>} />
            <Route path="/pengguna" element={<ProtectedLayout><Pengguna /></ProtectedLayout>} />
            <Route path="/role_management" element={<ProtectedLayout><RoleManagement /></ProtectedLayout>} />
            <Route path="/modul_management" element={<ProtectedLayout><ModulManagement /></ProtectedLayout>} />
            <Route path="/dynamic/:moduleKey" element={<ProtectedLayout><DynamicModule /></ProtectedLayout>} />
            <Route path="/pengadaan" element={<Navigate to="/dynamic/pengadaan" replace />} />
            <Route path="/pengaturan" element={<ProtectedLayout><Pengaturan /></ProtectedLayout>} />
            <Route path="/log_activity" element={<ProtectedLayout><LogAktivitas /></ProtectedLayout>} />
            <Route path="/analisis-kelayakan" element={<ProtectedLayout><AnalisisKelayakan /></ProtectedLayout>} />
            <Route path="/custom/:moduleKey" element={<ProtectedLayout><DynamicModule /></ProtectedLayout>} />

            <Route path="*" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
        </Routes>
    );
};

export const App = () => {
    return (
        <DataProvider>
            <BrowserRouter>
                <AppContent />
            </BrowserRouter>
        </DataProvider>
    );
};

export default App;
