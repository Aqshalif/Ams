import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { Pagination } from '../components/Pagination';

export const LogAktivitas = () => {
    const { checkPermission, showToast } = useData();
    
    const canDelete = checkPermission('log_activity', 'delete');
    
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterRole, setFilterRole] = useState('');
    const [sortOrder, setSortOrder] = useState('terbaru');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const loadLogs = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/mysql/log_activity');
            const text = await res.text();
            if (!text || !text.trim()) {
                setLogs([]);
                setLoading(false);
                return;
            }
            const data = JSON.parse(text);
            if (data && data.success) {
                setLogs(data.data || []);
            } else {
                setLogs([]);
            }
        } catch (err) {
            console.error('Failed to load logs:', err);
            setLogs([]);
        }
        setLoading(false);
    };

    useEffect(() => {
        loadLogs();
    }, []);

    const handleDelete = async (log_id) => {
        if (!window.confirm('Yakin ingin menghapus log ini?')) return;
        try {
            const res = await fetch(`/api/mysql/log_activity/${log_id}`, {
                method: 'DELETE'
            });
            const data = await res.json();
            if (data.success) {
                showToast('success', 'Log berhasil dihapus');
                loadLogs();
            } else {
                showToast('error', data.message || 'Gagal menghapus log');
            }
        } catch (err) {
            showToast('error', 'Terjadi kesalahan sistem');
        }
    };

    const filtered = logs.filter(log => {
        const matchesSearch = (log.action || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                              (log.username || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                              (log.details || '').toLowerCase().includes(searchQuery.toLowerCase());
        const matchesRole = filterRole ? (log.role || '').toLowerCase().includes(filterRole.toLowerCase()) : true;
        return matchesSearch && matchesRole;
    });

    const sortedLogs = [...filtered].sort((a, b) => {
        if (sortOrder === 'terbaru') return b.log_id - a.log_id;
        if (sortOrder === 'terlama') return a.log_id - b.log_id;
        if (sortOrder === 'a-z') return (a.action || '').localeCompare(b.action || '');
        if (sortOrder === 'z-a') return (b.action || '').localeCompare(a.action || '');
        return 0;
    });

    const totalPages = Math.ceil(sortedLogs.length / itemsPerPage);
    const paginated = sortedLogs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <div className="page-container" style={{ padding: '24px', background: '#f8fafc', minHeight: '100vh' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#1e293b', marginBottom: '6px' }}>Log Aktivitas Sistem</h1>
                    <p style={{ color: '#64748b', fontSize: '14px' }}>Pantau dan catat seluruh aktivitas pengguna di dalam sistem AMS.</p>
                </div>
            </div>

            <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', marginBottom: '24px' }}>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '20px' }}>
                    <div style={{ flex: '1 1 300px', position: 'relative' }}>
                        <i className="fa-solid fa-search" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}></i>
                        <input
                            type="text"
                            placeholder="Cari aksi, username, atau detail..."
                            value={searchQuery}
                            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                            style={{
                                width: '100%', padding: '12px 16px 12px 42px', borderRadius: '8px',
                                border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', boxSizing: 'border-box'
                            }}
                        />
                    </div>
                    <select
                        value={filterRole}
                        onChange={(e) => { setFilterRole(e.target.value); setCurrentPage(1); }}
                        style={{
                            padding: '12px 16px', borderRadius: '8px', border: '1px solid #cbd5e1',
                            fontSize: '14px', outline: 'none', minWidth: '200px', background: '#fff'
                        }}
                    >
                        <option value="">Semua Role</option>
                        <option value="admin">Administrator</option>
                        <option value="manager">Manager</option>
                        <option value="staff">Staff</option>
                        <option value="auditor">Auditor</option>
                    </select>
                    <select
                        value={sortOrder}
                        onChange={(e) => { setSortOrder(e.target.value); setCurrentPage(1); }}
                        style={{
                            padding: '12px 16px', borderRadius: '8px', border: '1px solid #cbd5e1',
                            fontSize: '14px', outline: 'none', minWidth: '150px', background: '#fff'
                        }}
                    >
                        <option value="terbaru">Terbaru</option>
                        <option value="terlama">Terlama</option>
                        <option value="a-z">Aksi (A-Z)</option>
                        <option value="z-a">Aksi (Z-A)</option>
                    </select>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                        <thead>
                            <tr style={{ background: '#f1f5f9', color: '#475569' }}>
                                <th style={{ padding: '14px 16px', borderBottom: '1px solid #cbd5e1' }}>ID</th>
                                <th style={{ padding: '14px 16px', borderBottom: '1px solid #cbd5e1' }}>Waktu</th>
                                <th style={{ padding: '14px 16px', borderBottom: '1px solid #cbd5e1' }}>Pengguna</th>
                                <th style={{ padding: '14px 16px', borderBottom: '1px solid #cbd5e1' }}>Role</th>
                                <th style={{ padding: '14px 16px', borderBottom: '1px solid #cbd5e1' }}>Aksi</th>
                                <th style={{ padding: '14px 16px', borderBottom: '1px solid #cbd5e1' }}>Detail</th>
                                {canDelete && <th style={{ padding: '14px 16px', borderBottom: '1px solid #cbd5e1', textAlign: 'center' }}>Opsi</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={canDelete ? 7 : 6} style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                                        <i className="fa-solid fa-circle-notch fa-spin" style={{ marginRight: '8px' }}></i> Memuat log aktivitas...
                                    </td>
                                </tr>
                            ) : paginated.length === 0 ? (
                                <tr>
                                    <td colSpan={canDelete ? 7 : 6} style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                                        Tidak ada log aktivitas ditemukan.
                                    </td>
                                </tr>
                            ) : (
                                paginated.map((log) => (
                                    <tr key={log.log_id} style={{ borderBottom: '1px solid #e2e8f0', transition: 'background 0.2s', ':hover': { background: '#f8fafc' } }}>
                                        <td style={{ padding: '14px 16px', color: '#64748b', fontWeight: 600 }}>#{log.log_id}</td>
                                        <td style={{ padding: '14px 16px' }}>{new Date(log.created_at).toLocaleString('id-ID')}</td>
                                        <td style={{ padding: '14px 16px', fontWeight: 600, color: '#0f172a' }}>{log.username}</td>
                                        <td style={{ padding: '14px 16px' }}>
                                            <span style={{
                                                padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700,
                                                background: '#f1f5f9', color: '#475569', textTransform: 'uppercase'
                                            }}>
                                                {log.role}
                                            </span>
                                        </td>
                                        <td style={{ padding: '14px 16px' }}>
                                            <span style={{ fontWeight: 600, color: '#0369a1' }}>{log.action}</span>
                                        </td>
                                        <td style={{ padding: '14px 16px', color: '#475569' }}>{log.details}</td>
                                        {canDelete && (
                                            <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                                                <button
                                                    onClick={() => handleDelete(log.log_id)}
                                                    style={{
                                                        background: '#fee2e2', color: '#ef4444', border: 'none', padding: '6px 12px',
                                                        borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600
                                                    }}
                                                >
                                                    <i className="fa-solid fa-trash"></i>
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {!loading && filtered.length > 0 && (
                    <div style={{ marginTop: '20px', borderTop: '1px solid #f1f5f9', paddingTop: '20px' }}>
                        <Pagination 
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                            itemsPerPage={itemsPerPage}
                            onItemsPerPageChange={(val) => { setItemsPerPage(val); setCurrentPage(1); }}
                            totalItems={filtered.length}
                            startIndex={(currentPage - 1) * itemsPerPage}
                            endIndex={Math.min(currentPage * itemsPerPage, filtered.length)}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};
