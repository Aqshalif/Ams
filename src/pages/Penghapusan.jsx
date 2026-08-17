import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { Pagination } from '../components/Pagination';

export const Penghapusan = () => {
    const { currentUser, checkPermission } = useData();
    const canAdd = checkPermission('penghapusan', 'add');
    const canApprove = checkPermission('penghapusan', 'approve');
    const canEdit = checkPermission('penghapusan', 'edit');
    const canDelete = checkPermission('penghapusan', 'delete');

    const [activeTab, setActiveTab] = useState('permohonan'); // 'permohonan', 'persetujuan', 'riwayat'
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [sortOrder, setSortOrder] = useState('terbaru');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [dataList, setDataList] = useState([]);
    const [asetOptions, setAsetOptions] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal state for Submitting New Request / Editing Request
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [selectedAset, setSelectedAset] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    // Form inputs for Request Modal
    const [form, setForm] = useState({
        aset_id: '',
        kode_ba: '',
        alasan: 'Rusak Berat Total (Kompresor/Mesin Jebol)',
        nilai_buku: 0,
        tanggal: new Date().toISOString().split('T')[0],
        catatan: ''
    });

    // Modal state for Approval / Rejection decision
    const [showApprovalModal, setShowApprovalModal] = useState(false);
    const [targetApprovalItem, setTargetApprovalItem] = useState(null);
    const [approvalDecision, setApprovalDecision] = useState('setuju'); // 'setuju' or 'tolak'
    const [catatanApprover, setCatatanApprover] = useState('');

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

    const loadDataFromMySQL = async () => {
        setLoading(true);
        try {
            const [phRes, asetRes] = await Promise.all([
                safeFetchJSON('/api/mysql/penghapusan'),
                safeFetchJSON('/api/mysql/aset')
            ]);

            if (asetRes && asetRes.data) {
                setAsetOptions(asetRes.data || []);
            }

            if (phRes && phRes.data && phRes.data.length > 0) {
                const mapped = phRes.data.map((item, idx) => ({
                    ...item,
                    id: item.penghapusan_id || item.id || idx + 1,
                    kode_ba: item.kode_ba || `BA-PH-2026-${String(idx + 1).padStart(4, '0')}`,
                    aset: item.aset || item.nama_aset || `Unit Aset ID #${item.aset_id || idx + 1}`,
                    alasan: item.alasan || 'Kerusakan Berat / Penghapusan Aset',
                    nilai_buku: Number(item.nilai_jual || item.nilai_buku || item.harga_beli || 0),
                    tanggal: item.tanggal_penghapusan ? String(item.tanggal_penghapusan).split('T')[0] : (item.tanggal || new Date().toISOString().split('T')[0]),
                    status: item.status || (item.disetujui_oleh ? 'Disetujui Penghapusan' : 'Menunggu Approval'),
                    disetujui_oleh: item.disetujui_oleh || '-',
                    catatan_approver: item.catatan_approver || item.keterangan || '-'
                }));
                setDataList(mapped);
            } else {
                // Initial fallback sample data if table is empty
                setDataList([
                    { id: 1, aset_id: 1, kode_ba: 'BA-PH-8801', aset: 'AC Split Panasonic 2 PK', alasan: 'Kerusakan Kompresor Parah & Usia Aset 7 Tahun', nilai_buku: 1200000, tanggal: '2026-08-05', status: 'Menunggu Approval', disetujui_oleh: '-', catatan_approver: '-' },
                    { id: 2, aset_id: 2, kode_ba: 'BA-PH-8802', aset: 'Laptop Dell Vostro 3400', alasan: 'Kehilangan di Lokasi Proyek & Ada Berita Acara Polisi', nilai_buku: 3500000, tanggal: '2026-08-01', status: 'Disetujui Penghapusan', disetujui_oleh: 'Manager Fleet', catatan_approver: 'Disetujui penghapusan dari neraca aktiva.' },
                    { id: 3, aset_id: 3, kode_ba: 'BA-PH-8803', aset: 'Kursi Kerja Executive Manager', alasan: 'Braket Patah Tidak Dapat Diperbaiki', nilai_buku: 750000, tanggal: '2026-08-10', status: 'Ditolak', disetujui_oleh: 'Director Operations', catatan_approver: 'Masih dapat diperbaiki oleh teknisi internal.' }
                ]);
            }
        } catch (err) {
            console.error('Error fetching penghapusan data from MySQL:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDataFromMySQL();
    }, []);

    const formatRupiah = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val || 0);

    // Asset selection in request modal
    const handleSelectAsset = (asetId) => {
        const found = asetOptions.find(a => String(a.aset_id) === String(asetId));
        if (found) {
            setSelectedAset(found);
            setForm(prev => ({
                ...prev,
                aset_id: found.aset_id,
                nilai_buku: Number(found.harga_beli || 0)
            }));
        } else {
            setSelectedAset(null);
            setForm(prev => ({
                ...prev,
                aset_id: '',
                nilai_buku: 0
            }));
        }
    };

    const resetForm = () => {
        setEditingItem(null);
        setSelectedAset(null);
        setForm({
            aset_id: '',
            kode_ba: `BA-PH-${Date.now().toString().slice(-5)}`,
            alasan: 'Rusak Berat Total (Kompresor/Mesin Jebol)',
            nilai_buku: 0,
            tanggal: new Date().toISOString().split('T')[0],
            catatan: ''
        });
    };

    const handleOpenAddModal = () => {
        resetForm();
        setShowModal(true);
    };

    const handleOpenEditModal = (item) => {
        setEditingItem(item);
        const foundAset = asetOptions.find(a => String(a.aset_id) === String(item.aset_id));
        setSelectedAset(foundAset || null);
        setForm({
            aset_id: item.aset_id || '',
            kode_ba: item.kode_ba || '',
            alasan: item.alasan || '',
            nilai_buku: item.nilai_buku || 0,
            tanggal: item.tanggal || new Date().toISOString().split('T')[0],
            catatan: item.catatan || ''
        });
        setShowModal(true);
    };

    const handleDeleteRequest = async (item) => {
        if (!window.confirm(`Apakah Anda yakin ingin MENGHAPUS berkas permohonan penghapusan "${item.kode_ba} - ${item.aset}"?`)) {
            return;
        }

        try {
            const res = await safeFetchJSON(`/api/mysql/penghapusan/${item.id}`, { method: 'DELETE' });
            if (res && res.success) {
                alert(` Berhasil! Berkas permohonan penghapusan ${item.kode_ba} telah dihapus.`);
                await loadDataFromMySQL();
            } else {
                alert(`Gagal menghapus: ${res?.message || 'Terjadi kesalahan'}`);
            }
        } catch (err) {
            alert(`Error: ${err.message}`);
        }
    };

    const handleSubmitRequest = async (e) => {
        e.preventDefault();
        if (!form.aset_id && !selectedAset) {
            alert('Silakan pilih unit aset terlebih dahulu!');
            return;
        }

        setSubmitting(true);
        try {
            let url = '/api/mysql/penghapusan';
            let method = 'POST';

            const payload = {
                aset_id: form.aset_id,
                kode_ba: form.kode_ba,
                alasan: form.alasan,
                nilai_jual: form.nilai_buku,
                tanggal_penghapusan: form.tanggal,
                status: 'Menunggu Approval'
            };

            if (editingItem) {
                url = `/api/mysql/penghapusan/${editingItem.id}`;
                method = 'PUT';
            }

            const res = await safeFetchJSON(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res && res.success) {
                alert(` Berhasil! Permohonan penghapusan aset "${selectedAset?.nama_aset || 'Barang'}" telah ${editingItem ? 'diperbarui' : 'DIAJUKAN (Menunggu Approval Direksi)'}.`);
                setShowModal(false);
                resetForm();
                await loadDataFromMySQL();
            } else {
                alert(`Gagal menyimpan permohonan: ${res?.message || 'Terjadi kesalahan'}`);
            }
        } catch (err) {
            alert(`Error: ${err.message}`);
        } finally {
            setSubmitting(false);
        }
    };

    // Open Approval Decision Modal
    const handleOpenApproval = (item, decision) => {
        setTargetApprovalItem(item);
        setApprovalDecision(decision);
        setCatatanApprover(decision === 'setuju' ? 'Disetujui penghapusan aset. Aset resmi ditiadakan dari neraca aktiva.' : 'Ditolak. Aset masih dapat diperbaiki/dimanfaatkan.');
        setShowApprovalModal(true);
    };

    const handleConfirmDecision = async (e) => {
        e.preventDefault();
        if (!targetApprovalItem) return;

        setSubmitting(true);
        try {
            const newStatus = approvalDecision === 'setuju' ? 'Disetujui Penghapusan' : 'Ditolak';
            const approverName = currentUser?.nama_lengkap || 'Manager Fleet & Asset';

            const res = await safeFetchJSON(`/api/mysql/penghapusan/${targetApprovalItem.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: newStatus,
                    disetujui_oleh: approverName,
                    catatan_approver: catatanApprover
                })
            });

            if (res && res.success) {
                if (approvalDecision === 'setuju') {
                    // Update the asset status to 'Non-Aktif' instead of deleting it from the db
                    const foundAset = asetOptions.find(a => String(a.aset_id) === String(targetApprovalItem.aset_id)) || {};
                    await safeFetchJSON(`/api/mysql/aset/${targetApprovalItem.aset_id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ ...foundAset, status: 'Non-Aktif' })
                    });
                }
                alert(` Keputusan Tersimpan! Permohonan ${targetApprovalItem.kode_ba} resmi [${newStatus.toUpperCase()}] oleh ${approverName}.`);
                setShowApprovalModal(false);
                setTargetApprovalItem(null);
                await loadDataFromMySQL();
            } else {
                alert(`Gagal memproses keputusan: ${res?.message || 'Terjadi kesalahan'}`);
            }
        } catch (err) {
            alert(`Error: ${err.message}`);
        } finally {
            setSubmitting(false);
        }
    };

    const getBadgeStyle = (st) => {
        const s = (st || '').toUpperCase();
        if (s.includes('SETUJU') || s.includes('PENGHAPUSAN')) {
            return { background: '#fee2e2', color: '#991b1b', label: 'DISETUJUI PENGHAPUSAN', icon: 'fa-check-double' };
        } else if (s.includes('TOLAK')) {
            return { background: '#f1f5f9', color: '#64748b', label: 'PERMOHONAN DITOLAK', icon: 'fa-xmark' };
        } else {
            return { background: '#fef3c7', color: '#92400e', label: 'MENUNGGU APPROVAL', icon: 'fa-clock' };
        }
    };

    // Filter lists based on sub-tab intent
    const pendingList = dataList.filter(item => (item.status || '').toUpperCase().includes('MENUNGGU') || (item.status || '').toUpperCase().includes('PENDING'));
    const approvedHistoryList = dataList.filter(item => (item.status || '').toUpperCase().includes('SETUJU') || (item.status || '').toUpperCase().includes('TOLAK') || (item.status || '').toUpperCase().includes('PENGHAPUSAN'));

    const filteredPermohonan = dataList.filter(item =>
        (!searchQuery || JSON.stringify(item).toLowerCase().includes(searchQuery.toLowerCase())) &&
        (!statusFilter || item.status === statusFilter)
    );

    const filteredPersetujuan = pendingList.filter(item =>
        !searchQuery || JSON.stringify(item).toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredRiwayat = approvedHistoryList.filter(item =>
        !searchQuery || JSON.stringify(item).toLowerCase().includes(searchQuery.toLowerCase())
    );

    const activeRawList = activeTab === 'permohonan' ? filteredPermohonan : activeTab === 'persetujuan' ? filteredPersetujuan : filteredRiwayat;

    const sortedList = [...activeRawList].sort((a, b) => {
        if (sortOrder === 'terbaru') return (b.id || b.penghapusan_id || 0) - (a.id || a.penghapusan_id || 0);
        if (sortOrder === 'terlama') return (a.id || a.penghapusan_id || 0) - (b.id || b.penghapusan_id || 0);
        if (sortOrder === 'nama_asc') return (a.nama_aset || a.aset || '').localeCompare(b.nama_aset || b.aset || '');
        if (sortOrder === 'nama_desc') return (b.nama_aset || b.aset || '').localeCompare(a.nama_aset || a.aset || '');
        if (sortOrder === 'nilai_desc') return (b.nilai_buku || 0) - (a.nilai_buku || 0);
        if (sortOrder === 'nilai_asc') return (a.nilai_buku || 0) - (b.nilai_buku || 0);
        return 0;
    });

    const totalItems = sortedList.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedData = sortedList.slice(startIndex, startIndex + itemsPerPage);

    return (
        <div style={{ padding: '4px' }}>
            {/* Header Section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>Penghapusan Aset</h2>
                    <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
                        Pengajuan pemutihan, verifikasi persetujuan direksi, dan arsip penghapusan aset dari neraca.
                    </p>
                </div>

                {activeTab === 'permohonan' && canAdd && (
                    <button
                        onClick={handleOpenAddModal}
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
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}
                    >
                        <i className="fa-solid fa-file-circle-plus"></i> + Buat Permohonan Penghapusan Baru
                    </button>
                )}
            </div>

            {/* Sub-Tabs Navigation */}
            <div style={{ display: 'flex', gap: '24px', borderBottom: '2px solid #e2e8f0', marginBottom: '20px' }}>
                <button
                    onClick={() => setActiveTab('permohonan')}
                    style={{
                        background: 'none',
                        border: 'none',
                        padding: '12px 0',
                        fontSize: '14px',
                        fontWeight: activeTab === 'permohonan' ? 800 : 600,
                        color: activeTab === 'permohonan' ? '#00624F' : '#64748b',
                        borderBottom: activeTab === 'permohonan' ? '3px solid #00624F' : '3px solid transparent',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}
                >
                    <i className="fa-solid fa-file-lines" style={{ color: activeTab === 'permohonan' ? '#00624F' : '#94a3b8' }}></i>
                    1. Permohonan Penghapusan ({dataList.length})
                </button>

                <button
                    onClick={() => setActiveTab('persetujuan')}
                    style={{
                        background: 'none',
                        border: 'none',
                        padding: '12px 0',
                        fontSize: '14px',
                        fontWeight: activeTab === 'persetujuan' ? 800 : 600,
                        color: activeTab === 'persetujuan' ? '#00624F' : '#64748b',
                        borderBottom: activeTab === 'persetujuan' ? '3px solid #00624F' : '3px solid transparent',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}
                >
                    <i className="fa-solid fa-stamp" style={{ color: activeTab === 'persetujuan' ? '#00624F' : '#94a3b8' }}></i>
                    2. Persetujuan Direksi ({pendingList.length})
                    {pendingList.length > 0 && (
                        <span style={{ background: '#d97706', color: '#fff', fontSize: '10px', borderRadius: '10px', padding: '2px 6px', fontWeight: 800 }}>
                            {pendingList.length}
                        </span>
                    )}
                </button>

                <button
                    onClick={() => {
                        setActiveTab('riwayat');
                        setCurrentPage(1);
                    }}
                    style={{
                        background: 'none',
                        border: 'none',
                        padding: '12px 0',
                        fontSize: '14px',
                        fontWeight: activeTab === 'riwayat' ? 800 : 600,
                        color: activeTab === 'riwayat' ? '#00624F' : '#64748b',
                        borderBottom: activeTab === 'riwayat' ? '3px solid #00624F' : '3px solid transparent',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}
                >
                    <i className="fa-solid fa-box-archive" style={{ color: activeTab === 'riwayat' ? '#00624F' : '#94a3b8' }}></i>
                    3. Riwayat & Arsip Selesai ({approvedHistoryList.length})
                </button>
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
                boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
            }}>
                <input
                    type="text"
                    placeholder="Cari nomor berita acara (BA-PH), nama aset, alasan..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    style={{
                        flex: 1,
                        padding: '9px 14px',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        fontSize: '13px',
                        outline: 'none'
                    }}
                />
                {activeTab === 'permohonan' && (
                    <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
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
                        <option value="">-- Semua Status Permohonan --</option>
                        <option value="Menunggu Approval">Menunggu Approval</option>
                        <option value="Disetujui Penghapusan">Disetujui Penghapusan</option>
                        <option value="Ditolak">Ditolak</option>
                    </select>
                )}
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
                    <option value="nama_asc">Aset (A - Z)</option>
                    <option value="nama_desc">Aset (Z - A)</option>
                    <option value="nilai_desc">Nilai Buku (Highest)</option>
                    <option value="nilai_asc">Nilai Buku (Lowest)</option>
                </select>
            </div>

            {/* SUB-TAB 1: PERMOHONAN PENGHAPUSAN (TABLE VIEW FOR SUBMISSIONS) */}
            {activeTab === 'permohonan' && (
                <div>
                    <div style={{ background: '#e0f2fe', border: '1px solid #7dd3fc', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px', color: '#0369a1', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <i className="fa-solid fa-circle-info" style={{ fontSize: '16px' }}></i>
                        <div>
                            <strong>Modul Permohonan Penghapusan:</strong> Gunakan halaman ini untuk membuat dan mengelola berkas pengajuan penghapusan aset. Semua permohonan baru akan berstatus <em>Menunggu Approval</em> sebelum diverifikasi.
                        </div>
                    </div>

                    {loading ? (
                        <div style={{ padding: '30px', textAlign: 'center', color: '#00624F', fontWeight: 700 }}>
                            <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '20px', marginBottom: '8px', display: 'block' }}></i>
                            Memuat daftar permohonan penghapusan...
                        </div>
                    ) : (
                        <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                <thead>
                                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                        <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 700, color: '#475569', width: '40px' }}>No</th>
                                        <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 700, color: '#475569', width: '140px' }}>No Berita Acara</th>
                                        <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Target Unit Aset</th>
                                        <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Alasan Kronologi</th>
                                        <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Kerugian Nilai Buku</th>
                                        <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 700, color: '#475569', width: '160px' }}>Status Permohonan</th>
                                        <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 700, color: '#475569', width: '140px' }}>Aksi User</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedData.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
                                                <i className="fa-solid fa-folder-open" style={{ fontSize: '32px', color: '#cbd5e1', marginBottom: '8px', display: 'block' }}></i>
                                                Belum ada permohonan penghapusan yang diajukan. Klik "+ Buat Permohonan Penghapusan Baru".
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedData.map((item, idx) => {
                                            const badge = getBadgeStyle(item.status);
                                            const isPending = (item.status || '').toUpperCase().includes('MENUNGGU');
                                            return (
                                                <tr key={item.id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                    <td style={{ padding: '14px 16px', color: '#64748b' }}>{startIndex + idx + 1}</td>
                                                    <td style={{ padding: '14px 16px', fontWeight: 800, color: '#00624F' }}>
                                                        <code>{item.kode_ba}</code>
                                                    </td>
                                                    <td style={{ padding: '14px 16px', fontWeight: 700, color: '#0f172a' }}>{item.aset}</td>
                                                    <td style={{ padding: '14px 16px', color: '#475569' }}>{item.alasan}</td>
                                                    <td style={{ padding: '14px 16px', fontWeight: 800, color: '#dc2626' }}>{formatRupiah(item.nilai_buku)}</td>
                                                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                                                        <span style={{
                                                            display: 'inline-block',
                                                            padding: '4px 12px',
                                                            borderRadius: '20px',
                                                            fontSize: '11px',
                                                            fontWeight: 800,
                                                            background: badge.background,
                                                            color: badge.color
                                                        }}>
                                                            ● {badge.label}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                                            {isPending && canEdit && (
                                                                <button
                                                                    onClick={() => handleOpenEditModal(item)}
                                                                    style={{ background: '#f1f5f9', color: '#0288d1', border: '1px solid #bae6fd', borderRadius: '6px', padding: '5px 10px', fontWeight: 700, cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                                                                >
                                                                    <i className="fa-solid fa-pen-to-square"></i> Edit
                                                                </button>
                                                            )}
                                                            {canDelete && (
                                                                <button
                                                                    onClick={() => handleDeleteRequest(item)}
                                                                    style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: '6px', padding: '5px 10px', fontWeight: 700, cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                                                                >
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
                </div>
            )}

            {/* SUB-TAB 2: PERSETUJUAN & DECISION (APPROVAL WORKFLOW DASHBOARD / CARDS) */}
            {activeTab === 'persetujuan' && (
                <div>
                    <div style={{ background: '#fef3c7', border: '1px solid #fde047', padding: '14px 18px', borderRadius: '10px', marginBottom: '20px', color: '#92400e', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <i className="fa-solid fa-shield-halved" style={{ fontSize: '22px', color: '#d97706' }}></i>
                        <div>
                            <strong style={{ fontSize: '14px' }}>Executive Approval Center (Verifikasi Director & Manager):</strong>
                            <div style={{ fontSize: '12px', marginTop: '2px' }}>
                                Tinjau rincian kerugian nilai buku dan alasan kronologi penghapusan. Ambil keputusan <strong>Setujui Penghapusan</strong> atau <strong>Tolak Permohonan</strong>.
                            </div>
                        </div>
                    </div>

                    {filteredPersetujuan.length === 0 ? (
                        <div style={{ background: '#fff', padding: '40px 20px', borderRadius: '12px', border: '1px dashed #cbd5e1', textAlign: 'center', color: '#64748b' }}>
                            <i className="fa-solid fa-circle-check" style={{ fontSize: '36px', color: '#16a34a', marginBottom: '10px', display: 'block' }}></i>
                            <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>Tidak Ada Permohonan yang Menunggu Persetujuan</h3>
                            <p style={{ margin: 0, fontSize: '13px' }}>Semua pengajuan penghapusan telah selesai diverifikasi.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px' }}>
                            {filteredPersetujuan.map(item => (
                                <div
                                    key={item.id}
                                    style={{
                                        background: '#fff',
                                        borderRadius: '12px',
                                        border: '1.5px solid #fed7aa',
                                        boxShadow: '0 4px 12px rgba(217,119,6,0.08)',
                                        padding: '20px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justify: 'space-between'
                                    }}
                                >
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                                            <span style={{ fontSize: '12px', fontWeight: 800, color: '#d97706', background: '#fef3c7', padding: '3px 8px', borderRadius: '6px' }}>
                                                <code>{item.kode_ba}</code>
                                            </span>
                                            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
                                                📅 {item.tanggal}
                                            </span>
                                        </div>

                                        <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                                            {item.aset}
                                        </h3>

                                        <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', margin: '12px 0' }}>
                                            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px' }}>
                                                Kerugian Nilai Buku Aktiva:
                                            </div>
                                            <div style={{ fontSize: '18px', fontWeight: 900, color: '#dc2626' }}>
                                                {formatRupiah(item.nilai_buku)}
                                            </div>
                                        </div>

                                        <div style={{ fontSize: '12px', color: '#334155', lineHeight: 1.5, marginBottom: '16px' }}>
                                            <strong>Alasan / Kronologi:</strong><br />
                                            <span style={{ color: '#475569' }}>"{item.alasan}"</span>
                                        </div>
                                    </div>

                                    {/* Action Buttons for Decision */}
                                    <div style={{ display: 'flex', gap: '10px', paddingTop: '14px', borderTop: '1px solid #e2e8f0' }}>
                                        <button
                                            onClick={() => handleOpenApproval(item, 'tolak')}
                                            style={{
                                                flex: 1,
                                                background: '#fee2e2',
                                                color: '#dc2626',
                                                border: '1px solid #fca5a5',
                                                borderRadius: '8px',
                                                padding: '9px 12px',
                                                fontSize: '12px',
                                                fontWeight: 800,
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '6px'
                                            }}
                                        >
                                            <i className="fa-solid fa-xmark"></i> Tolak Permohonan
                                        </button>

                                        <button
                                            onClick={() => handleOpenApproval(item, 'setuju')}
                                            style={{
                                                flex: 1,
                                                background: '#00624F',
                                                color: '#fff',
                                                border: 'none',
                                                borderRadius: '8px',
                                                padding: '9px 12px',
                                                fontSize: '12px',
                                                fontWeight: 800,
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '6px',
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                            }}
                                        >
                                            <i className="fa-solid fa-check"></i> Setujui Penghapusan
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* SUB-TAB 3: RIWAYAT & ARSIP SELESAI (AUDIT LOG TABLE) */}
            {activeTab === 'riwayat' && (
                <div>
                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px', color: '#475569', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <i className="fa-solid fa-box-archive" style={{ fontSize: '16px', color: '#00624F' }}></i>
                        <div>
                            <strong>Arsip Riwayat Penghapusan Selesai:</strong> Menampilkan seluruh permohonan yang telah diputus (*Disetujui* atau *Ditolak*) sebagai dokumen resmi audit eksekutif.
                        </div>
                    </div>

                    {loading ? (
                        <div style={{ padding: '30px', textAlign: 'center', color: '#00624F', fontWeight: 700 }}>
                            <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '20px', marginBottom: '8px', display: 'block' }}></i>
                            Memuat arsip riwayat penghapusan...
                        </div>
                    ) : (
                        <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                <thead>
                                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                        <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 700, color: '#475569', width: '40px' }}>No</th>
                                        <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 700, color: '#475569', width: '140px' }}>No Berita Acara</th>
                                        <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Nama Unit Aset</th>
                                        <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Nilai Kerugian Buku</th>
                                        <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Approver Official</th>
                                        <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Catatan Pertimbangan</th>
                                        <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 700, color: '#475569', width: '160px' }}>Status Akhir</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedData.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
                                                <i className="fa-solid fa-inbox" style={{ fontSize: '32px', color: '#cbd5e1', marginBottom: '8px', display: 'block' }}></i>
                                                Belum ada riwayat permohonan penghapusan yang diputus.
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedData.map((item, idx) => {
                                            const badge = getBadgeStyle(item.status);
                                            return (
                                                <tr key={item.id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                    <td style={{ padding: '14px 16px', color: '#64748b' }}>{startIndex + idx + 1}</td>
                                                    <td style={{ padding: '14px 16px', fontWeight: 800, color: '#00624F' }}>
                                                        <code>{item.kode_ba}</code>
                                                    </td>
                                                    <td style={{ padding: '14px 16px', fontWeight: 700, color: '#0f172a' }}>{item.aset}</td>
                                                    <td style={{ padding: '14px 16px', fontWeight: 800, color: '#dc2626' }}>{formatRupiah(item.nilai_buku)}</td>
                                                    <td style={{ padding: '14px 16px', fontWeight: 700, color: '#0369a1' }}>
                                                        <i className="fa-solid fa-user-check" style={{ marginRight: '6px' }}></i>
                                                        {item.disetujui_oleh || 'Director Operations'}
                                                    </td>
                                                    <td style={{ padding: '14px 16px', color: '#64748b', fontSize: '12px' }}>
                                                        {item.catatan_approver || '-'}
                                                    </td>
                                                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                                                        <span style={{
                                                            display: 'inline-block',
                                                            padding: '4px 12px',
                                                            borderRadius: '20px',
                                                            fontSize: '11px',
                                                            fontWeight: 800,
                                                            background: badge.background,
                                                            color: badge.color
                                                        }}>
                                                            ● {badge.label}
                                                        </span>
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
                </div>
            )}

            {/* Modal 1: Form Permohonan Penghapusan Baru / Edit */}
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
                        maxWidth: '600px',
                        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
                    }}>
                        <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
                            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <i className="fa-solid fa-file-signature" style={{ color: '#00624F' }}></i>
                                {editingItem ? 'Edit Permohonan Penghapusan' : 'Form Pengajuan Penghapusan Aset Baru'}
                            </h3>
                            <button
                                onClick={() => setShowModal(false)}
                                style={{ background: 'transparent', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#64748b' }}
                            >
                                <i className="fa-solid fa-xmark"></i>
                            </button>
                        </div>

                        <form onSubmit={handleSubmitRequest} style={{ padding: '24px' }}>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                                    Pilih Unit Aset yang Dihapuskan *
                                </label>
                                <select
                                    value={form.aset_id}
                                    onChange={e => handleSelectAsset(e.target.value)}
                                    required
                                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', outline: 'none', background: '#fff', fontWeight: 700 }}
                                >
                                    <option value="">-- Pilih Barang / Aset Terdaftar --</option>
                                    {asetOptions.map(a => (
                                        <option key={a.aset_id} value={a.aset_id}>
                                            [{a.kode_aset || `AST-${a.aset_id}`}] {a.nama_aset} - (Nilai Beli: {formatRupiah(a.harga_beli)})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                                        Nomor Berita Acara (BA-PH) *
                                    </label>
                                    <input
                                        type="text"
                                        value={form.kode_ba}
                                        onChange={e => setForm({ ...form, kode_ba: e.target.value })}
                                        required
                                        style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', outline: 'none' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                                        Kerugian Nilai Buku (Rp) *
                                    </label>
                                    <input
                                        type="number"
                                        value={form.nilai_buku}
                                        onChange={e => setForm({ ...form, nilai_buku: e.target.value })}
                                        required
                                        style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', outline: 'none', fontWeight: 700 }}
                                    />
                                </div>
                            </div>

                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                                    Tanggal Kejadian / Pengajuan *
                                </label>
                                <input
                                    type="date"
                                    value={form.tanggal}
                                    onChange={e => setForm({ ...form, tanggal: e.target.value })}
                                    required
                                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', outline: 'none' }}
                                />
                            </div>

                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                                    Alasan & Kronologi Penghapusan *
                                </label>
                                <textarea
                                    value={form.alasan}
                                    onChange={e => setForm({ ...form, alasan: e.target.value })}
                                    rows="3"
                                    placeholder="Jelaskan alasan kronologi penghapusan atau nomor surat laporan kepolisian..."
                                    required
                                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', outline: 'none' }}
                                />
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
                                            <i className="fa-solid fa-paper-plane"></i> {editingItem ? 'Simpan Perubahan' : 'Ajukan Permohonan'}
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal 2: Verification & Decision Approval */}
            {showApprovalModal && targetApprovalItem && (
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
                        maxWidth: '520px',
                        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
                    }}>
                        <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: approvalDecision === 'setuju' ? '#e6f4f1' : '#fee2e2' }}>
                            <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: approvalDecision === 'setuju' ? '#00624F' : '#991b1b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <i className={approvalDecision === 'setuju' ? "fa-solid fa-circle-check" : "fa-solid fa-circle-xmark"}></i>
                                Keputusan: {approvalDecision === 'setuju' ? 'Setujui Penghapusan Aset' : 'Tolak Permohonan Penghapusan'}
                            </h3>
                            <button
                                onClick={() => setShowApprovalModal(false)}
                                style={{ background: 'transparent', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#64748b' }}
                            >
                                <i className="fa-solid fa-xmark"></i>
                            </button>
                        </div>

                        <form onSubmit={handleConfirmDecision} style={{ padding: '24px' }}>
                            <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '16px', fontSize: '13px' }}>
                                <div><strong>No BA:</strong> <code>{targetApprovalItem.kode_ba}</code></div>
                                <div><strong>Aset:</strong> {targetApprovalItem.aset}</div>
                                <div><strong>Kerugian Buku:</strong> <span style={{ color: '#dc2626', fontWeight: 800 }}>{formatRupiah(targetApprovalItem.nilai_buku)}</span></div>
                            </div>

                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                                    Catatan Pertimbangan Official Approver *
                                </label>
                                <textarea
                                    value={catatanApprover}
                                    onChange={e => setCatatanApprover(e.target.value)}
                                    rows="3"
                                    required
                                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', outline: 'none' }}
                                />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
                                <button
                                    type="button"
                                    onClick={() => setShowApprovalModal(false)}
                                    style={{ background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '9px 16px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    style={{
                                        background: approvalDecision === 'setuju' ? '#00624F' : '#dc2626',
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: '6px',
                                        padding: '9px 18px',
                                        fontSize: '13px',
                                        fontWeight: 800,
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}
                                >
                                    {submitting ? (
                                        <>
                                            <i className="fa-solid fa-spinner fa-spin"></i> Memproses...
                                        </>
                                    ) : (
                                        <>
                                            <i className="fa-solid fa-check"></i> Konfirmasi Keputusan
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
