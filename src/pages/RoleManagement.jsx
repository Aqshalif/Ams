import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { Pagination } from '../components/Pagination';

export const RoleManagement = () => {
    const { roles, modules, updateRoles, showToast } = useData();

    const [dbUsers, setDbUsers] = useState([]);

    const loadUsers = async () => {
        try {
            const r = await fetch('/api/mysql/user');
            const text = await r.text();
            if (!text || !text.trim()) return;
            const res = JSON.parse(text);
            if (res && res.data) {
                setDbUsers(res.data);
            }
        } catch (err) {
            console.error('Failed to load users for RoleManagement:', err);
        }
    };

    useEffect(() => {
        loadUsers();
    }, []);

    // Match a user's role string to a role key (handles full labels like 'STAFF OPERASIONAL')
    const matchRoleKey = (userRoleStr, roleKey, roleNama) => {
        if (!userRoleStr) return false;
        const u = String(userRoleStr).trim().toUpperCase();
        const k = (roleKey || '').trim().toUpperCase();
        const n = (roleNama || '').trim().toUpperCase();
        if (u === k || u === n) return true;
        if (u.includes('ADMIN') && k.includes('ADMIN')) return true;
        if (u.includes('STAFF') && k.includes('STAFF')) return true;
        if (u.includes('MANAGER') && k.includes('MANAGER')) return true;
        if (u.includes('AUDITOR') && k.includes('AUDITOR')) return true;
        return false;
    };

    const getUserCount = (roleKey, roleNama) =>
        dbUsers.filter(u => matchRoleKey(u.role, roleKey, roleNama)).length;

    const [searchQuery, setSearchQuery] = useState('');
    const [sortOrder, setSortOrder] = useState('terbaru');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const activeModulesList = (modules || [])
        .filter(m => m.status === 'Aktif')
        .map((m, idx) => ({
            num: idx + 1,
            label: m.label || m.nama_modul,
            key: m.key,
            hasAdd: (m.actions || []).includes('add') || (m.actions || []).includes('submit'),
            hasEdit: (m.actions || []).includes('edit'),
            hasDelete: (m.actions || []).includes('delete') || (m.actions || []).includes('approve')
        }));

    const [showModal, setShowModal] = useState(false);
    const [editingRole, setEditingRole] = useState(null);

    const [roleForm, setRoleForm] = useState({
        nama_role: '',
        key: '',
        deskripsi: '',
        tipe: 'CUSTOM CREATED'
    });

    const [matrixPerms, setMatrixPerms] = useState({
        dashboard: { view: true, add: false, edit: false, delete: false },
        master: { view: true, add: false, edit: false, delete: false },
        aset: { view: true, add: false, edit: false, delete: false },
        peminjaman: { view: true, add: false, edit: false, delete: false },
        maintenance: { view: true, add: false, edit: false, delete: false },
        penyusutan: { view: true, add: false, edit: false, delete: false },
        penghapusan: { view: true, add: false, edit: false, delete: false },
        laporan: { view: true, add: false, edit: false, delete: false },
        pengguna: { view: true, add: false, edit: false, delete: false },
        role_management: { view: true, add: false, edit: false, delete: false },
        modul_management: { view: true, add: false, edit: false, delete: false },
        pengaturan: { view: true, add: false, edit: false, delete: false }
    });

    const defaultRoles = [
        { id: 1, key: 'admin', nama_role: 'Administrator System', deskripsi: 'Akses penuh ke seluruh modul, manajemen user, dan pembuatan custom role.', tipe: 'DEFAULT SYSTEM' },
        { id: 2, key: 'staff', nama_role: 'Staff Operasional', deskripsi: 'Input data aset dasar, pengajuan peminjaman, & pengajuan penghapusan.', tipe: 'DEFAULT SYSTEM' },
        { id: 3, key: 'manager', nama_role: 'Manager Fleet & Asset', deskripsi: 'Persetujuan (approval) peminjaman, evaluasi perawatan, dan penghapusan aset.', tipe: 'DEFAULT SYSTEM' },
        { id: 4, key: 'auditor', nama_role: 'Auditor Internal', deskripsi: 'Read-only audit log, laporan inventaris, & verifikasi penyusutan.', tipe: 'DEFAULT SYSTEM' }
    ];

    const allRoles = roles && roles.length > 0 ? roles : defaultRoles;

    const filteredRoles = allRoles.filter(r => {
        const q = searchQuery.toLowerCase();
        return !q || (r.nama_role && r.nama_role.toLowerCase().includes(q)) || (r.key && r.key.toLowerCase().includes(q)) || (r.deskripsi && r.deskripsi.toLowerCase().includes(q));
    });

    const sortedRoles = [...filteredRoles].sort((a, b) => {
        if (sortOrder === 'terbaru') return (b.id || 0) - (a.id || 0);
        if (sortOrder === 'terlama') return (a.id || 0) - (b.id || 0);
        if (sortOrder === 'nama_asc') return (a.nama_role || '').localeCompare(b.nama_role || '');
        if (sortOrder === 'nama_desc') return (b.nama_role || '').localeCompare(a.nama_role || '');
        return 0;
    });

    const totalItems = sortedRoles.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedData = sortedRoles.slice(startIndex, startIndex + itemsPerPage);

    const handleOpenAdd = () => {
        setEditingRole(null);
        setRoleForm({
            nama_role: '',
            key: '',
            deskripsi: '',
            tipe: 'CUSTOM CREATED'
        });

        const resetMatrix = {};
        activeModulesList.forEach(m => {
            resetMatrix[m.key] = { view: true, add: false, edit: false, delete: false };
        });
        setMatrixPerms(resetMatrix);
        setShowModal(true);
    };

    const handleOpenEdit = (roleItem) => {
        setEditingRole(roleItem);
        setRoleForm({
            nama_role: roleItem.nama_role,
            key: roleItem.key,
            deskripsi: roleItem.deskripsi || '',
            tipe: roleItem.tipe || 'CUSTOM CREATED'
        });

        const existingPerms = roleItem.permissions || roleItem.perms;
        if (existingPerms) {
            setMatrixPerms(existingPerms);
        } else {
            const resetMatrix = {};
            activeModulesList.forEach(m => {
                resetMatrix[m.key] = { view: true, add: false, edit: false, delete: false };
            });
            setMatrixPerms(resetMatrix);
        }
        setShowModal(true);
    };

    const handleDeleteRoleItem = (key, nama) => {
        if (key === 'admin') {
            showToast('error', 'Role Administrator System tidak dapat dihapus!');
            return;
        }
        if (window.confirm(`Apakah Anda yakin ingin MENGHAPUS role "${nama}"?`)) {
            const updated = allRoles.filter(r => r.key !== key);
            if (updateRoles) updateRoles(updated);
            showToast('info', `Role "${nama}" telah berhasil dihapus.`);
        }
    };

    const handleTogglePerm = (modKey, act) => {
        setMatrixPerms(prev => ({
            ...prev,
            [modKey]: {
                ...prev[modKey],
                [act]: !prev[modKey]?.[act]
            }
        }));
    };

    const handlePermToggle = handleTogglePerm;

    const handleSaveRole = (e) => {
        e.preventDefault();
        if (!roleForm.nama_role.trim()) {
            showToast('error', 'Nama Role wajib diisi!');
            return;
        }

        const roleKey = roleForm.key || roleForm.nama_role.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');

        if (editingRole) {
            const updated = allRoles.map(r => {
                if (r.key === editingRole.key) {
                    return {
                        ...r,
                        nama_role: roleForm.nama_role,
                        deskripsi: roleForm.deskripsi,
                        permissions: matrixPerms,
                        perms: matrixPerms
                    };
                }
                return r;
            });
            if (updateRoles) updateRoles(updated);
            showToast('success', `Matrix perizinan role "${roleForm.nama_role}" berhasil diperbarui!`);
        } else {
            const newRoleObj = {
                id: Date.now(),
                key: roleKey,
                nama_role: roleForm.nama_role,
                deskripsi: roleForm.deskripsi || 'Custom role hak akses.',
                tipe: 'CUSTOM CREATED',
                usersCount: 0,
                permissions: matrixPerms,
                perms: matrixPerms
            };
            const updated = [...allRoles, newRoleObj];
            if (updateRoles) updateRoles(updated);
            showToast('success', `Role baru "${roleForm.nama_role}" berhasil dibuat!`);
        }

        setShowModal(false);
    };

    return (
        <div style={{ padding: '4px' }}>
            {/* Header Section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>Role & Matrix Wewenang User</h2>
                    <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
                        Kelola wewenang hak akses berbasis peran (RBAC) dan matriks fitur modul aplikasi.
                    </p>
                </div>
                <button
                    onClick={handleOpenAdd}
                    style={{
                        background: '#00624F',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '10px 18px',
                        fontSize: '13px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        transition: 'all 0.2s ease'
                    }}
                >
                    <i className="fa-solid fa-user-gear"></i> + Buat Custom Role Baru
                </button>
            </div>

            {/* Top Cards Section */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <i className="fa-solid fa-user-shield"></i> TOTAL ROLE TERDAFTAR
                    </div>
                    <div style={{ fontSize: '28px', fontWeight: 900, color: '#0f172a', marginTop: '6px' }}>{allRoles.length}</div>
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Default & Custom Roles</div>
                </div>

                <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <i className="fa-solid fa-unlock-keyhole"></i> CUSTOM ROLES BARU
                    </div>
                    <div style={{ fontSize: '28px', fontWeight: 900, color: '#16a34a', marginTop: '6px' }}>{allRoles.filter(r => r.tipe === 'CUSTOM CREATED').length}</div>
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Dibuat oleh Administrator</div>
                </div>

                <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <i className="fa-solid fa-users"></i> USER TERHUBUNG
                    </div>
                    <div style={{ fontSize: '28px', fontWeight: 900, color: '#0288d1', marginTop: '6px' }}>{dbUsers.length}</div>
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Memegang role perizinan</div>
                </div>
            </div>

            {/* Search & Filter Bar */}
            <div style={{ background: '#fff', padding: '14px 18px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '20px', display: 'flex', gap: '12px', alignItems: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.03)', flexWrap: 'wrap' }}>
                <input
                    type="text"
                    placeholder="Cari nama role, key, deskripsi..."
                    value={searchQuery}
                    onChange={e => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                    }}
                    style={{ flex: 1, minWidth: '220px', padding: '9px 14px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', outline: 'none' }}
                />
                <select
                    value={sortOrder}
                    onChange={e => {
                        setSortOrder(e.target.value);
                        setCurrentPage(1);
                    }}
                    style={{
                        padding: '9px 14px',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: 600,
                        color: '#334155',
                        background: '#fff'
                    }}
                >
                    <option value="terbaru">Urutkan: Terbaru</option>
                    <option value="terlama">Urutkan: Terlama</option>
                    <option value="nama_asc">Nama (A - Z)</option>
                    <option value="nama_desc">Nama (Z - A)</option>
                </select>
            </div>

            {/* Main Table Section */}
            <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                            <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 700, color: '#475569', width: '40px' }}>No</th>
                            <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 700, color: '#475569', width: '110px' }}>Key Role</th>
                            <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 700, color: '#475569', width: '180px' }}>Nama Role</th>
                            <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Deskripsi Perizinan</th>
                            <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 700, color: '#475569', width: '130px' }}>Tipe Role</th>
                            <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 700, color: '#475569', width: '110px' }}>User Terhubung</th>
                            <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 700, color: '#475569', width: '160px' }}>Aksi Edit Matrix & Hapus</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedData.length === 0 ? (
                            <tr>
                                <td colSpan="7" style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
                                    Tidak ada data role ditemukan.
                                </td>
                            </tr>
                        ) : (
                            paginatedData.map((item, idx) => (
                                <tr key={item.id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '14px 16px', color: '#64748b' }}>{startIndex + idx + 1}</td>
                                    <td style={{ padding: '14px 16px', color: '#db2777', fontWeight: 600 }}><code>{item.key}</code></td>
                                    <td style={{ padding: '14px 16px', fontWeight: 800, color: '#0f172a' }}>{item.nama_role}</td>
                                    <td style={{ padding: '14px 16px', color: '#64748b' }}>{item.deskripsi}</td>
                                    <td style={{ padding: '14px 16px' }}>
                                        <span style={{
                                            display: 'inline-block',
                                            padding: '4px 10px',
                                            borderRadius: '12px',
                                            fontSize: '11px',
                                            fontWeight: 800,
                                            background: item.tipe === 'DEFAULT SYSTEM' ? '#e0f2fe' : '#dcfce7',
                                            color: item.tipe === 'DEFAULT SYSTEM' ? '#0369a1' : '#15803d'
                                        }}>
                                            {item.tipe}
                                        </span>
                                    </td>
                                    <td style={{ padding: '14px 16px' }}>
                                        <span style={{ background: '#475569', color: '#fff', padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 800 }}>
                                            {getUserCount(item.key, item.nama_role)} User
                                        </span>
                                    </td>
                                    <td style={{ padding: '14px 16px' }}>
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <button onClick={() => handleOpenEdit(item)} style={{ background: 'none', border: 'none', color: '#0288d1', fontWeight: 800, cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <i className="fa-solid fa-pen"></i> Edit Matrix
                                            </button>
                                            <button onClick={() => handleDeleteRoleItem(item.key, item.nama_role)} style={{ background: 'none', border: 'none', color: '#dc2626', fontWeight: 800, cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <i className="fa-solid fa-trash"></i> Hapus
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    itemsPerPage={itemsPerPage}
                    onItemsPerPageChange={(size) => {
                        setItemsPerPage(size);
                        setCurrentPage(1);
                    }}
                    totalItems={totalItems}
                    startIndex={startIndex}
                    endIndex={startIndex + paginatedData.length}
                />
            </div>

            {/* Modal Popup: Buat / Edit Role Perizinan Baru */}
            {showModal && (
                <div className="modal show" style={{ display: 'block', background: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-content" style={{ maxWidth: '780px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '14px', marginBottom: '18px' }}>
                            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                                {editingRole ? `Edit Matrix Role: ${editingRole.nama_role}` : 'Buat Role Perizinan Baru'}
                            </h3>
                            <span className="close-btn" onClick={() => setShowModal(false)} style={{ cursor: 'pointer', fontSize: '22px', fontWeight: 800, color: '#94a3b8' }}>&times;</span>
                        </div>

                        <form onSubmit={handleSaveRole}>
                            {/* Inputs Row 1 */}
                            <div style={{ display: 'flex', gap: '14px', marginBottom: '14px' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Nama Role Baru</label>
                                    <input
                                        type="text"
                                        placeholder="Contoh: Auditor Internal / Keuangan"
                                        value={roleForm.nama_role}
                                        onChange={e => setRoleForm({ ...roleForm, nama_role: e.target.value })}
                                        required
                                        style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px' }}
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Kode Unique Key (Lowercase)</label>
                                    <input
                                        type="text"
                                        placeholder="contoh: auditor / finance"
                                        value={roleForm.key}
                                        onChange={e => setRoleForm({ ...roleForm, key: e.target.value })}
                                        required
                                        style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px' }}
                                    />
                                </div>
                            </div>

                            {/* Inputs Row 2 */}
                            <div style={{ marginBottom: '18px' }}>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Deskripsi Lingkup Wewenang Role</label>
                                <textarea
                                    placeholder="Penjelasan mengenai hak akses role ini..."
                                    value={roleForm.deskripsi}
                                    onChange={e => setRoleForm({ ...roleForm, deskripsi: e.target.value })}
                                    rows={2}
                                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px' }}
                                />
                            </div>

                            {/* Matrix Checklist Hak Akses Section */}
                            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
                                <div style={{ fontSize: '12px', fontWeight: 800, color: '#00624F', marginBottom: '4px' }}>
                                    <i className="fa-solid fa-list-check"></i> Matrix Checklist Hak Akses Per Modul:
                                </div>
                                <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '12px' }}>
                                    Centang hak akses yang diizinkan untuk role ini pada masing-masing halaman:
                                </div>

                                <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', background: '#fff' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                                        <thead>
                                            <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #e2e8f0' }}>
                                                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>MODUL / HALAMAN</th>
                                                <th style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 700, color: '#475569', width: '110px' }}>LIHAT (VIEW)</th>
                                                <th style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 700, color: '#475569', width: '110px' }}>TAMBAH (ADD)</th>
                                                <th style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 700, color: '#475569', width: '90px' }}>EDIT</th>
                                                <th style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 700, color: '#475569', width: '130px' }}>HAPUS / AKSUS</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {activeModulesList.map((m) => {
                                                const modPerm = matrixPerms[m.key] || { view: true, add: false, edit: false, delete: false };
                                                return (
                                                    <tr key={m.key} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                        <td style={{ padding: '9px 12px', fontWeight: 700, color: '#0f172a' }}>
                                                            {m.num}. {m.label} <span style={{ color: '#64748b', fontWeight: 400 }}>({m.key})</span>
                                                        </td>

                                                        {/* View Column */}
                                                        <td style={{ padding: '9px 8px', textAlign: 'center' }}>
                                                            <input
                                                                type="checkbox"
                                                                checked={modPerm.view}
                                                                onChange={() => handleTogglePerm(m.key, 'view')}
                                                                style={{ width: '16px', height: '16px', accentColor: '#00624F', cursor: 'pointer' }}
                                                            />
                                                        </td>

                                                        {/* Add Column */}
                                                        <td style={{ padding: '9px 8px', textAlign: 'center' }}>
                                                            {m.hasAdd ? (
                                                                <input
                                                                    type="checkbox"
                                                                    checked={modPerm.add}
                                                                    onChange={() => handleTogglePerm(m.key, 'add')}
                                                                    style={{ width: '16px', height: '16px', accentColor: '#00624F', cursor: 'pointer' }}
                                                                />
                                                            ) : (
                                                                <span style={{ color: '#94a3b8' }}>-</span>
                                                            )}
                                                        </td>

                                                        {/* Edit Column */}
                                                        <td style={{ padding: '9px 8px', textAlign: 'center' }}>
                                                            {m.hasEdit ? (
                                                                <input
                                                                    type="checkbox"
                                                                    checked={modPerm.edit}
                                                                    onChange={() => handleTogglePerm(m.key, 'edit')}
                                                                    style={{ width: '16px', height: '16px', accentColor: '#00624F', cursor: 'pointer' }}
                                                                />
                                                            ) : (
                                                                <span style={{ color: '#94a3b8' }}>-</span>
                                                            )}
                                                        </td>

                                                        {/* Delete Column */}
                                                        <td style={{ padding: '9px 8px', textAlign: 'center' }}>
                                                            {m.hasDelete ? (
                                                                <input
                                                                    type="checkbox"
                                                                    checked={modPerm.delete}
                                                                    onChange={() => handleTogglePerm(m.key, 'delete')}
                                                                    style={{ width: '16px', height: '16px', accentColor: '#00624F', cursor: 'pointer' }}
                                                                />
                                                            ) : (
                                                                <span style={{ color: '#94a3b8' }}>-</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                <button type="button" onClick={() => setShowModal(false)} style={{ background: '#e2e8f0', color: '#334155', border: 'none', borderRadius: '6px', padding: '9px 18px', fontWeight: 700, cursor: 'pointer' }}>
                                    Batal
                                </button>
                                <button type="submit" style={{ background: '#00624F', color: '#fff', border: 'none', borderRadius: '6px', padding: '9px 22px', fontSize: '13px', fontWeight: 800, cursor: 'pointer' }}>
                                    Simpan Role & Matrix Hak Akses
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
