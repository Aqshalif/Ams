import React, { useState, useEffect } from 'react';
import { Pagination } from '../components/Pagination';
import { useData } from '../context/DataContext';

export const Aset = () => {
    const { checkPermission, logActivity } = useData();
    const canAdd = checkPermission('aset', 'add');
    const canEdit = checkPermission('aset', 'edit');
    const canDelete = checkPermission('aset', 'delete');

    const [asetList, setAsetList] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [sortOrder, setSortOrder] = useState('terbaru');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [loading, setLoading] = useState(true);
    const [dbError, setDbError] = useState(null);

    // Modal & Form State for "Tambah" & "Edit" Aset
    const [showModal, setShowModal] = useState(false);
    const [editingAset, setEditingAset] = useState(null); // null = Tambah, object = Edit
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({
        nama_aset: '',
        kategori_id: '1',
        lokasi_id: '1',
        supplier_id: '1',
        merk: '',
        nomor_seri: '',
        harga_beli: '',
        tanggal_beli: new Date().toISOString().split('T')[0],
        kondisi: 'Baik',
        status: 'Tersedia'
    });

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

    const loadAsetFromMySQL = async () => {
        setLoading(true);
        setDbError(null);
        try {
            const res = await safeFetchJSON('/api/mysql/aset');
            if (res && res.data) {
                const mapped = (res.data || []).map((item, idx) => ({
                    ...item,
                    aset_id: item.aset_id || item.id || idx + 1,
                    kode_aset: item.kode_aset || item.kode || item.asset_code || `AST-OFF-${String(idx + 1).padStart(4, '0')}`,
                    nama_aset: item.nama_aset || item.nama || item.name || item.nama_barang || 'Unit Aset Armada',
                    kategori_id: item.kategori_id || 1,
                    lokasi_id: item.lokasi_id || 1,
                    kategori: item.kategori || item.nama_kategori || 'Perangkat IT & Komputer',
                    lokasi: item.lokasi || item.nama_lokasi || 'Ruang Server Lt 1',
                    merk: item.merk || '-',
                    nomor_seri: item.nomor_seri || '-',
                    harga_beli: Number(item.harga_beli || item.harga || item.harga_perolehan || item.nilai || 0),
                    status: item.status || item.status_aset || 'Tersedia',
                    kondisi: item.kondisi || 'Baik'
                }));
                setAsetList(mapped);
            }
        } catch (err) {
            setDbError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAsetFromMySQL();
    }, []);

    const resetForm = () => {
        setEditingAset(null);
        setForm({
            nama_aset: '',
            kategori_id: '1',
            lokasi_id: '1',
            supplier_id: '1',
            merk: '',
            nomor_seri: '',
            harga_beli: '',
            tanggal_beli: new Date().toISOString().split('T')[0],
            kondisi: 'Baik',
            status: 'Tersedia'
        });
    };

    const handleOpenAdd = () => {
        resetForm();
        setShowModal(true);
    };

    const handleOpenEdit = (item) => {
        setEditingAset(item);
        setForm({
            nama_aset: item.nama_aset || '',
            kategori_id: String(item.kategori_id || '1'),
            lokasi_id: String(item.lokasi_id || '1'),
            supplier_id: String(item.supplier_id || '1'),
            merk: item.merk !== '-' ? item.merk : '',
            nomor_seri: item.nomor_seri !== '-' ? item.nomor_seri : '',
            harga_beli: item.harga_beli || '',
            tanggal_beli: item.tanggal_beli ? new Date(item.tanggal_beli).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            kondisi: item.kondisi || 'Baik',
            status: item.status || 'Tersedia'
        });
        setShowModal(true);
    };

    const handleDelete = async (item) => {
        if (!window.confirm(`Apakah Anda yakin ingin MENGHAPUS aset "${item.kode_aset} - ${item.nama_aset}" dari MySQL Database db_ams?`)) {
            return;
        }

        try {
            const res = await safeFetchJSON(`/api/mysql/aset/${item.aset_id}`, {
                method: 'DELETE'
            });

            if (res && res.success) {
                alert(` Berhasil! Data aset ${item.kode_aset} (${item.nama_aset}) telah dihapus dari database.`);
                logActivity('Hapus Aset', `Menghapus aset ${item.kode_aset} - ${item.nama_aset}`);
                await loadAsetFromMySQL();
            } else {
                alert(`Gagal menghapus aset: ${res?.message || 'Terjadi kesalahan'}`);
            }
        } catch (err) {
            alert(`Error: ${err.message}`);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.nama_aset.trim()) {
            alert('Nama Aset wajib diisi!');
            return;
        }

        setSubmitting(true);
        try {
            let url = '/api/mysql/aset';
            let method = 'POST';

            if (editingAset) {
                url = `/api/mysql/aset/${editingAset.aset_id}`;
                method = 'PUT';
            }

            const res = await safeFetchJSON(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });

            if (res && res.success) {
                alert(` Berhasil! Aset "${form.nama_aset}" telah ${editingAset ? 'diperbarui' : 'ditambahkan'} di database db_ams.`);
                logActivity(editingAset ? 'Edit Aset' : 'Tambah Aset', `${editingAset ? 'Memperbarui' : 'Menambahkan'} aset ${form.nama_aset} ke dalam database`);
                setShowModal(false);
                resetForm();
                await loadAsetFromMySQL();
            } else {
                alert(`Gagal menyimpan aset: ${res?.message || 'Terjadi kesalahan'}`);
            }
        } catch (err) {
            alert(`Error: ${err.message}`);
        } finally {
            setSubmitting(false);
        }
    };

    const formatRupiah = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val || 0);

    const getStatusStyle = (st) => {
        const s = (st || '').toUpperCase();
        if (s.includes('NON') || s.includes('RUSAK')) {
            return { background: '#fee2e2', color: '#991b1b', label: 'NON-AKTIF' };
        } else if (s.includes('PINJAM') || s.includes('DIPINJAM')) {
            return { background: '#e0f2fe', color: '#0369a1', label: 'DIPINJAM' };
        } else if (s.includes('RAWAT') || s.includes('PERAWATAN')) {
            return { background: '#fef3c7', color: '#92400e', label: 'DALAM PERAWATAN' };
        } else {
            return { background: '#dcfce7', color: '#166534', label: 'TERSEDIA' };
        }
    };

    const filtered = asetList.filter(item => {
        const mSearch = !searchQuery || JSON.stringify(item).toLowerCase().includes(searchQuery.toLowerCase());
        const mCat = !categoryFilter || (item.kategori || '').toLowerCase().includes(categoryFilter.toLowerCase());
        const mStatus = !statusFilter || (item.status || '').toLowerCase() === statusFilter.toLowerCase();
        return mSearch && mCat && mStatus;
    });

    const sortedFiltered = [...filtered].sort((a, b) => {
        if (sortOrder === 'terbaru') return (b.aset_id || 0) - (a.aset_id || 0);
        if (sortOrder === 'terlama') return (a.aset_id || 0) - (b.aset_id || 0);
        if (sortOrder === 'nama_asc') return (a.nama_aset || '').localeCompare(b.nama_aset || '');
        if (sortOrder === 'nama_desc') return (b.nama_aset || '').localeCompare(a.nama_aset || '');
        if (sortOrder === 'harga_desc') return (b.harga_beli || 0) - (a.harga_beli || 0);
        if (sortOrder === 'harga_asc') return (a.harga_beli || 0) - (b.harga_beli || 0);
        return 0;
    });

    const totalItems = sortedFiltered.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedData = sortedFiltered.slice(startIndex, startIndex + itemsPerPage);

    return (
        <div style={{ padding: '4px' }}>
            {/* Header Section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>Pengelolaan Inventaris Aset</h2>
                    <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
                        Daftar seluruh barang dan unit inventaris aset perusahaan ({asetList.length} Total Item).
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
                        <i className="fa-solid fa-circle-plus"></i> + Tambah Aset
                    </button>
                )}
            </div>

            {/* Filter & Search Bar */}
            <div style={{ background: '#fff', padding: '14px 18px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '20px', display: 'flex', gap: '12px', flexWrap: 'wrap', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
                <input
                    type="text"
                    placeholder="Cari kode aset, nama barang, merk..."
                    value={searchQuery}
                    onChange={e => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                    }}
                    style={{ flex: 1, minWidth: '220px', padding: '9px 14px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', outline: 'none' }}
                />
                <select
                    value={categoryFilter}
                    onChange={e => {
                        setCategoryFilter(e.target.value);
                        setCurrentPage(1);
                    }}
                    style={{ padding: '9px 14px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', background: '#fff', fontWeight: 600, color: '#334155' }}
                >
                    <option value="">-- Semua Kategori --</option>
                    <option value="Perangkat IT">Perangkat IT & Komputer</option>
                    <option value="Network">Network & Infrastructure</option>
                    <option value="Mebel">Mebel & Furnitur Kantor</option>
                    <option value="Elektronik">Elektronik Kantor</option>
                    <option value="Keamanan">Keamanan & Akses Kantor</option>
                </select>
                <select
                    value={statusFilter}
                    onChange={e => {
                        setStatusFilter(e.target.value);
                        setCurrentPage(1);
                    }}
                    style={{ padding: '9px 14px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', background: '#fff', fontWeight: 600, color: '#334155' }}
                >
                    <option value="">-- Semua Status --</option>
                    <option value="Tersedia">Tersedia</option>
                    <option value="Dipinjam">Dipinjam</option>
                    <option value="Dalam Perawatan">Dalam Perawatan</option>
                    <option value="Rusak">Rusak / Non-Aktif</option>
                </select>
                <select
                    value={sortOrder}
                    onChange={e => {
                        setSortOrder(e.target.value);
                        setCurrentPage(1);
                    }}
                    style={{ padding: '9px 14px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', background: '#fff', fontWeight: 600, color: '#334155' }}
                >
                    <option value="terbaru">Urutkan: Terbaru</option>
                    <option value="terlama">Urutkan: Terlama</option>
                    <option value="nama_asc">Nama (A - Z)</option>
                    <option value="nama_desc">Nama (Z - A)</option>
                    <option value="harga_desc">Harga (Highest)</option>
                    <option value="harga_asc">Harga (Lowest)</option>
                </select>
            </div>

            {/* Asset Table */}
            <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                            <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 700, color: '#475569', width: '50px' }}>No</th>
                            <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Kode Aset</th>
                            <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Nama Barang / Unit Aset</th>
                            <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Kategori</th>
                            <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Lokasi Penempatan</th>
                            <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Nilai / Harga (Rp)</th>
                            <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 700, color: '#475569', width: '110px' }}>Status</th>
                            <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 700, color: '#475569', width: '150px' }}>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="8" style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
                                    <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '24px', color: '#00624F', marginBottom: '8px', display: 'block' }}></i>
                                    Memuat data aset dari database MySQL...
                                </td>
                            </tr>
                        ) : paginatedData.length === 0 ? (
                            <tr>
                                <td colSpan="8" style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
                                    <i className="fa-solid fa-box-open" style={{ fontSize: '32px', color: '#cbd5e1', marginBottom: '8px', display: 'block' }}></i>
                                    Tidak ada data aset yang sesuai dengan pencarian.
                                </td>
                            </tr>
                        ) : (
                            paginatedData.map((item, idx) => {
                                const stStyle = getStatusStyle(item.status);
                                return (
                                    <tr key={item.aset_id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '14px 16px', color: '#64748b', fontWeight: 600 }}>{idx + 1}</td>
                                        <td style={{ padding: '14px 16px', fontWeight: 800, color: '#00624F' }}>
                                            <code style={{ background: '#e6f4f1', padding: '3px 8px', borderRadius: '4px' }}>{item.kode_aset}</code>
                                        </td>
                                        <td style={{ padding: '14px 16px', fontWeight: 700, color: '#0f172a' }}>
                                            {item.nama_aset}
                                            {item.merk && item.merk !== '-' && (
                                                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 500, marginTop: '2px' }}>Merk: {item.merk}</div>
                                            )}
                                        </td>
                                        <td style={{ padding: '14px 16px', color: '#334155' }}>{item.kategori}</td>
                                        <td style={{ padding: '14px 16px', color: '#334155' }}>
                                            <i className="fa-solid fa-location-dot" style={{ color: '#0288d1', marginRight: '6px' }}></i>
                                            {item.lokasi}
                                        </td>
                                        <td style={{ padding: '14px 16px', fontWeight: 800, color: '#0f172a' }}>{formatRupiah(item.harga_beli)}</td>
                                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                                            <span style={{ background: stStyle.background, color: stStyle.color, padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 800, display: 'inline-block' }}>
                                                ● {stStyle.label}
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

            {/* Modal Form "Tambah / Edit Aset" */}
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
                        maxWidth: '650px',
                        maxHeight: '90vh',
                        overflowY: 'auto',
                        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)'
                    }}>
                        <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
                            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <i className="fa-solid fa-box-archive" style={{ color: '#00624F' }}></i>
                                {editingAset ? `Edit Data Aset (${editingAset.kode_aset})` : 'Tambah Aset Inventaris Baru (Live MySQL)'}
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
                                    Nama Barang / Unit Aset *
                                </label>
                                <input
                                    type="text"
                                    placeholder="Contoh: Laptop Dell Latitude 5430 Core i7"
                                    value={form.nama_aset}
                                    onChange={e => setForm({ ...form, nama_aset: e.target.value })}
                                    required
                                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', outline: 'none' }}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                                        Kategori Aset *
                                    </label>
                                    <select
                                        value={form.kategori_id}
                                        onChange={e => setForm({ ...form, kategori_id: e.target.value })}
                                        style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', outline: 'none', background: '#fff' }}
                                    >
                                        <option value="1">Perangkat IT & Komputer</option>
                                        <option value="2">Network & Infrastructure</option>
                                        <option value="3">Mebel & Furnitur Kantor</option>
                                        <option value="4">Elektronik Kantor</option>
                                        <option value="5">Keamanan & Akses Kantor</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                                        Lokasi Penempatan *
                                    </label>
                                    <select
                                        value={form.lokasi_id}
                                        onChange={e => setForm({ ...form, lokasi_id: e.target.value })}
                                        style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', outline: 'none', background: '#fff' }}
                                    >
                                        <option value="1">Ruang Server Lt 1</option>
                                        <option value="2">Ruang Direktur</option>
                                        <option value="3">Ruang Staff IT</option>
                                        <option value="4">Ruang Finance & HR</option>
                                        <option value="5">Ruang Meeting</option>
                                        <option value="6">Gudang Aset IT</option>
                                        <option value="7">Gudang Mebel</option>
                                        <option value="8">Ruang Training</option>
                                        <option value="9">Ruang Operations</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                                        Merk / Brand
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Contoh: Dell / HP / Cisco"
                                        value={form.merk}
                                        onChange={e => setForm({ ...form, merk: e.target.value })}
                                        style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', outline: 'none' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                                        Nomor Seri / S/N
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="SN-DEL-2026-X99"
                                        value={form.nomor_seri}
                                        onChange={e => setForm({ ...form, nomor_seri: e.target.value })}
                                        style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', outline: 'none' }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                                        Harga / Nilai Beli (Rp)
                                    </label>
                                    <input
                                        type="number"
                                        placeholder="12500000"
                                        value={form.harga_beli}
                                        onChange={e => setForm({ ...form, harga_beli: e.target.value })}
                                        style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', outline: 'none' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                                        Tanggal Perolehan / Beli
                                    </label>
                                    <input
                                        type="date"
                                        value={form.tanggal_beli}
                                        onChange={e => setForm({ ...form, tanggal_beli: e.target.value })}
                                        style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', outline: 'none' }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                                        Kondisi Fisik
                                    </label>
                                    <select
                                        value={form.kondisi}
                                        onChange={e => setForm({ ...form, kondisi: e.target.value })}
                                        style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', outline: 'none', background: '#fff' }}
                                    >
                                        <option value="Baik">Baik (100% Normal)</option>
                                        <option value="Rusak Ringan">Rusak Ringan</option>
                                        <option value="Rusak Berat">Rusak Berat</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                                        Status Aset
                                    </label>
                                    <select
                                        value={form.status}
                                        onChange={e => setForm({ ...form, status: e.target.value })}
                                        style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', outline: 'none', background: '#fff' }}
                                    >
                                        <option value="Tersedia">Tersedia</option>
                                        <option value="Dipinjam">Dipinjam</option>
                                        <option value="Dalam Perawatan">Dalam Perawatan</option>
                                        <option value="Rusak">Rusak / Non-Aktif</option>
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
                                            <i className="fa-solid fa-floppy-disk"></i> {editingAset ? 'Simpan Perubahan' : 'Simpan Aset Baru'}
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
