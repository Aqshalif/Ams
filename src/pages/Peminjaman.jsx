import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { Pagination } from '../components/Pagination';

export const Peminjaman = () => {
    const { currentUser, checkPermission, showToast } = useData();

    const [activeTab, setActiveTab] = useState('1. Permohonan Pengajuan');
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [sortOrder, setSortOrder] = useState('terbaru');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [peminjamanList, setPeminjamanList] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState({
        kode: '',
        aset: '',
        peminjam: '',
        asal: 'Head Office Jakarta - Lt. 3',
        tujuan: 'Branch Office Surabaya - Lt. 2',
        tgl_pinjam: new Date().toISOString().split('T')[0],
        tgl_kembali: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
        keterangan: ''
    });

    const subTabs = [
        '1. Permohonan Pengajuan',
        '2. Persetujuan Manager',
        '3. Pengembalian Aset',
        '4. Riwayat Peminjaman'
    ];

    useEffect(() => {
        fetch('/api/mysql/peminjaman')
            .then(res => res.json())
            .then(res => {
                if (res.success && res.data && res.data.length > 0) {
                    const mapped = res.data.map((item, idx) => ({
                        id: item.peminjaman_id || item.id || idx + 1,
                        kode: item.kode || `PJM-${item.peminjaman_id || idx + 1}`,
                        aset: item.aset || `Aset #${item.aset_id || idx + 1}`,
                        peminjam: item.peminjam || (item.user_id === 4 ? 'Rian Hidayat (Auditor)' : 'Staff Operasional'),
                        asal: item.asal || item.lokasi_asal || 'Head Office Jakarta - Lt. 3',
                        tujuan: item.tujuan || item.lokasi_tujuan || 'Branch Office Surabaya - Lt. 2',
                        tgl_pinjam: item.tanggal_pinjam || item.tgl_pinjam || '2026-08-02',
                        tgl_kembali: item.tanggal_kembali || item.tgl_kembali || '2026-08-30',
                        keterangan: item.keterangan || item.keperluan || 'Keperluan operasional tim',
                        status: item.status || (idx % 2 === 0 ? 'Disetujui' : 'Menunggu Persetujuan')
                    }));
                    setPeminjamanList(mapped);
                } else {
                    setPeminjamanList([
                        { id: 1, kode: 'PJM-1', aset: 'Set Kursi Kerja Ergonomis Herman Miller', peminjam: 'Rian Hidayat (Auditor)', asal: 'Head Office Jakarta - Lt. 3', tujuan: 'Branch Office Surabaya - Lt. 2', tgl_pinjam: '2026-08-02', tgl_kembali: '2026-08-30', keterangan: 'Kunjungan audit internal cabang Surabaya', status: 'Disetujui' },
                        { id: 2, kode: 'PJM-2', aset: 'Printer HP LaserJet Enterprise M507', peminjam: 'Staff Operasional', asal: 'Branch Office Surabaya - Lt. 2', tujuan: 'Pool Armada Sunter - Jakarta Utara', tgl_pinjam: '2026-08-06', tgl_kembali: '2026-08-12', keterangan: 'Backup printer operasional pool Sunter', status: 'Menunggu Persetujuan' }
                    ]);
                }
            })
            .catch(() => {
                setPeminjamanList([
                    { id: 1, kode: 'PJM-1', aset: 'Set Kursi Kerja Ergonomis Herman Miller', peminjam: 'Rian Hidayat (Auditor)', asal: 'Head Office Jakarta - Lt. 3', tujuan: 'Branch Office Surabaya - Lt. 2', tgl_pinjam: '2026-08-02', tgl_kembali: '2026-08-30', keterangan: 'Kunjungan audit internal cabang Surabaya', status: 'Disetujui' },
                    { id: 2, kode: 'PJM-2', aset: 'Printer HP LaserJet Enterprise M507', peminjam: 'Staff Operasional', asal: 'Branch Office Surabaya - Lt. 2', tujuan: 'Pool Armada Sunter - Jakarta Utara', tgl_pinjam: '2026-08-06', tgl_kembali: '2026-08-12', keterangan: 'Backup printer operasional pool Sunter', status: 'Menunggu Persetujuan' }
                ]);
            })
            .finally(() => setLoading(false));
    }, []);

    const canAdd = checkPermission('peminjaman', 'add');
    const canApprove = checkPermission('peminjaman', 'approve');
    const canEdit = checkPermission('peminjaman', 'edit');
    const canDelete = checkPermission('peminjaman', 'delete');

    const handleOpenAdd = () => {
        setEditingId(null);
        setForm({
            kode: `PJM-${peminjamanList.length + 1}`,
            aset: '',
            peminjam: currentUser ? currentUser.nama_lengkap : 'Staff Operasional',
            asal: 'Head Office Jakarta - Lt. 3',
            tujuan: 'Branch Office Surabaya - Lt. 2',
            tgl_pinjam: new Date().toISOString().split('T')[0],
            tgl_kembali: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
            keterangan: ''
        });
        setShowModal(true);
    };

    const handleEdit = (item) => {
        setEditingId(item.id);
        setForm({ ...item });
        setShowModal(true);
    };

    const handleDelete = (id) => {
        if (window.confirm('Yakin ingin menghapus permohonan peminjaman ini?')) {
            const updated = peminjamanList.filter(p => p.id !== id);
            setPeminjamanList(updated);
            showToast('info', 'Permohonan peminjaman berhasil dihapus.');
        }
    };

    const handleSave = (e) => {
        e.preventDefault();
        if (editingId) {
            const updated = peminjamanList.map(p => p.id === editingId ? { ...p, ...form } : p);
            setPeminjamanList(updated);
            showToast('success', 'Data peminjaman berhasil diperbarui.');
        } else {
            const newItem = {
                id: Date.now(),
                ...form,
                status: 'Menunggu Persetujuan'
            };
            setPeminjamanList([newItem, ...peminjamanList]);
            showToast('success', 'Permohonan peminjaman baru berhasil DIAJUKAN (Menunggu Persetujuan Manager).');
        }
        setShowModal(false);
    };

    const handleApprove = (id) => {
        const updated = peminjamanList.map(p => p.id === id ? { ...p, status: 'Disetujui' } : p);
        setPeminjamanList(updated);
        showToast('success', 'Peminjaman berhasil DISETUJUI oleh Manager!');
    };

    const handleReturn = (id) => {
        const updated = peminjamanList.map(p => p.id === id ? { ...p, status: 'Dikembalikan' } : p);
        setPeminjamanList(updated);
        showToast('info', 'Aset telah sukses DIKEMBALIKAN ke lokasi asal.');
    };

    const getStatusStyle = (st) => {
        const s = (st || '').toUpperCase();
        if (s.includes('KEMBALI')) {
            return { background: '#e0f2fe', color: '#0369a1', label: 'DIKEMBALIKAN' };
        } else if (s.includes('SETUJU')) {
            return { background: '#dcfce7', color: '#166534', label: 'DISETUJUI' };
        } else {
            return { background: '#fef3c7', color: '#92400e', label: 'MENUNGGU PERSETUJUAN' };
        }
    };

    const filtered = peminjamanList.filter(item => {
        const matchesSearch = !searchQuery || JSON.stringify(item).toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = !statusFilter || item.status === statusFilter;

        if (activeTab === '2. Persetujuan Manager') {
            return matchesSearch && item.status === 'Menunggu Persetujuan';
        } else if (activeTab === '3. Pengembalian Aset') {
            return matchesSearch && item.status === 'Disetujui';
        } else if (activeTab === '4. Riwayat Peminjaman') {
            return matchesSearch && item.status === 'Dikembalikan';
        }

        return matchesSearch && matchesStatus;
    });

    const sortedFiltered = [...filtered].sort((a, b) => {
        if (sortOrder === 'terbaru') return (b.id || 0) - (a.id || 0);
        if (sortOrder === 'terlama') return (a.id || 0) - (b.id || 0);
        if (sortOrder === 'nama_asc') return (a.aset || '').localeCompare(b.aset || '');
        if (sortOrder === 'nama_desc') return (b.aset || '').localeCompare(a.aset || '');
        return 0;
    });

    const totalItems = sortedFiltered.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedData = sortedFiltered.slice(startIndex, startIndex + itemsPerPage);

    return (
        <div>
            {/* Header Section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>Peminjaman Aset Kantor & Fleet</h2>
                    <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>Permohonan, mutasi lokasi, evaluasi approval, dan pengembalian aset.</p>
                </div>
                {canAdd && (
                    <button onClick={handleOpenAdd} style={{
                        background: '#00624F',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '10px 18px',
                        fontSize: '13px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}>
                        <i className="fa-solid fa-circle-plus"></i> Ajukan Peminjaman
                    </button>
                )}
            </div>

            {/* Sub-Tabs Navigation */}
            <div style={{ display: 'flex', gap: '24px', borderBottom: '1px solid #e2e8f0', marginBottom: '20px', overflowX: 'auto' }}>
                {subTabs.map(tab => (
                    <button
                        key={tab}
                        onClick={() => {
                            setActiveTab(tab);
                            setCurrentPage(1);
                        }}
                        style={{
                            background: 'none',
                            border: 'none',
                            padding: '10px 0',
                            fontSize: '14px',
                            fontWeight: activeTab === tab ? 800 : 600,
                            color: activeTab === tab ? '#00624F' : '#64748b',
                            borderBottom: activeTab === tab ? '3px solid #00624F' : '3px solid transparent',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Filter Bar Container */}
            <div style={{
                background: '#fff',
                padding: '14px 18px',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
                marginBottom: '20px',
                display: 'flex',
                gap: '12px',
                alignItems: 'center',
                boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                flexWrap: 'wrap'
            }}>
                <input
                    type="text"
                    placeholder="Cari no peminjaman, peminjam, aset..."
                    value={searchQuery}
                    onChange={e => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                    }}
                    style={{
                        flex: 1,
                        minWidth: '220px',
                        padding: '9px 14px',
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px',
                        fontSize: '13px',
                        outline: 'none'
                    }}
                />
                <select
                    value={statusFilter}
                    onChange={e => {
                        setStatusFilter(e.target.value);
                        setCurrentPage(1);
                    }}
                    style={{
                        padding: '9px 14px',
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: 600,
                        color: '#334155',
                        background: '#fff'
                    }}
                >
                    <option value="">-- Semua Status --</option>
                    <option value="Menunggu Persetujuan">Menunggu Persetujuan</option>
                    <option value="Disetujui">Disetujui</option>
                    <option value="Dikembalikan">Dikembalikan</option>
                </select>

                <select
                    value={sortOrder}
                    onChange={e => {
                        setSortOrder(e.target.value);
                        setCurrentPage(1);
                    }}
                    style={{
                        padding: '9px 14px',
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: 600,
                        color: '#334155',
                        background: '#fff'
                    }}
                >
                    <option value="terbaru">Urutkan: Terbaru</option>
                    <option value="terlama">Urutkan: Terlama</option>
                    <option value="nama_asc">Aset (A - Z)</option>
                    <option value="nama_desc">Aset (Z - A)</option>
                </select>
            </div>

            {/* Table Section */}
            {loading ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#00624F', fontWeight: 700 }}>
                    <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '8px' }}></i> Memuat Data Peminjaman...
                </div>
            ) : (
                <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 700, color: '#475569', width: '40px' }}>No</th>
                                <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 700, color: '#475569', width: '80px' }}>Kode</th>
                                <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Aset</th>
                                <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Peminjam</th>
                                <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Lokasi Asal</th>
                                <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Lokasi Tujuan</th>
                                <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Tgl Pinjam - Kembali</th>
                                <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 700, color: '#475569', width: '160px' }}>Status</th>
                                <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 700, color: '#475569', width: '160px' }}>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedData.length === 0 ? (
                                <tr>
                                    <td colSpan={9} style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                                        Tidak ada data permohonan peminjaman pada kategori tab "{activeTab}".
                                    </td>
                                </tr>
                            ) : (
                                paginatedData.map((item, idx) => {
                                    const badge = getStatusStyle(item.status);
                                    return (
                                        <tr key={item.id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={{ padding: '14px 16px', color: '#64748b' }}>{startIndex + idx + 1}</td>
                                            <td style={{ padding: '14px 16px', color: '#64748b' }}>{item.kode}</td>
                                            <td style={{ padding: '14px 16px', fontWeight: 800, color: '#0f172a' }}>{item.aset}</td>
                                            <td style={{ padding: '14px 16px', color: '#334155' }}>{item.peminjam}</td>
                                            <td style={{ padding: '14px 16px', color: '#64748b' }}>{item.asal}</td>
                                            <td style={{ padding: '14px 16px', color: '#64748b' }}>{item.tujuan}</td>
                                            <td style={{ padding: '14px 16px', color: '#64748b' }}>{`${item.tgl_pinjam} s/d ${item.tgl_kembali}`}</td>
                                            <td style={{ padding: '14px 16px' }}>
                                                <span style={{
                                                    display: 'inline-block',
                                                    padding: '4px 12px',
                                                    borderRadius: '20px',
                                                    fontSize: '11px',
                                                    fontWeight: 800,
                                                    background: badge.background,
                                                    color: badge.color
                                                }}>
                                                    {badge.label}
                                                </span>
                                            </td>
                                            <td style={{ padding: '14px 16px' }}>
                                                <div style={{ display: 'flex', gap: '6px' }}>
                                                    {canApprove && item.status === 'Menunggu Persetujuan' && (
                                                        <button
                                                            onClick={() => handleApprove(item.id)}
                                                            style={{ background: '#16a34a', color: '#fff', border: 'none', borderRadius: '4px', padding: '4px 8px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                                                        >
                                                            <i className="fa-solid fa-check"></i> Setujui
                                                        </button>
                                                    )}
                                                    {item.status === 'Disetujui' && (
                                                        <button
                                                            onClick={() => handleReturn(item.id)}
                                                            style={{ background: '#0288d1', color: '#fff', border: 'none', borderRadius: '4px', padding: '4px 8px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                                                        >
                                                            <i className="fa-solid fa-arrow-rotate-left"></i> Kembalikan
                                                        </button>
                                                    )}
                                                    {canEdit && (
                                                        <button onClick={() => handleEdit(item)} style={{ background: 'none', border: 'none', color: '#0288d1', fontWeight: 700, cursor: 'pointer', fontSize: '12px' }}>
                                                            <i className="fa-solid fa-pen"></i> Edit
                                                        </button>
                                                    )}
                                                    {canDelete && (
                                                        <button onClick={() => handleDelete(item.id)} style={{ background: 'none', border: 'none', color: '#dc2626', fontWeight: 700, cursor: 'pointer', fontSize: '12px' }}>
                                                            <i className="fa-solid fa-trash"></i> Hapus
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
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

            {/* Modal Permohonan Peminjaman */}
            {showModal && (
                <div className="modal show">
                    <div className="modal-content" style={{ maxWidth: '550px' }}>
                        <div className="modal-header">
                            <h3>{editingId ? 'Edit Peminjaman Aset' : 'Ajukan Permohonan Peminjaman Aset'}</h3>
                            <span className="close-btn" onClick={() => setShowModal(false)}>&times;</span>
                        </div>
                        <form onSubmit={handleSave}>
                            <div className="form-group" style={{ marginBottom: '14px' }}>
                                <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>Nama Aset Armada Yang Dipinjam</label>
                                <input
                                    type="text"
                                    value={form.aset}
                                    onChange={e => setForm({ ...form, aset: e.target.value })}
                                    placeholder="Contoh: Blind Van Gran Max / Laptop Dell XPS 15"
                                    required
                                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px' }}
                                />
                            </div>

                            <div className="form-group" style={{ marginBottom: '14px' }}>
                                <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>Nama Peminjam (Driver / Staff)</label>
                                <input
                                    type="text"
                                    value={form.peminjam}
                                    onChange={e => setForm({ ...form, peminjam: e.target.value })}
                                    required
                                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px' }}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '12px', marginBottom: '14px' }}>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>Lokasi Asal</label>
                                    <input
                                        type="text"
                                        value={form.asal}
                                        onChange={e => setForm({ ...form, asal: e.target.value })}
                                        required
                                        style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px' }}
                                    />
                                </div>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>Lokasi Tujuan</label>
                                    <input
                                        type="text"
                                        value={form.tujuan}
                                        onChange={e => setForm({ ...form, tujuan: e.target.value })}
                                        required
                                        style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px' }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '12px', marginBottom: '14px' }}>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>Tanggal Pinjam</label>
                                    <input
                                        type="date"
                                        value={form.tgl_pinjam}
                                        onChange={e => setForm({ ...form, tgl_pinjam: e.target.value })}
                                        required
                                        style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px' }}
                                    />
                                </div>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>Estimasi Tanggal Kembali</label>
                                    <input
                                        type="date"
                                        value={form.tgl_kembali}
                                        onChange={e => setForm({ ...form, tgl_kembali: e.target.value })}
                                        required
                                        style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px' }}
                                    />
                                </div>
                            </div>

                            <div className="form-group" style={{ marginBottom: '20px' }}>
                                <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>Keperluan / Catatan</label>
                                <textarea
                                    value={form.keterangan}
                                    onChange={e => setForm({ ...form, keterangan: e.target.value })}
                                    rows={3}
                                    placeholder="Jelaskan keperluan peminjaman armada..."
                                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px' }}
                                />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                <button type="button" onClick={() => setShowModal(false)} style={{ background: '#e2e8f0', color: '#334155', border: 'none', borderRadius: '6px', padding: '8px 16px', fontWeight: 700, cursor: 'pointer' }}>Batal</button>
                                <button type="submit" style={{ background: '#00624F', color: '#fff', border: 'none', borderRadius: '6px', padding: '8px 18px', fontWeight: 700, cursor: 'pointer' }}>
                                    Simpan & Ajukan Peminjaman
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
