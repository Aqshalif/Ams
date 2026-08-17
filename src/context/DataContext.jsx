import React, { createContext, useContext, useState, useEffect } from 'react';

const STORE_VERSION = 'v9.1_force_refresh';

export const normalizeRoleKey = (r) => {
    if (!r) return 'staff';
    const str = String(r).trim().toLowerCase();
    if (str.includes('admin')) return 'admin';
    if (str.includes('manager')) return 'manager';
    if (str.includes('auditor')) return 'auditor';
    if (str.includes('staff') || str.includes('operasional') || str.includes('user')) return 'staff';
    return str;
};

const sanitizeModules = (mods) => {
    return (mods || []).map(m => {
        if (m.key === 'penghapusan') {
            m.label = 'Penghapusan';
        }
        if (['peminjaman', 'maintenance', 'penyusutan', 'penghapusan'].includes(m.key)) {
            if (!m.actions) m.actions = [];
            if (!m.actions.includes('add')) m.actions.push('add');
            if (!m.actions.includes('edit')) m.actions.push('edit');
            if (!m.actions.includes('delete')) m.actions.push('delete');
        }
        return m;
    });
};

const INITIAL_ROLES = [
    {
        role_id: 1,
        key: 'admin',
        nama_role: 'Administrator System',
        deskripsi: 'Akses penuh ke seluruh modul, manajemen user, dan pembuatan custom role.',
        is_default: true,
        permissions: {
            dashboard: { view: true },
            role_management: { view: true, add: true, edit: true, delete: true },
            modul_management: { view: true, add: true, edit: true, delete: true },
            master: { view: true, add: true, edit: true, delete: true },
            aset: { view: true, add: true, edit: true, delete: true },
            peminjaman: { view: true, add: true, approve: true, return: true },
            maintenance: { view: true, add: true, finish: true },
            penyusutan: { view: true, calc: true },
            penghapusan: { view: true, add: true, approve: true },
            laporan: { view: true, export: true },
            pengguna: { view: true, add: true, edit: true, delete: true },
            pengaturan: { view: true },
            log_activity: { view: true, add: false, edit: false, delete: false },
            pengadaan: { view: true, add: true, edit: true, delete: true, submit: true, approve: true, export: true }
        }
    },
    {
        role_id: 2,
        key: 'staff',
        nama_role: 'Staff Operasional',
        deskripsi: 'Input data aset dasar, pengajuan peminjaman, & pengajuan penghapusan.',
        is_default: true,
        permissions: {
            dashboard: { view: true },
            role_management: { view: false, add: false, edit: false, delete: false },
            modul_management: { view: false, add: false, edit: false, delete: false },
            master: { view: true, add: true, edit: true, delete: false },
            aset: { view: true, add: true, edit: true, delete: false },
            peminjaman: { view: true, add: true, approve: false, return: true },
            maintenance: { view: true, add: true, finish: false },
            penyusutan: { view: true, calc: false },
            penghapusan: { view: true, add: true, approve: false },
            laporan: { view: true, export: false },
            pengguna: { view: false, add: false, edit: false, delete: false },
            pengaturan: { view: true },
            log_activity: { view: false, add: false, edit: false, delete: false },
            pengadaan: { view: true, add: true, submit: true, edit: true, delete: false }
        }
    },
    {
        role_id: 3,
        key: 'manager',
        nama_role: 'Manager Fleet & Asset',
        deskripsi: 'Approval peminjaman, perbaikan maintenance, approval penghapusan, dan laporan.',
        is_default: true,
        permissions: {
            dashboard: { view: true },
            role_management: { view: false, add: false, edit: false, delete: false },
            modul_management: { view: false, add: false, edit: false, delete: false },
            master: { view: true, add: true, edit: true, delete: true },
            aset: { view: true, add: true, edit: true, delete: true },
            peminjaman: { view: true, add: true, approve: true, return: true },
            maintenance: { view: true, add: true, finish: true },
            penyusutan: { view: true, calc: true },
            penghapusan: { view: true, add: true, approve: true },
            laporan: { view: true, export: true },
            pengguna: { view: true, add: false, edit: false, delete: false },
            pengaturan: { view: true },
            log_activity: { view: false, add: false, edit: false, delete: false },
            pengadaan: { view: true, add: true, submit: true, edit: true, delete: true, approve: true, export: true }
        }
    },
    {
        role_id: 4,
        key: 'auditor',
        nama_role: 'Auditor Internal',
        deskripsi: 'Role khusus pengawas: Hanya bisa melihat data inventaris & mencetak laporan (Read-Only).',
        is_default: false,
        permissions: {
            dashboard: { view: true },
            role_management: { view: false, add: false, edit: false, delete: false },
            modul_management: { view: false, add: false, edit: false, delete: false },
            master: { view: true, add: false, edit: false, delete: false },
            aset: { view: true, add: false, edit: false, delete: false },
            peminjaman: { view: true, add: false, approve: false, return: false },
            maintenance: { view: true, add: false, finish: false },
            penyusutan: { view: true, calc: false },
            penghapusan: { view: true, add: false, approve: false },
            laporan: { view: true, export: true },
            pengguna: { view: false, add: false, edit: false, delete: false },
            pengaturan: { view: true },
            log_activity: { view: false, add: false, edit: false, delete: false },
            pengadaan: { view: true, export: true, add: false, edit: false, delete: false, approve: false }
        }
    }
];

const INITIAL_MODULES = [
    { modul_id: 1, key: 'dashboard', label: 'Dashboard Utama', page: 'dashboard', icon: 'fa-solid fa-gauge-high', category: 'General Core', actions: ['view'], is_system: true, position: 'top', status: 'Aktif' },
    { modul_id: 4, key: 'master', label: 'Master Data Management', page: 'master', icon: 'fa-solid fa-layer-group', category: 'Data Master', actions: ['view', 'add', 'edit', 'delete'], is_system: true, position: 'top', status: 'Aktif' },
    { modul_id: 5, key: 'aset', label: 'Pengelolaan Inventaris Aset', page: 'aset', icon: 'fa-solid fa-box-archive', category: 'Asset Operations', actions: ['view', 'add', 'edit', 'delete'], is_system: true, position: 'top', status: 'Aktif' },
    { modul_id: 6, key: 'peminjaman', label: 'Peminjaman & Mutasi Aset', page: 'peminjaman', icon: 'fa-solid fa-hand-holding-hand', category: 'Asset Operations', actions: ['view', 'add', 'edit', 'delete', 'approve', 'return'], is_system: true, position: 'top', status: 'Aktif' },
    { modul_id: 7, key: 'maintenance', label: 'Maintenance & Servis', page: 'maintenance', icon: 'fa-solid fa-wrench', category: 'Asset Operations', actions: ['view', 'add', 'edit', 'delete', 'finish'], is_system: true, position: 'top', status: 'Aktif' },
    { modul_id: 8, key: 'penyusutan', label: 'Penyusutan Nilai Aset', page: 'penyusutan', icon: 'fa-solid fa-arrow-trend-down', category: 'Finance & Accounting', actions: ['view', 'add', 'edit', 'delete', 'calc'], is_system: true, position: 'top', status: 'Aktif' },
    { modul_id: 9, key: 'penghapusan', label: 'Penghapusan', page: 'penghapusan', icon: 'fa-solid fa-trash-can', category: 'Asset Operations', actions: ['view', 'add', 'edit', 'delete', 'approve'], is_system: true, position: 'top', status: 'Aktif' },
    { modul_id: 10, key: 'laporan', label: 'Laporan Inventaris', page: 'laporan', icon: 'fa-solid fa-file-invoice', category: 'Reporting', actions: ['view', 'export'], is_system: true, position: 'top', status: 'Aktif' },
    {
        modul_id: 101,
        key: 'pengadaan',
        label: 'Pengadaan & Purchasing Aset',
        page: 'pengadaan',
        icon: 'fa-solid fa-cart-shopping',
        category: 'Asset Operations',
        actions: ['view', 'add', 'submit', 'edit', 'delete', 'approve', 'export'],
        is_system: false,
        position: 'top',
        badge: 'REACT',
        status: 'Aktif',
        layout_type: 'multi_tab',
        custom_tabs: '1. Permohonan Baru, 2. Evaluasi Manager, 3. Riwayat Selesai',
        db_schema: [
            { name: 'kode_pr', label: 'Kode PR', type: 'VARCHAR' },
            { name: 'nama_barang', label: 'Nama Barang / Unit', type: 'VARCHAR' },
            { name: 'supplier_vendor', label: 'Vendor Supplier', type: 'VARCHAR' },
            { name: 'est_biaya', label: 'Estimasi Biaya (Rp)', type: 'CURRENCY' },
            { name: 'tanggal_pr', label: 'Tanggal PR', type: 'DATE' }
        ],
        subtab_schemas: {
            '1. Permohonan Baru': [
                { name: 'kode_pr', label: 'Kode PR Pengajuan', type: 'VARCHAR' },
                { name: 'nama_barang', label: 'Nama Barang / Unit', type: 'VARCHAR' },
                { name: 'est_biaya', label: 'Estimasi Biaya (Rp)', type: 'CURRENCY' },
                { name: 'tanggal_pr', label: 'Tanggal Permohonan', type: 'DATE' }
            ],
            '2. Evaluasi Manager': [
                { name: 'kode_eval', label: 'Kode Evaluasi', type: 'VARCHAR' },
                { name: 'evaluator', label: 'Nama Evaluator Manager', type: 'VARCHAR' },
                { name: 'skor', label: 'Skor Kelayakan', type: 'VARCHAR' },
                { name: 'catatan_review', label: 'Catatan & Keputusan Review', type: 'TEXT' }
            ],
            '3. Riwayat Selesai': [
                { name: 'no_po', label: 'No PO Final', type: 'VARCHAR' },
                { name: 'nama_vendor', label: 'Nama Supplier Terpilih', type: 'VARCHAR' },
                { name: 'biaya_real', label: 'Biaya Realisasi (Rp)', type: 'CURRENCY' },
                { name: 'tgl_selesai', label: 'Tanggal Selesai Purchasing', type: 'DATE' }
            ]
        },
        subtab_actions: {
            '1. Permohonan Baru': ['view', 'add', 'submit', 'edit', 'delete'],
            '2. Evaluasi Manager': ['view', 'approve'],
            '3. Riwayat Selesai': ['view', 'export']
        },
        feat_search: true,
        feat_kpi: true,
        feat_subtabs: true,
        feat_export: true
    },
    { modul_id: 11, key: 'pengguna', label: 'Manajemen Pengguna', page: 'pengguna', icon: 'fa-solid fa-users-gear', category: 'Security & Access', actions: ['view', 'add', 'edit', 'delete'], is_system: true, position: 'bottom', status: 'Aktif' },
    { modul_id: 2, key: 'role_management', label: 'Role & Hak Akses', page: 'role_management', icon: 'fa-solid fa-shield-halved', category: 'Security & Access', actions: ['view', 'add', 'edit', 'delete'], is_system: true, position: 'bottom', status: 'Aktif' },
    { modul_id: 3, key: 'modul_management', label: 'Manajemen Modul & Fitur', page: 'modul_management', icon: 'fa-solid fa-cubes', category: 'Security & Access', actions: ['view', 'add', 'edit', 'delete'], is_system: true, position: 'bottom', status: 'Aktif' },
    { modul_id: 13, key: 'log_activity', label: 'Log Aktivitas', page: 'log_activity', icon: 'fa-solid fa-clock-rotate-left', category: 'Security & Access', actions: ['view', 'add', 'edit', 'delete'], is_system: true, position: 'bottom', status: 'Aktif' },
    { modul_id: 12, key: 'pengaturan', label: 'Pengaturan Sistem', page: 'pengaturan', icon: 'fa-solid fa-gears', category: 'General Core', actions: ['view'], is_system: true, position: 'bottom', status: 'Aktif' }
];

const INITIAL_USERS = [
    { user_id: 1, nama_lengkap: 'Administrator System', username: 'admin', role: 'admin', email: 'admin@gofleet.co.id' },
    { user_id: 2, nama_lengkap: 'Staff Operasional', username: 'staff', role: 'staff', email: 'staff@gofleet.co.id' },
    { user_id: 3, nama_lengkap: 'Manager Fleet', username: 'manager', role: 'manager', email: 'manager@gofleet.co.id' },
    { user_id: 4, nama_lengkap: 'Rian Hidayat (Auditor)', username: 'rian', role: 'auditor', email: 'rian@gofleet.co.id' },
    { user_id: 5, nama_lengkap: 'Dewi Lestari', username: 'dewi', role: 'manager', email: 'dewi@gofleet.co.id' }
];

const DataContext = createContext();

export const DataProvider = ({ children }) => {
    const [roles, setRoles] = useState(INITIAL_ROLES);
    const [modules, setModules] = useState(INITIAL_MODULES);
    const [users, setUsers] = useState(INITIAL_USERS);
    const [currentUser, setCurrentUser] = useState(INITIAL_USERS[0]);
    const [authUser, setAuthUser] = useState(() => {
        const savedAuth = localStorage.getItem('role_authUser');
        return savedAuth ? JSON.parse(savedAuth) : INITIAL_USERS[0];
    });
    const [toasts, setToasts] = useState([]);

    useEffect(() => {
        const savedVer = localStorage.getItem('role_store_version');
        if (savedVer !== STORE_VERSION) {
            localStorage.clear();
            localStorage.setItem('role_store_version', STORE_VERSION);
            localStorage.setItem('role_db_roles', JSON.stringify(INITIAL_ROLES));
            localStorage.setItem('role_db_modules', JSON.stringify(INITIAL_MODULES));
            localStorage.setItem('role_db_users', JSON.stringify(INITIAL_USERS));
            localStorage.setItem('role_authUser', JSON.stringify(INITIAL_USERS[0]));
        } else {
            const r = localStorage.getItem('role_db_roles');
            const m = localStorage.getItem('role_db_modules');
            const u = localStorage.getItem('role_db_users');
            if (r) setRoles(JSON.parse(r));
            if (m) setModules(sanitizeModules(JSON.parse(m)));
            if (u) setUsers(JSON.parse(u));
        }
    }, []);

    const login = async (username, password) => {
        try {
            const res = await fetch('/api/mysql/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await res.json();
            
            if (data.success) {
                const found = data.user;
                setAuthUser(found);
                setCurrentUser(found);
                localStorage.setItem('role_authUser', JSON.stringify(found));
                showToast('success', `Selamat datang kembali, ${found.nama_lengkap}!`);
                return { success: true };
            } else {
                return { success: false, message: data.message };
            }
        } catch (error) {
            console.error('Login request failed:', error);
            return { success: false, message: 'Gagal terhubung ke server.' };
        }
    };

    const logout = () => {
        setAuthUser(null);
        localStorage.removeItem('role_authUser');
        showToast('info', 'Anda telah keluar dari sistem (Logout).');
    };

    const showToast = (type, message) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, type, message }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 3500);
    };

    const updateRoles = (newRoles) => {
        setRoles(newRoles);
        localStorage.setItem('role_db_roles', JSON.stringify(newRoles));
    };

    const updateModules = (newModules) => {
        setModules(newModules);
        localStorage.setItem('role_db_modules', JSON.stringify(newModules));
    };

    const addModule = (newModuleData) => {
        const key = newModuleData.key || newModuleData.unique_key || `custom_${Date.now()}`;
        const newMod = {
            modul_id: Date.now(),
            key: key,
            label: newModuleData.label || newModuleData.nama_modul,
            page: newModuleData.page || key,
            icon: newModuleData.icon || 'fa-solid fa-cube',
            category: newModuleData.category || newModuleData.kategori || 'Asset Operations',
            actions: newModuleData.actions || ['view', 'add', 'edit', 'delete'],
            is_system: false,
            position: newModuleData.position || 'top',
            badge: 'REACT',
            status: 'Aktif',
            ...newModuleData
        };
        const updated = [...modules, newMod];
        setModules(updated);
        localStorage.setItem('role_db_modules', JSON.stringify(updated));
        return newMod;
    };

    const createCustomModule = (name, desc, subTabs = [], fullData = {}) => {
        const key = fullData.unique_key || name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
        return addModule({
            key,
            label: name,
            nama_modul: name,
            description: desc,
            custom_tabs: Array.isArray(subTabs) ? subTabs.join(', ') : subTabs,
            subTabs,
            ...fullData
        });
    };

    const deleteModule = (modulId) => {
        const updated = modules.filter(m => m.modul_id !== modulId);
        setModules(updated);
        localStorage.setItem('role_db_modules', JSON.stringify(updated));
    };

    const updateUsers = (newUsers) => {
        setUsers(newUsers);
        localStorage.setItem('role_db_users', JSON.stringify(newUsers));
    };

    const switchUserRole = (roleKey) => {
        const userObj = { ...currentUser, role: roleKey };
        setCurrentUser(userObj);
        showToast('info', `Simulasi Role beralih ke "${roleKey.toUpperCase()}"`);
    };

    const checkPermission = (moduleKey, action = 'view') => {
        if (!currentUser) return false;

        const userRoleKey = normalizeRoleKey(currentUser.role);
        if (userRoleKey === 'admin') return true;

        const role = roles.find(r => r.key === currentUser.role || r.nama_role === currentUser.role || normalizeRoleKey(r.key) === userRoleKey || normalizeRoleKey(r.nama_role) === userRoleKey);
        if (!role) return false;

        const perms = role.permissions || role.perms;
        if (!perms || !perms[moduleKey]) return false;

        const modPerms = perms[moduleKey];

        if (action === 'view') return !!modPerms.view;
        if (action === 'add') return !!(modPerms.add || modPerms.submit);
        if (action === 'edit') return !!modPerms.edit;
        if (action === 'delete') return !!modPerms.delete;
        if (action === 'approve') return !!modPerms.approve;
        if (action === 'submit') return !!(modPerms.submit || modPerms.add);
        if (action === 'export') return !!modPerms.export;
        if (action === 'calc') return !!(modPerms.calc || modPerms.add);
        if (action === 'finish') return !!(modPerms.finish || modPerms.approve);
        if (action === 'return') return !!(modPerms.return || modPerms.add);

        return !!modPerms[action];
    };

    const getCustomData = (tableKey) => {
        const d = localStorage.getItem(`role_db_${tableKey}`);
        return d ? JSON.parse(d) : [];
    };

    const saveCustomData = (tableKey, data) => {
        localStorage.setItem(`role_db_${tableKey}`, JSON.stringify(data));
    };

    const logActivity = async (action, details) => {
        if (!currentUser) return;
        try {
            const payload = {
                user_id: currentUser.user_id,
                username: currentUser.username,
                role: currentUser.role || currentUser.nama_role,
                action: action,
                details: details || ''
            };
            await fetch('/api/mysql/log_activity', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        } catch (error) {
            console.error('Failed to log activity:', error);
        }
    };

    return (
        <DataContext.Provider value={{
            roles, updateRoles,
            modules, updateModules, addModule, createCustomModule, deleteModule,
            users, updateUsers,
            currentUser, switchUserRole,
            authUser, login, logout,
            checkPermission,
            getCustomData, saveCustomData,
            showToast, logActivity
        }}>
            {children}
            <div className="toast-container">
                {toasts.map(t => (
                    <div key={t.id} className={`toast-message ${t.type}`}>
                        {t.message}
                    </div>
                ))}
            </div>
        </DataContext.Provider>
    );
};

export const useData = () => useContext(DataContext);
