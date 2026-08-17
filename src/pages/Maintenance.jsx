import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { Pagination } from '../components/Pagination';

export const Maintenance = () => {
    const { currentUser, checkPermission, showToast } = useData();
    const canAdd = checkPermission('maintenance', 'add');
    const canFinish = checkPermission('maintenance', 'finish');
    const canEdit = checkPermission('maintenance', 'edit');
    const canDelete = checkPermission('maintenance', 'delete');

    const [activeTab, setActiveTab] = useState('1. Servis Dalam Perbaikan');
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [sortOrder, setSortOrder] = useState('terbaru');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [dataList, setDataList] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState({
        kode_spk: '',
        aset: '',
        teknisi: '',
        deskripsi: '',
        biaya: 2450000,
        tanggal: new Date().toISOString().split('T')[0]
    });

    const subTabs = [
        '1. Servis Dalam Perbaikan',
        '2. Evaluasi Selesai Servis',
        '3. Riwayat Maintenance'
    ];

    useEffect(() => {
        fetch('/api/mysql/maintenance')
            .then(res => res.json())
            .then(res => {
                if (res.success && res.data && res.data.length > 0) {
                    const mapped = res.data.map((item, idx) => ({
                        id: item.maintenance_id || item.id || idx + 1,
                        kode_spk: item.kode_spk || (item.kode_aset ? `SPK-${item.kode_aset}` : `SPK-MNT-${String(item.maintenance_id || idx + 1).padStart(4, '0')}`),
                        aset: item.aset || item.nama_aset || (item.aset_id ? `Aset ID #${item.aset_id}` : 'Unit Aset'),
                        teknisi: item.teknisi || 'Teknisi Maintenance',
                        deskripsi: item.keterangan || item.deskripsi || item.jenis_perawatan || 'Servis Berkala & Maintenance',
                        biaya: Number(item.biaya || item.biaya_perbaikan || 0),
                        tanggal: item.tanggal_maintenance ? String(item.tanggal_maintenance).split('T')[0] : (item.tanggal || '2026-08-10'),
                        status: item.status || (idx % 2 === 0 ? 'Dalam Pengerjaan' : 'Selesai Servis')
                    }));
                    setDataList(mapped);
                } else {
                    setDataList([
                        { id: 1, kode_spk: 'SPK-MNT-9901', aset: 'Toyota Hilux B 9123 FLT', teknisi: 'Bengkel Resmi Auto2000 Cikarang', deskripsi: 'Ganti Oli & Servis Berkala 50.000 KM', biaya: 2450000, tanggal: '2026-08-10', status: 'Dalam Pengerjaan' },
                        { id: 2, kode_spk: 'SPK-MNT-9902', aset: 'Genset Silent Honda 5000W', teknisi: 'Bengkel Teknik Utama', deskripsi: 'Overhaul Dinamo & Replacement Filter', biaya: 4200000, tanggal: '2026-08-08', status: 'Selesai Servis' }
                    ]);
                }
            })
            .catch(() => {
                setDataList([
                    { id: 1, kode_spk: 'SPK-MNT-9901', aset: 'Toyota Hilux B 9123 FLT', teknisi: 'Bengkel Resmi Auto2000 Cikarang', deskripsi: 'Ganti Oli & Servis Berkala 50.000 KM', biaya: 2450000, tanggal: '2026-08-10', status: 'Dalam Pengerjaan' },
                    { id: 2, kode_spk: 'SPK-MNT-9902', aset: 'Genset Silent Honda 5000W', teknisi: 'Bengkel Teknik Utama', deskripsi: 'Overhaul Dinamo & Replacement Filter', biaya: 4200000, tanggal: '2026-08-08', status: 'Selesai Servis' }
                ]);
            })
            .finally(() => setLoading(false));
    }, []);

    const formatRupiah = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val || 0);

    const handleOpenAdd = () => {
        setEditingId(null);
        setForm({
            kode_spk: `SPK-MNT-${Date.now().toString().slice(-4)}`,
            aset: '',
            teknisi: 'Bengkel Resmi Auto2000 Cikarang',
            deskripsi: '',
            biaya: 1500000,
            tanggal: new Date().toISOString().split('T')[0]
        });
        setShowModal(true);
    };

    const handleEdit = (item) => {
        setEditingId(item.id);
        setForm({ ...item });
        setShowModal(true);
    };

    const handleDelete = (id) => {
        if (window.confirm('Yakin ingin menghapus record SPK servis ini?')) {
            const updated = dataList.filter(d => d.id !== id);
            setDataList(updated);
            showToast('info', 'Record maintenance berhasil dihapus.');
        }
    };

    const handleSave = (e) => {
        e.preventDefault();
        if (editingId) {
            const updated = dataList.map(d => d.id === editingId ? { ...d, ...form } : d);
            setDataList(updated);
            showToast('success', 'Data SPK Maintenance berhasil diperbarui.');
        } else {
            const newItem = {
                id: Date.now(),
                ...form,
                status: 'Dalam Pengerjaan'
            };
            setDataList([newItem, ...dataList]);
            showToast('success', 'SPK Maintenance baru berhasil DIBUAT.');
        }
        setShowModal(false);
    };

    const handleFinishService = (id) => {
        const updated = dataList.map(d => d.id === id ? { ...d, status: 'Selesai Servis' } : d);
        setDataList(updated);
        showToast('success', 'Perbaikan armada telah selesai dan disetujui (Status: Selesai Servis).');
    };

    const getStatusStyle = (st) => {
        const s = (st || '').toUpperCase();
        if (s.includes('SELESAI')) {
            return { background: '#dcfce7', color: '#166534', label: 'SELESAI SERVIS' };
        } else {
            return { background: '#fef3c7', color: '#92400e', label: 'DALAM PENGERJAAN' };
        }
    };

    const filtered = dataList.filter(item => {
        const matchesSearch = !searchQuery || JSON.stringify(item).toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = !statusFilter || item.status === statusFilter;

        if (activeTab === '1. Servis Dalam Perbaikan') {
            return matchesSearch && item.status === 'Dalam Pengerjaan';
        } else if (activeTab === '2. Evaluasi Selesai Servis') {
            return matchesSearch && item.status === 'Selesai Servis';
        }

        return matchesSearch && matchesStatus;
    });

    const sortedFiltered = [...filtered].sort((a, b) => {
        if (sortOrder === 'terbaru') return (b.id || 0) - (a.id || 0);
        if (sortOrder === 'terlama') return (a.id || 0) - (b.id || 0);
        if (sortOrder === 'nama_asc') return (a.aset || '').localeCompare(b.aset || '');
        if (sortOrder === 'nama_desc') return (b.aset || '').localeCompare(a.aset || '');
        if (sortOrder === 'biaya_desc') return (b.biaya || 0) - (a.biaya || 0);
        if (sortOrder === 'biaya_asc') return (a.biaya || 0) - (b.biaya || 0);
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
                    <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>Maintenance</h2>
                    <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>Jadwal perawatan rutin, perbaikan kerusakan, biaya bengkel, dan teknisi penanggungjawab.</p>
                </div>
                {canAdd && (
                    <button onClick={handleOpenAdd} style={{
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
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}>
                        <i className="fa-solid fa-circle-plus"></i> Tambah SPK Maintenance
                    </button>
                )}
            </div>

            {/* Sub-Tabs Navigation */}
            <div style={{ display: 'flex', gap: '24px', borderBottom: '1px solid #e2e8f0', marginBottom: '20px' }}>
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
                            cursor: 'pointer'
                        }}
                    >
                        {tab}
                    </button>
                ))}
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
                boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                flexWrap: 'wrap'
            }}>
                <input
                    type="text"
                    placeholder="Cari no SPK, aset, teknisi..."
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
                    <option value="Dalam Pengerjaan">Dalam Pengerjaan</option>
                    <option value="Selesai Servis">Selesai Servis</option>
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
                    <option value="biaya_desc">Biaya (Highest)</option>
                    <option value="biaya_asc">Biaya (Lowest)</option>
                </select>
            </div>

            {/* Table Section */}
            {loading ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#00624F', fontWeight: 700 }}>
                    <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '8px' }}></i> Memuat Data Servis Maintenance...
                </div>
            ) : (
                <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 700, color: '#475569', width: '40px' }}>No</th>
                                <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 700, color: '#475569', width: '120px' }}>No SPK Servis</th>
                                <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Target Aset Unit</th>
                                <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Teknisi / Bengkel</th>
                                <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Deskripsi Perawatan</th>
                                <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Biaya Perbaikan</th>
                                <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 700, color: '#475569', width: '150px' }}>Status</th>
                                <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 700, color: '#475569', width: '160px' }}>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedData.length === 0 ? (
                                <tr>
                                    <td colSpan={8} style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                                        Tidak ada data maintenance pada sub-tab "{activeTab}".
                                    </td>
                                </tr>
                            ) : (
                                paginatedData.map((item, idx) => {
                                    const badge = getStatusStyle(item.status);
                                    return (
                                        <tr key={item.id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={{ padding: '14px 16px', color: '#64748b' }}>{startIndex + idx + 1}</td>
                                            <td style={{ padding: '14px 16px', color: '#64748b' }}><code>{item.kode_spk}</code></td>
                                            <td style={{ padding: '14px 16px', fontWeight: 800, color: '#0f172a' }}>{item.aset}</td>
                                            <td style={{ padding: '14px 16px', color: '#334155' }}>{item.teknisi}</td>
                                            <td style={{ padding: '14px 16px', color: '#64748b' }}>{item.deskripsi}</td>
                                            <td style={{ padding: '14px 16px', fontWeight: 800, color: '#00624F' }}>{formatRupiah(item.biaya)}</td>
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
                                                    {item.status === 'Dalam Pengerjaan' && (
                                                        <button
                                                            onClick={() => handleFinishService(item.id)}
                                                            style={{ background: '#16a34a', color: '#fff', border: 'none', borderRadius: '4px', padding: '4px 8px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                                                        >
                                                            <i className="fa-solid fa-check"></i> Selesai Servis
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

            {/* Modal Pop-up Form SPK Maintenance */}
            {showModal && (
                <div className="modal show">
                    <div className="modal-content" style={{ maxWidth: '550px' }}>
                        <div className="modal-header">
                            <h3>{editingId ? 'Edit SPK Maintenance' : 'Buat SPK Maintenance Baru'}</h3>
                            <span className="close-btn" onClick={() => setShowModal(false)}>&times;</span>
                        </div>
                        <form onSubmit={handleSave}>
                            <div className="form-group" style={{ marginBottom: '14px' }}>
                                <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>Target Unit Aset Armada</label>
                                <input
                                    type="text"
                                    value={form.aset}
                                    onChange={e => setForm({ ...form, aset: e.target.value })}
                                    placeholder="Contoh: Toyota Hilux B 9123 FLT"
                                    required
                                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px' }}
                                />
                            </div>

                            <div className="form-group" style={{ marginBottom: '14px' }}>
                                <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>Nama Bengkel / Teknisi Penanggungjawab</label>
                                <input
                                    type="text"
                                    value={form.teknisi}
                                    onChange={e => setForm({ ...form, teknisi: e.target.value })}
                                    required
                                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px' }}
                                />
                            </div>

                            <div className="form-group" style={{ marginBottom: '14px' }}>
                                <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>Estimasi Biaya Perbaikan (Rp)</label>
                                <input
                                    type="number"
                                    value={form.biaya}
                                    onChange={e => setForm({ ...form, biaya: Number(e.target.value) })}
                                    required
                                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px' }}
                                />
                            </div>

                            <div className="form-group" style={{ marginBottom: '20px' }}>
                                <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>Deskripsi Rincian Perawatan</label>
                                <textarea
                                    value={form.deskripsi}
                                    onChange={e => setForm({ ...form, deskripsi: e.target.value })}
                                    rows={3}
                                    placeholder="Jelaskan detail perbaikan/servis berkala..."
                                    required
                                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px' }}
                                />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                <button type="button" onClick={() => setShowModal(false)} style={{ background: '#e2e8f0', color: '#334155', border: 'none', borderRadius: '6px', padding: '8px 16px', fontWeight: 700, cursor: 'pointer' }}>Batal</button>
                                <button type="submit" style={{ background: '#00624F', color: '#fff', border: 'none', borderRadius: '6px', padding: '8px 18px', fontWeight: 700, cursor: 'pointer' }}>
                                    Simpan SPK Maintenance
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
