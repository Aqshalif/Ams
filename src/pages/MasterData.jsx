import React, { useState, useEffect } from 'react';
import { Pagination } from '../components/Pagination';
import { useData } from '../context/DataContext';

export const MasterData = () => {
    const { checkPermission } = useData();
    const canAdd = checkPermission('master', 'add');
    const canEdit = checkPermission('master', 'edit');
    const canDelete = checkPermission('master', 'delete');
    const [activeTab, setActiveTab] = useState('kategori'); // 'kategori', 'lokasi', 'supplier'
    const [searchQuery, setSearchQuery] = useState('');
    const [sortOrder, setSortOrder] = useState('terbaru');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [kategoriList, setKategoriList] = useState([]);
    const [lokasiList, setLokasiList] = useState([]);
    const [supplierList, setSupplierList] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal state for Add & Edit
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null); // null if adding
    const [submitting, setSubmitting] = useState(false);

    // Form state
    const [form, setForm] = useState({
        nama: '',
        deskripsi: '',
        alamat: '',
        telepon: ''
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

    const loadMasterDataFromMySQL = async () => {
        setLoading(true);
        try {
            const [katRes, lokRes, supRes] = await Promise.all([
                safeFetchJSON('/api/mysql/kategori_aset'),
                safeFetchJSON('/api/mysql/lokasi'),
                safeFetchJSON('/api/mysql/supplier')
            ]);

            if (katRes && katRes.success) {
                setKategoriList(katRes.data || []);
            }
            if (lokRes && lokRes.success) {
                setLokasiList(lokRes.data || []);
            }
            if (supRes && supRes.success) {
                setSupplierList(supRes.data || []);
            }
        } catch (err) {
            console.error('Error fetching master data from MySQL:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadMasterDataFromMySQL();
    }, []);

    const resetForm = () => {
        setEditingItem(null);
        setForm({
            nama: '',
            deskripsi: '',
            alamat: '',
            telepon: ''
        });
    };

    const handleOpenAdd = () => {
        resetForm();
        setShowModal(true);
    };

    const handleOpenEdit = (item) => {
        setEditingItem(item);
        if (activeTab === 'kategori') {
            setForm({
                nama: item.nama_kategori || item.nama || '',
                deskripsi: item.deskripsi || ''
            });
        } else if (activeTab === 'lokasi') {
            setForm({
                nama: item.nama_lokasi || item.nama || '',
                deskripsi: item.deskripsi || item.gedung || ''
            });
        } else if (activeTab === 'supplier') {
            setForm({
                nama: item.nama_supplier || item.nama || '',
                alamat: item.alamat || '',
                telepon: item.no_telepon || item.telepon || ''
            });
        }
        setShowModal(true);
    };

    const handleDelete = async (item) => {
        let tableName = '';
        let idName = '';
        let idVal = null;
        let displayName = '';

        if (activeTab === 'kategori') {
            tableName = 'kategori_aset';
            idName = 'kategori_id';
            idVal = item.kategori_id || item.id;
            displayName = item.nama_kategori || item.nama;
        } else if (activeTab === 'lokasi') {
            tableName = 'lokasi';
            idName = 'lokasi_id';
            idVal = item.lokasi_id || item.id;
            displayName = item.nama_lokasi || item.nama;
        } else if (activeTab === 'supplier') {
            tableName = 'supplier';
            idName = 'supplier_id';
            idVal = item.supplier_id || item.id;
            displayName = item.nama_supplier || item.nama;
        }

        if (!window.confirm(`Apakah Anda yakin ingin MENGHAPUS data ${activeTab} "${displayName}" (ID: ${idVal}) dari MySQL database?`)) {
            return;
        }

        try {
            const res = await safeFetchJSON(`/api/mysql/${tableName}/${idVal}`, {
                method: 'DELETE'
            });

            if (res && res.success) {
                alert(` Berhasil! Data ${displayName} telah dihapus.`);
                await loadMasterDataFromMySQL();
            } else {
                alert(`Gagal menghapus data: ${res?.message || 'Terjadi kesalahan'}`);
            }
        } catch (err) {
            alert(`Error: ${err.message}`);
        }
    };

    const handleSubmitForm = async (e) => {
        e.preventDefault();
        if (!form.nama.trim()) {
            alert('Nama wajib diisi!');
            return;
        }

        setSubmitting(true);
        try {
            let tableName = '';
            let payload = {};

            if (activeTab === 'kategori') {
                tableName = 'kategori_aset';
                payload = {
                    nama_kategori: form.nama,
                    deskripsi: form.deskripsi
                };
            } else if (activeTab === 'lokasi') {
                tableName = 'lokasi';
                payload = {
                    nama_lokasi: form.nama,
                    deskripsi: form.deskripsi
                };
            } else if (activeTab === 'supplier') {
                tableName = 'supplier';
                payload = {
                    nama_supplier: form.nama,
                    alamat: form.alamat,
                    no_telepon: form.telepon
                };
            }

            let url = `/api/mysql/${tableName}`;
            let method = 'POST';

            if (editingItem) {
                const idVal = activeTab === 'kategori' ? editingItem.kategori_id : activeTab === 'lokasi' ? editingItem.lokasi_id : editingItem.supplier_id;
                url = `/api/mysql/${tableName}/${idVal}`;
                method = 'PUT';
            }

            const res = await safeFetchJSON(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res && res.success) {
                alert(` Berhasil! Data ${form.nama} telah ${editingItem ? 'diperbarui' : 'ditambahkan'} di MySQL database db_ams.`);
                setShowModal(false);
                resetForm();
                await loadMasterDataFromMySQL();
            } else {
                alert(`Gagal menyimpan data: ${res?.message || 'Terjadi kesalahan'}`);
            }
        } catch (err) {
            alert(`Error: ${err.message}`);
        } finally {
            setSubmitting(false);
        }
    };

    const filteredKategori = kategoriList.filter(item =>
        !searchQuery || JSON.stringify(item).toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredLokasi = lokasiList.filter(item =>
        !searchQuery || JSON.stringify(item).toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredSupplier = supplierList.filter(item =>
        !searchQuery || JSON.stringify(item).toLowerCase().includes(searchQuery.toLowerCase())
    );

    const activeRawList = activeTab === 'kategori' ? filteredKategori : activeTab === 'lokasi' ? filteredLokasi : filteredSupplier;

    const sortedList = [...activeRawList].sort((a, b) => {
        const idA = a.kategori_id || a.lokasi_id || a.supplier_id || a.id || 0;
        const idB = b.kategori_id || b.lokasi_id || b.supplier_id || b.id || 0;
        const nameA = a.nama_kategori || a.nama_lokasi || a.nama_supplier || a.nama || '';
        const nameB = b.nama_kategori || b.nama_lokasi || b.nama_supplier || b.nama || '';

        if (sortOrder === 'terbaru') return idB - idA;
        if (sortOrder === 'terlama') return idA - idB;
        if (sortOrder === 'nama_asc') return nameA.localeCompare(nameB);
        if (sortOrder === 'nama_desc') return nameB.localeCompare(nameA);
        return 0;
    });

    const totalItems = sortedList.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedData = sortedList.slice(startIndex, startIndex + itemsPerPage);

    const getTabTitle = () => {
        if (activeTab === 'kategori') return 'Kategori Aset';
        if (activeTab === 'lokasi') return 'Lokasi Penempatan';
        return 'Supplier / Vendor';
    };

    return (
        <div style={{ padding: '4px' }}>
            {/* Header Section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>Pengelolaan Master Data Perusahaan</h2>
                    <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
                        Kelola data acuan utama kategori aset, lokasi penempatan, dan vendor supplier.
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
                        <i className="fa-solid fa-circle-plus"></i> + Tambah Master {getTabTitle()}
                    </button>
                )}
            </div>

            {/* Sub-Tabs Navigation */}
            <div style={{ display: 'flex', gap: '24px', borderBottom: '1px solid #e2e8f0', marginBottom: '20px' }}>
                <button
                    onClick={() => {
                        setActiveTab('kategori');
                        setCurrentPage(1);
                    }}
                    style={{
                        background: 'none',
                        border: 'none',
                        padding: '10px 0',
                        fontSize: '14px',
                        fontWeight: activeTab === 'kategori' ? 800 : 600,
                        color: activeTab === 'kategori' ? '#00624F' : '#64748b',
                        borderBottom: activeTab === 'kategori' ? '3px solid #00624F' : '3px solid transparent',
                        cursor: 'pointer'
                    }}
                >
                    1. Kategori Aset ({kategoriList.length})
                </button>
                <button
                    onClick={() => {
                        setActiveTab('lokasi');
                        setCurrentPage(1);
                    }}
                    style={{
                        background: 'none',
                        border: 'none',
                        padding: '10px 0',
                        fontSize: '14px',
                        fontWeight: activeTab === 'lokasi' ? 800 : 600,
                        color: activeTab === 'lokasi' ? '#00624F' : '#64748b',
                        borderBottom: activeTab === 'lokasi' ? '3px solid #00624F' : '3px solid transparent',
                        cursor: 'pointer'
                    }}
                >
                    2. Lokasi Penempatan ({lokasiList.length})
                </button>
                <button
                    onClick={() => {
                        setActiveTab('supplier');
                        setCurrentPage(1);
                    }}
                    style={{
                        background: 'none',
                        border: 'none',
                        padding: '10px 0',
                        fontSize: '14px',
                        fontWeight: activeTab === 'supplier' ? 800 : 600,
                        color: activeTab === 'supplier' ? '#00624F' : '#64748b',
                        borderBottom: activeTab === 'supplier' ? '3px solid #00624F' : '3px solid transparent',
                        cursor: 'pointer'
                    }}
                >
                    3. Supplier / Vendor ({supplierList.length})
                </button>
            </div>

            {/* Search Bar */}
            <div style={{
                background: '#fff',
                padding: '14px 18px',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
                marginBottom: '20px',
                display: 'flex',
                gap: '14px',
                alignItems: 'center',
                boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                flexWrap: 'wrap'
            }}>
                <input
                    type="text"
                    placeholder={`Cari ${getTabTitle()}...`}
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

            {/* Table Section */}
            {loading ? (
                <div style={{ padding: '30px', textAlign: 'center', color: '#00624F', fontWeight: 700 }}>
                    <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '20px', marginBottom: '8px', display: 'block' }}></i>
                    Mengambil Data Langsung dari MySQL Database db_ams...
                </div>
            ) : (
                <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 700, color: '#475569', width: '50px' }}>No</th>
                                <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 700, color: '#475569', width: '120px' }}>
                                    {activeTab === 'kategori' ? 'kategori_id' : activeTab === 'lokasi' ? 'lokasi_id' : 'supplier_id'}
                                </th>
                                <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>
                                    {activeTab === 'kategori' ? 'Nama Kategori' : activeTab === 'lokasi' ? 'Nama Lokasi' : 'Nama Supplier'}
                                </th>
                                <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>
                                    {activeTab === 'supplier' ? 'Alamat & Kontak' : 'Deskripsi / Keterangan'}
                                </th>
                                <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 700, color: '#475569', width: '160px' }}>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedData.length === 0 ? (
                                <tr>
                                    <td colSpan="5" style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
                                        Tidak ada data {getTabTitle().toLowerCase()} ditemukan.
                                    </td>
                                </tr>
                            ) : (
                                paginatedData.map((item, idx) => (
                                    <tr key={item.kategori_id || item.lokasi_id || item.supplier_id || item.id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '14px 16px', color: '#64748b' }}>{startIndex + idx + 1}</td>
                                        <td style={{ padding: '14px 16px', color: '#00624F', fontWeight: 800 }}>
                                            <code>{item.kategori_id || item.lokasi_id || item.supplier_id || item.id}</code>
                                        </td>
                                        <td style={{ padding: '14px 16px', fontWeight: 800, color: '#0f172a' }}>
                                            {item.nama_kategori || item.nama_lokasi || item.nama_supplier || item.nama}
                                        </td>
                                        <td style={{ padding: '14px 16px', color: '#64748b' }}>
                                            {activeTab === 'supplier'
                                                ? `${item.alamat || '-'} ${item.no_telepon ? `(${item.no_telepon})` : ''}`
                                                : (item.deskripsi || item.gedung || '-')}
                                        </td>
                                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                                <button
                                                    onClick={() => handleOpenEdit(item)}
                                                    style={{ background: '#f1f5f9', color: '#0288d1', border: '1px solid #bae6fd', borderRadius: '6px', padding: '5px 10px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}
                                                >
                                                    <i className="fa-solid fa-pen-to-square"></i> Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(item)}
                                                    style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: '6px', padding: '5px 10px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}
                                                >
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
            )}

            {/* Modal Form Add & Edit Master Data */}
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
                                <i className="fa-solid fa-layer-group" style={{ color: '#00624F' }}></i>
                                {editingItem ? `Edit ${getTabTitle()}` : `Tambah ${getTabTitle()} Baru`}
                            </h3>
                            <button
                                onClick={() => setShowModal(false)}
                                style={{ background: 'transparent', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#64748b' }}
                            >
                                <i className="fa-solid fa-xmark"></i>
                            </button>
                        </div>

                        <form onSubmit={handleSubmitForm} style={{ padding: '24px' }}>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                                    Nama {getTabTitle()} *
                                </label>
                                <input
                                    type="text"
                                    placeholder={`Masukkan nama ${getTabTitle().toLowerCase()}`}
                                    value={form.nama}
                                    onChange={e => setForm({ ...form, nama: e.target.value })}
                                    required
                                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', outline: 'none' }}
                                />
                            </div>

                            {activeTab === 'supplier' ? (
                                <>
                                    <div style={{ marginBottom: '16px' }}>
                                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                                            Alamat Vendor / Supplier
                                        </label>
                                        <textarea
                                            placeholder="Alamat lengkap supplier..."
                                            value={form.alamat}
                                            onChange={e => setForm({ ...form, alamat: e.target.value })}
                                            rows="3"
                                            style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', outline: 'none' }}
                                        />
                                    </div>
                                    <div style={{ marginBottom: '20px' }}>
                                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                                            No Telepon / Kontak
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Contoh: (021) 555-1234"
                                            value={form.telepon}
                                            onChange={e => setForm({ ...form, telepon: e.target.value })}
                                            style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', outline: 'none' }}
                                        />
                                    </div>
                                </>
                            ) : (
                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                                        Deskripsi / Catatan Keterangan
                                    </label>
                                    <textarea
                                        placeholder="Deskripsi singkat..."
                                        value={form.deskripsi}
                                        onChange={e => setForm({ ...form, deskripsi: e.target.value })}
                                        rows="3"
                                        style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', outline: 'none' }}
                                    />
                                </div>
                            )}

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
                                            <i className="fa-solid fa-floppy-disk"></i> {editingItem ? 'Simpan Perubahan' : 'Simpan Data Baru'}
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
