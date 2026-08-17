import React, { useState, useEffect } from 'react';
import { Pagination } from '../components/Pagination';
import { useData, normalizeRoleKey } from '../context/DataContext';

const formatRoleLabel = (r) => {
    const roleStr = (r || '').toLowerCase();
    if (roleStr.includes('admin')) return 'ADMINISTRATOR SYSTEM';
    if (roleStr.includes('manager')) return 'MANAGER FLEET & ASSET';
    if (roleStr.includes('auditor')) return 'AUDITOR INTERNAL';
    if (roleStr.includes('staff') || roleStr.includes('user') || roleStr.includes('operasional')) return 'STAFF OPERASIONAL';
    return String(r || 'STAFF OPERASIONAL').toUpperCase();
};

export const Pengguna = () => {
    const { roles, checkPermission, logActivity } = useData();
    const canAdd = checkPermission('pengguna', 'add');
    const canEdit = checkPermission('pengguna', 'edit');
    const canDelete = checkPermission('pengguna', 'delete');
    const [userList, setUserList] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [sortOrder, setSortOrder] = useState('terbaru');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [loading, setLoading] = useState(true);
    const [dbError, setDbError] = useState(null);

    // Modal state for Add & Edit User
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null); // null = Add, object = Edit
    const [submitting, setSubmitting] = useState(false);

    // Form inputs
    const [form, setForm] = useState({
        nama_lengkap: '',
        username: '',
        email: '',
        password: '',
        role: 'staff',
        status: 'AKTIF'
    });
    const [showPassword, setShowPassword] = useState(false);

    const safeFetchJSON = async (url, options = {}) => {
        try {
            const res = await fetch(url, options);
            const text = await res.text();
            if (!text || !text.trim()) return { success: false, data: [] };
            return JSON.parse(text);
        } catch (err) {
            console.warn(`Fetch JSON error for ${url}:`, err.message);
            return { success: false, data: [] };
        }
    };

    const loadUsersFromMySQL = async () => {
        setLoading(true);
        setDbError(null);
        try {
            const res = await safeFetchJSON('/api/mysql/user');
            if (res && res.data) {
                const mapped = (res.data || []).map((item, idx) => ({
                    ...item,
                    user_id: item.user_id || item.id || idx + 1,
                    nama_lengkap: item.nama_lengkap || item.nama || item.name || item.username || 'User Member',
                    username: item.username || item.user_name || `user_${idx + 1}`,
                    email: item.email || `${item.username || 'user'}@gofleet.co.id`,
                    role: item.role || item.nama_role || item.wewenang || 'STAFF OPERASIONAL',
                    status: item.status || item.status_akun || 'AKTIF'
                }));
                setUserList(mapped);
            }
        } catch (err) {
            setDbError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUsersFromMySQL();
    }, []);

    const resetForm = () => {
        setEditingUser(null);
        setForm({
            nama_lengkap: '',
            username: '',
            password: 'admin123',
            role: 'STAFF OPERASIONAL',
            status: 'AKTIF'
        });
        setShowPassword(false);
    };

    const handleOpenAdd = () => {
        resetForm();
        setShowModal(true);
    };

    const handleOpenEdit = (item) => {
        setEditingUser(item);
        setForm({
            nama_lengkap: item.nama_lengkap || '',
            username: item.username || '',
            password: '',
            role: item.role || 'STAFF OPERASIONAL',
            status: item.status || 'AKTIF'
        });
        setShowPassword(false);
        setShowModal(true);
    };

    const handleDelete = async (item) => {
        if (!window.confirm(`Apakah Anda yakin ingin MENGHAPUS akun pengguna "${item.nama_lengkap}" (@${item.username}) dari database MySQL?`)) {
            return;
        }

        try {
            const res = await safeFetchJSON(`/api/mysql/user/${item.user_id}`, {
                method: 'DELETE'
            });

            if (res && res.success) {
                alert(` Berhasil! Akun user @${item.username} (${item.nama_lengkap}) telah dihapus.`);
                logActivity('Hapus Pengguna', `Menghapus akun pengguna ${item.nama_lengkap} (@${item.username})`);
                await loadUsersFromMySQL();
            } else {
                alert(`Gagal menghapus user: ${res?.message || 'Terjadi kesalahan'}`);
            }
        } catch (err) {
            alert(`Error: ${err.message}`);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.nama_lengkap.trim() || !form.username.trim()) {
            alert('Nama Lengkap dan Username wajib diisi!');
            return;
        }

        setSubmitting(true);
        try {
            let url = '/api/mysql/user';
            let method = 'POST';

            const payload = {
                nama_lengkap: form.nama_lengkap,
                username: form.username,
                role: form.role,
                status: form.status
            };

            if (form.password) {
                payload.password = form.password;
            }

            if (editingUser) {
                url = `/api/mysql/user/${editingUser.user_id}`;
                method = 'PUT';
            }

            const res = await safeFetchJSON(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res && res.success) {
                alert(` Berhasil! Akun user "${form.nama_lengkap}" telah ${editingUser ? 'diperbarui' : 'ditambahkan'} di database db_ams.`);
                logActivity(editingUser ? 'Edit Pengguna' : 'Tambah Pengguna', `${editingUser ? 'Memperbarui' : 'Menambahkan'} akun pengguna ${form.nama_lengkap} (@${form.username})`);
                setShowModal(false);
                resetForm();
                await loadUsersFromMySQL();
            } else {
                alert(`Gagal menyimpan user: ${res?.message || 'Terjadi kesalahan'}`);
            }
        } catch (err) {
            alert(`Error: ${err.message}`);
        } finally {
            setSubmitting(false);
        }
    };

    const filtered = userList.filter(item => {
        const mSearch = !searchQuery || JSON.stringify(item).toLowerCase().includes(searchQuery.toLowerCase());
        const mRole = !roleFilter || (item.role || '').toLowerCase().includes(roleFilter.toLowerCase());
        return mSearch && mRole;
    });

    const sortedFiltered = [...filtered].sort((a, b) => {
        if (sortOrder === 'terbaru') return (b.user_id || 0) - (a.user_id || 0);
        if (sortOrder === 'terlama') return (a.user_id || 0) - (b.user_id || 0);
        if (sortOrder === 'nama_asc') return (a.nama_lengkap || '').localeCompare(b.nama_lengkap || '');
        if (sortOrder === 'nama_desc') return (b.nama_lengkap || '').localeCompare(a.nama_lengkap || '');
        return 0;
    });

    const totalItems = sortedFiltered.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedData = sortedFiltered.slice(startIndex, startIndex + itemsPerPage);

    const formatRoleLabel = (r) => {
        const roleStr = (r || '').toUpperCase();
        if (roleStr.includes('ADMIN')) return 'ADMINISTRATOR SYSTEM';
        if (roleStr.includes('MANAGER')) return 'MANAGER FLEET & ASSET';
        if (roleStr.includes('AUDITOR')) return 'AUDITOR INTERNAL';
        return 'STAFF OPERASIONAL';
    };

    return (
        <div style={{ padding: '4px' }}>
            {/* Header Section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>Pengelolaan Akun & Hak Akses User</h2>
                    <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
                        Daftar pengguna dan wewenang hak akses masing-masing pengguna ({userList.length} Total User).
                    </p>
                </div>
                {canAdd && (
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
                        <i className="fa-solid fa-user-plus"></i> + Add / Tambah Pengguna
                    </button>
                )}
            </div>

            {/* Search & Filter Bar */}
            <div style={{
                background: '#fff',
                padding: '14px 18px',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
                marginBottom: '20px',
                display: 'flex',
                gap: '12px',
                alignItems: 'center',
                flexWrap: 'wrap',
                boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
            }}>
                <input
                    type="text"
                    placeholder="Cari nama, username, email live dari MySQL db_ams..."
                    value={searchQuery}
                    onChange={e => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                    }}
                    style={{
                        flex: 1,
                        minWidth: '220px',
                        padding: '9px 14px',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        fontSize: '13px',
                        outline: 'none'
                    }}
                />
                <select
                    value={roleFilter}
                    onChange={e => {
                        setRoleFilter(e.target.value);
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
                    <option value="">-- Semua Role --</option>
                    <option value="admin">ADMINISTRATOR SYSTEM</option>
                    <option value="manager">MANAGER FLEET & ASSET</option>
                    <option value="auditor">AUDITOR INTERNAL</option>
                    <option value="staff">STAFF OPERASIONAL</option>
                </select>

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

            {/* Database Warning Banner */}
            {dbError && (
                <div style={{ background: '#fee2e2', color: '#991b1b', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', fontSize: '13px', fontWeight: 600 }}>
                    <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: '8px' }}></i>
                    Status MySQL db_ams: {dbError}.
                </div>
            )}

            {/* Table Section */}
            {loading ? (
                <div style={{ padding: '30px', textAlign: 'center', color: '#00624F', fontWeight: 700 }}>
                    <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '20px', marginBottom: '8px', display: 'block' }}></i>
                    Mengambil Data User dari MySQL db_ams...
                </div>
            ) : (
                <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 700, color: '#475569', width: '40px' }}>No</th>
                                <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Nama Lengkap</th>
                                <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Username</th>
                                <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Role / Wewenang System</th>
                                <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 700, color: '#475569', width: '110px' }}>Status Akun</th>
                                <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 700, color: '#475569', width: '150px' }}>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedData.length === 0 ? (
                                <tr>
                                    <td colSpan="7" style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
                                        <i className="fa-solid fa-users-slash" style={{ fontSize: '32px', color: '#cbd5e1', marginBottom: '8px', display: 'block' }}></i>
                                        Tidak ada data user yang sesuai dengan filter pencarian.
                                    </td>
                                </tr>
                            ) : (
                                paginatedData.map((item, idx) => (
                                    <tr key={item.user_id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '14px 16px', color: '#64748b' }}>{startIndex + idx + 1}</td>
                                        <td style={{ padding: '14px 16px', fontWeight: 800, color: '#0f172a' }}>{item.nama_lengkap}</td>
                                        <td style={{ padding: '14px 16px', color: '#db2777', fontWeight: 600 }}><code>@{item.username}</code></td>
                                        <td style={{ padding: '14px 16px' }}>
                                            <span style={{
                                                display: 'inline-block',
                                                padding: '4px 12px',
                                                borderRadius: '20px',
                                                fontSize: '11px',
                                                fontWeight: 800,
                                                background: '#dcfce7',
                                                color: '#15803d'
                                            }}>
                                                {formatRoleLabel(item.role)}
                                            </span>
                                        </td>
                                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                                            <span style={{
                                                display: 'inline-block',
                                                padding: '3px 10px',
                                                borderRadius: '12px',
                                                fontSize: '11px',
                                                fontWeight: 800,
                                                background: (item.status || '').toUpperCase() === 'AKTIF' ? '#dcfce7' : '#fee2e2',
                                                color: (item.status || '').toUpperCase() === 'AKTIF' ? '#166534' : '#991b1b'
                                            }}>
                                                {(item.status || 'AKTIF').toUpperCase()}
                                            </span>
                                        </td>
                                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                                {canEdit && (
                                                    <button
                                                        onClick={() => handleOpenEdit(item)}
                                                        style={{ background: '#f1f5f9', color: '#0288d1', border: '1px solid #bae6fd', borderRadius: '6px', padding: '5px 10px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}
                                                    >
                                                        <i className="fa-solid fa-pen-to-square"></i> Edit
                                                    </button>
                                                )}
                                                {canDelete && (
                                                    <button
                                                        onClick={() => handleDelete(item)}
                                                        style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: '6px', padding: '5px 10px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}
                                                    >
                                                        <i className="fa-solid fa-trash"></i> Hapus
                                                    </button>
                                                )}
                                                {!canEdit && !canDelete && (
                                                    <span style={{ color: '#94a3b8', fontSize: '11px', fontStyle: 'italic' }}>Read-only</span>
                                                )}
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
            )}

            {/* Modal Form Add / Edit User */}
            {showModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(15, 23, 42, 0.65)',
                    backdropFilter: 'blur(4px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999,
                    padding: '16px'
                }}>
                    <div style={{
                        background: '#fff',
                        borderRadius: '12px',
                        width: '100%',
                        maxWidth: '540px',
                        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
                    }}>
                        <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
                            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <i className="fa-solid fa-user-gear" style={{ color: '#00624F' }}></i>
                                {editingUser ? `Edit Data User (@${editingUser.username})` : 'Tambah Akun Pengguna Baru'}
                            </h3>
                            <button
                                onClick={() => setShowModal(false)}
                                style={{ background: 'transparent', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#64748b' }}
                            >
                                <i className="fa-solid fa-xmark"></i>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                                    Nama Lengkap *
                                </label>
                                <input
                                    type="text"
                                    placeholder="Contoh: Rian Hidayat"
                                    value={form.nama_lengkap}
                                    onChange={e => setForm({ ...form, nama_lengkap: e.target.value })}
                                    required
                                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', outline: 'none' }}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                                        Username Account *
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="rian"
                                        value={form.username}
                                        onChange={e => setForm({ ...form, username: e.target.value })}
                                        required
                                        style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', outline: 'none' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                                        Password {editingUser ? '(Kosongkan jika tidak ubah)' : '*'}
                                    </label>
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            placeholder={editingUser ? '••••••••' : 'Masukkan password'}
                                            value={form.password}
                                            onChange={e => setForm({ ...form, password: e.target.value })}
                                            required={!editingUser}
                                            style={{ width: '100%', padding: '9px 36px 9px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                                        />
                                        <i
                                            className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}
                                            onClick={() => setShowPassword(!showPassword)}
                                            style={{
                                                position: 'absolute',
                                                right: '12px',
                                                top: '11px',
                                                color: '#64748b',
                                                fontSize: '13px',
                                                cursor: 'pointer'
                                            }}
                                        ></i>
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                                        Role / Wewenang System *
                                    </label>
                                    <select
                                        value={form.role}
                                        onChange={e => setForm({ ...form, role: e.target.value })}
                                        style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', outline: 'none', background: '#fff', fontWeight: 700 }}
                                    >
                                        <option value="ADMINISTRATOR SYSTEM">ADMINISTRATOR SYSTEM</option>
                                        <option value="MANAGER FLEET & ASSET">MANAGER FLEET & ASSET</option>
                                        <option value="AUDITOR INTERNAL">AUDITOR INTERNAL</option>
                                        <option value="STAFF OPERASIONAL">STAFF OPERASIONAL</option>
                                        {roles && roles.filter(r => !['admin', 'staff', 'manager', 'auditor'].includes(r.key)).map(r => (
                                            <option key={r.key} value={r.nama_role || r.key}>{(r.nama_role || r.key).toUpperCase()}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                                        Status Akun *
                                    </label>
                                    <select
                                        value={form.status}
                                        onChange={e => setForm({ ...form, status: e.target.value })}
                                        style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', outline: 'none', background: '#fff', fontWeight: 700 }}
                                    >
                                        <option value="AKTIF">AKTIF</option>
                                        <option value="NON-AKTIF">NON-AKTIF</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    style={{ background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '9px 16px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    style={{ background: '#00624F', color: '#fff', border: 'none', borderRadius: '6px', padding: '9px 18px', fontSize: '13px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                                >
                                    {submitting ? (
                                        <>
                                            <i className="fa-solid fa-spinner fa-spin"></i> Menyimpan...
                                        </>
                                    ) : (
                                        <>
                                            <i className="fa-solid fa-floppy-disk"></i> {editingUser ? 'Simpan Perubahan' : 'Simpan User Baru'}
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
