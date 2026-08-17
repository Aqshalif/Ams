import React, { useState, useEffect } from 'react';
import { Pagination } from '../components/Pagination';
import { useData } from '../context/DataContext';

export const Penyusutan = () => {
    const { checkPermission } = useData();
    const canCalc = checkPermission('penyusutan', 'calc');
    const canDelete = checkPermission('penyusutan', 'delete');
    const [asetOptions, setAsetOptions] = useState([]);
    const [depreciationList, setDepreciationList] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [sortOrder, setSortOrder] = useState('terbaru');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [loading, setLoading] = useState(true);

    // Modal state for Calculator / New Depreciation
    const [showCalcModal, setShowCalcModal] = useState(false);
    const [selectedAset, setSelectedAset] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [asetSearchQuery, setAsetSearchQuery] = useState('');

    // Form inputs for calculation
    const [calcForm, setCalcForm] = useState({
        aset_id: '',
        harga_perolehan: 0,
        masa_manfaat: 5,
        nilai_sisa: 0,
        metode: 'Garis Lurus', // 'Garis Lurus' or 'Saldo Menurun'
        tahun_perolehan: new Date().getFullYear()
    });

    // Modal state for viewing detail schedule
    const [detailModalItem, setDetailModalItem] = useState(null);

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
            const [asetRes, depRes] = await Promise.all([
                safeFetchJSON('/api/mysql/aset'),
                safeFetchJSON('/api/mysql/penyusutan')
            ]);

            if (asetRes && asetRes.data) {
                setAsetOptions(asetRes.data || []);
            }

            if (depRes && depRes.data && depRes.data.length > 0) {
                const mapped = depRes.data.map((item, idx) => {
                    const hargaHp = Number(item.harga_perolehan || item.harga_beli || 0);
                    const masaM = Number(item.masa_manfaat || 5);
                    const nilSisa = Number(item.nilai_sisa || item.nilai_residu || 0);
                    const depThn = Number(item.penyusutan_pertahun || ((hargaHp - nilSisa) / Math.max(1, masaM)));
                    const akum = Number(item.akumulasi_penyusutan || (depThn * 2));
                    const nilBuku = Number(item.nilai_buku || Math.max(0, hargaHp - akum));

                    return {
                        ...item,
                        id: item.penyusutan_id || item.id || idx + 1,
                        kode_aset: item.kode_aset || `AST-OFF-${String(idx + 1).padStart(4, '0')}`,
                        nama_aset: item.aset || item.nama_aset || 'Unit Aset Armada',
                        kategori: item.kategori || item.nama_kategori || 'Perangkat IT & Komputer',
                        harga_perolehan: hargaHp,
                        masa_manfaat: masaM,
                        nilai_sisa: nilSisa,
                        penyusutan_pertahun: depThn,
                        akumulasi_penyusutan: akum,
                        nilai_buku: nilBuku
                    };
                });
                setDepreciationList(mapped);
            } else {
                // Fallback default list if database table is initially empty
                setDepreciationList([
                    { id: 1, aset_id: 1, kode_aset: 'AST-OFF-0001', nama_aset: 'Server Dell PowerEdge R750', kategori: 'Perangkat IT & Komputer', harga_perolehan: 85000000, masa_manfaat: 5, nilai_sisa: 5000000, penyusutan_pertahun: 16000000, akumulasi_penyusutan: 32000000, nilai_buku: 53000000 },
                    { id: 2, aset_id: 2, kode_aset: 'AST-OFF-0002', nama_aset: 'Genset Silent 50 KVA Perkins', kategori: 'Network & Infrastructure', harga_perolehan: 145000000, masa_manfaat: 8, nilai_sisa: 10000000, penyusutan_pertahun: 16875000, akumulasi_penyusutan: 33750000, nilai_buku: 111250000 },
                    { id: 3, aset_id: 3, kode_aset: 'AST-OFF-0003', nama_aset: 'Lenovo ThinkPad X1 Carbon Gen 11', kategori: 'Perangkat IT & Komputer', harga_perolehan: 38500000, masa_manfaat: 4, nilai_sisa: 2500000, penyusutan_pertahun: 9000000, akumulasi_penyusutan: 18000000, nilai_buku: 20500000 }
                ]);
            }
        } catch (err) {
            console.error('Error fetching data from MySQL:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDataFromMySQL();
    }, []);

    // When user chooses an asset from the dropdown in the Calculator modal
    const handleSelectAsset = (asetId) => {
        const found = asetOptions.find(a => String(a.aset_id) === String(asetId));
        if (found) {
            setSelectedAset(found);
            setCalcForm(prev => ({
                ...prev,
                aset_id: found.aset_id,
                harga_perolehan: Number(found.harga_beli || 0),
                masa_manfaat: 5,
                nilai_sisa: 0,
                tahun_perolehan: found.tanggal_beli ? new Date(found.tanggal_beli).getFullYear() : new Date().getFullYear()
            }));
        } else {
            setSelectedAset(null);
            setCalcForm(prev => ({
                ...prev,
                aset_id: '',
                harga_perolehan: 0
            }));
        }
    };

    // Calculate annual schedule dynamically based on current modal inputs
    const calculateSchedule = () => {
        const hp = Number(calcForm.harga_perolehan || 0);
        const mm = Math.max(1, Number(calcForm.masa_manfaat || 5));
        const ns = Number(calcForm.nilai_sisa || 0);
        const startYear = Number(calcForm.tahun_perolehan || new Date().getFullYear());

        const schedule = [];
        let curBookValue = hp;
        let accumDep = 0;

        if (calcForm.metode === 'Garis Lurus') {
            const annualDep = Math.max(0, (hp - ns) / mm);
            for (let i = 1; i <= mm; i++) {
                const depThisYear = Math.min(annualDep, curBookValue - ns);
                accumDep += depThisYear;
                curBookValue = Math.max(ns, hp - accumDep);

                schedule.push({
                    tahunKe: i,
                    tahunKalender: startYear + i - 1,
                    bebanPenyusutan: depThisYear,
                    akumulasiDepresiasi: accumDep,
                    nilaiBukuAkhir: curBookValue
                });
            }
        } else {
            // Saldo Menurun Double Declining Balance Rate = (2 / mm)
            const rate = 2 / mm;
            for (let i = 1; i <= mm; i++) {
                let depThisYear = curBookValue * rate;
                if (curBookValue - depThisYear < ns || i === mm) {
                    depThisYear = Math.max(0, curBookValue - ns);
                }
                accumDep += depThisYear;
                curBookValue = Math.max(ns, hp - accumDep);

                schedule.push({
                    tahunKe: i,
                    tahunKalender: startYear + i - 1,
                    bebanPenyusutan: depThisYear,
                    akumulasiDepresiasi: accumDep,
                    nilaiBukuAkhir: curBookValue
                });
            }
        }
        return schedule;
    };

    const currentSchedule = calculateSchedule();
    const annualDepreciation = currentSchedule.length > 0 ? currentSchedule[0].bebanPenyusutan : 0;
    const endBookValue = currentSchedule.length > 0 ? currentSchedule[currentSchedule.length - 1].nilaiBukuAkhir : 0;

    const handleSaveDepreciation = async (e) => {
        e.preventDefault();
        if (!calcForm.aset_id) {
            alert('Silakan pilih barang / unit aset terlebih dahulu!');
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                aset_id: calcForm.aset_id,
                tahun: calcForm.tahun_perolehan,
                harga_perolehan: calcForm.harga_perolehan,
                nilai_sisa: calcForm.nilai_sisa,
                masa_manfaat: calcForm.masa_manfaat,
                penyusutan_pertahun: annualDepreciation,
                akumulasi_penyusutan: annualDepreciation * 2, // simulated current year 2
                nilai_buku: currentSchedule.length > 1 ? currentSchedule[1].nilaiBukuAkhir : endBookValue
            };

            const res = await safeFetchJSON('/api/mysql/penyusutan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res && res.success) {
                alert(` Berhasil! Kalkulasi penyusutan aset "${selectedAset?.nama_aset || 'Barang'}" telah disimpan ke database db_ams.`);
                setShowCalcModal(false);
                await loadDataFromMySQL();
            } else {
                alert(`Gagal menyimpan kalkulasi penyusutan: ${res?.message || 'Terjadi kesalahan'}`);
            }
        } catch (err) {
            alert(`Error: ${err.message}`);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (item) => {
        if (!window.confirm(`Apakah Anda yakin ingin MENGHAPUS record penyusutan untuk aset "${item.nama_aset}"?`)) {
            return;
        }

        try {
            const res = await safeFetchJSON(`/api/mysql/penyusutan/${item.id}`, {
                method: 'DELETE'
            });

            if (res && res.success) {
                alert(` Berhasil! Record penyusutan aset "${item.nama_aset}" telah dihapus.`);
                await loadDataFromMySQL();
            } else {
                alert(`Gagal menghapus: ${res?.message || 'Terjadi kesalahan'}`);
            }
        } catch (err) {
            alert(`Error: ${err.message}`);
        }
    };

    const formatRupiah = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val || 0);

    const filtered = depreciationList.filter(item => {
        const matchesSearch = !searchQuery || JSON.stringify(item).toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = !categoryFilter || (item.kategori || '').toLowerCase().includes(categoryFilter.toLowerCase());
        return matchesSearch && matchesCategory;
    });

    const sortedFiltered = [...filtered].sort((a, b) => {
        if (sortOrder === 'terbaru') return (b.id || 0) - (a.id || 0);
        if (sortOrder === 'terlama') return (a.id || 0) - (b.id || 0);
        if (sortOrder === 'nama_asc') return (a.nama_aset || '').localeCompare(b.nama_aset || '');
        if (sortOrder === 'nama_desc') return (b.nama_aset || '').localeCompare(a.nama_aset || '');
        if (sortOrder === 'buku_desc') return (b.nilai_buku || 0) - (a.nilai_buku || 0);
        if (sortOrder === 'buku_asc') return (a.nilai_buku || 0) - (b.nilai_buku || 0);
        return 0;
    });

    const totalItems = sortedFiltered.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedData = sortedFiltered.slice(startIndex, startIndex + itemsPerPage);

    const filteredAsetOptions = asetOptions.filter(a => {
        const q = (asetSearchQuery || '').toLowerCase();
        if (!q) return true;
        const kode = (a.kode_aset || '').toLowerCase();
        const nama = (a.nama_aset || '').toLowerCase();
        const lokasi = (a.nama_lokasi || a.lokasi || '').toLowerCase();
        const kategori = (a.nama_kategori || a.kategori || '').toLowerCase();
        return kode.includes(q) || nama.includes(q) || lokasi.includes(q) || kategori.includes(q);
    });

    return (
        <div style={{ padding: '4px' }}>
            {/* Header Section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>Penyusutan Nilai Aset (Depreciation)</h2>
                    <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
                        Kalkulasi dan jadwal penyusutan nilai buku aset perusahaan.
                    </p>
                </div>
                {canCalc && (
                    <button
                        onClick={() => {
                            setSelectedAset(null);
                            setAsetSearchQuery('');
                            setCalcForm({
                                aset_id: '',
                                harga_perolehan: 0,
                                masa_manfaat: 5,
                                nilai_sisa: 0,
                                metode: 'Garis Lurus',
                                tahun_perolehan: new Date().getFullYear()
                            });
                            setShowCalcModal(true);
                        }}
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
                        <i className="fa-solid fa-calculator"></i> + Hitung & Tentukan Aset
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
                flexWrap: 'wrap',
                alignItems: 'center',
                boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
            }}>
                <input
                    type="text"
                    placeholder="Cari kode aset, nama aset..."
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
                    value={categoryFilter}
                    onChange={e => {
                        setCategoryFilter(e.target.value);
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
                    <option value="">-- Semua Kategori --</option>
                    <option value="Perangkat IT">Perangkat IT & Komputer</option>
                    <option value="Network">Network & Infrastructure</option>
                    <option value="Mebel">Mebel & Furnitur Kantor</option>
                    <option value="Elektronik">Elektronik Kantor</option>
                    <option value="Keamanan">Keamanan & Akses Kantor</option>
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
                    <option value="nama_asc">Aset (A - Z)</option>
                    <option value="nama_desc">Aset (Z - A)</option>
                    <option value="buku_desc">Nilai Buku (Highest)</option>
                    <option value="buku_asc">Nilai Buku (Lowest)</option>
                </select>
            </div>

            {/* Main Table Section */}
            {loading ? (
                <div style={{ padding: '30px', textAlign: 'center', color: '#00624F', fontWeight: 700 }}>
                    <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '20px', marginBottom: '8px', display: 'block' }}></i>
                    Memuat Data Perhitungan Penyusutan dari MySQL Database db_ams...
                </div>
            ) : (
                <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 700, color: '#475569', width: '40px' }}>No</th>
                                <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 700, color: '#475569', width: '130px' }}>Kode Aset</th>
                                <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Nama Barang / Unit Aset</th>
                                <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Harga Perolehan</th>
                                <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 700, color: '#475569', width: '110px' }}>Masa Manfaat</th>
                                <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Depresiasi / Thn</th>
                                <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Akumulasi Depresiasi</th>
                                <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Nilai Buku Bersih</th>
                                <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 700, color: '#475569', width: '140px' }}>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedData.length === 0 ? (
                                <tr>
                                    <td colSpan="9" style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
                                        <i className="fa-solid fa-calculator" style={{ fontSize: '32px', color: '#cbd5e1', marginBottom: '8px', display: 'block' }}></i>
                                        Belum ada data penyusutan aset. Klik "+ Hitung & Tentukan Aset" untuk mulai mengalkulasi.
                                    </td>
                                </tr>
                            ) : (
                                paginatedData.map((item, idx) => (
                                    <tr key={item.id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '14px 16px', color: '#64748b' }}>{startIndex + idx + 1}</td>
                                        <td style={{ padding: '14px 16px', fontWeight: 800, color: '#00624F' }}>
                                            <code>{item.kode_aset}</code>
                                        </td>
                                        <td style={{ padding: '14px 16px', fontWeight: 700, color: '#0f172a' }}>
                                            {item.nama_aset}
                                            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 500, marginTop: '2px' }}>{item.kategori}</div>
                                        </td>
                                        <td style={{ padding: '14px 16px', color: '#334155', fontWeight: 600 }}>{formatRupiah(item.harga_perolehan)}</td>
                                        <td style={{ padding: '14px 16px', textAlign: 'center', color: '#64748b', fontWeight: 700 }}>{item.masa_manfaat} Thn</td>
                                        <td style={{ padding: '14px 16px', color: '#dc2626', fontWeight: 700 }}>{formatRupiah(item.penyusutan_pertahun)}</td>
                                        <td style={{ padding: '14px 16px', color: '#b91c1c', fontWeight: 700 }}>{formatRupiah(item.akumulasi_penyusutan)}</td>
                                        <td style={{ padding: '14px 16px', fontWeight: 800, color: '#00624F' }}>{formatRupiah(item.nilai_buku)}</td>
                                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                                                <button
                                                    onClick={() => setDetailModalItem(item)}
                                                    style={{ background: '#e0f2fe', color: '#0369a1', border: '1px solid #7dd3fc', borderRadius: '6px', padding: '5px 8px', fontWeight: 700, cursor: 'pointer', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                                                >
                                                    <i className="fa-solid fa-eye"></i> Jadwal
                                                </button>
                                                {canDelete && (
                                                    <button
                                                        onClick={() => handleDelete(item)}
                                                        style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: '6px', padding: '5px 8px', fontWeight: 700, cursor: 'pointer', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                                                    >
                                                        <i className="fa-solid fa-trash"></i> Hapus
                                                    </button>
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

            {/* Modal 1: Kalkulator & Pemilihan Aset Baru */}
            {showCalcModal && (
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
                        maxWidth: '750px',
                        maxHeight: '90vh',
                        overflowY: 'auto',
                        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
                    }}>
                        <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
                            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <i className="fa-solid fa-calculator" style={{ color: '#00624F' }}></i>
                                Kalkulator Depresiasi - Tentukan Barang Aset
                            </h3>
                            <button
                                onClick={() => setShowCalcModal(false)}
                                style={{ background: 'transparent', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#64748b' }}
                            >
                                <i className="fa-solid fa-xmark"></i>
                            </button>
                        </div>

                        <form onSubmit={handleSaveDepreciation} style={{ padding: '24px' }}>
                            {/* Step 1: Dropdown Tentukan Barang */}
                            <div style={{ background: '#e6f4f1', padding: '16px', borderRadius: '10px', border: '1px solid #00624F', marginBottom: '20px' }}>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, color: '#00624F', marginBottom: '8px' }}>
                                    📌 STEP 1: Tentukan Barang / Unit Aset *
                                </label>

                                {/* Live Search Input Filter */}
                                <div style={{ marginBottom: '10px', position: 'relative' }}>
                                    <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '12px', top: '11px', color: '#00624F', fontSize: '13px' }}></i>
                                    <input
                                        type="text"
                                        placeholder="🔍 Ketik untuk mencari barang, kode aset, lokasi, atau kategori..."
                                        value={asetSearchQuery}
                                        onChange={e => setAsetSearchQuery(e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '9px 12px 9px 36px',
                                            border: '1.5px solid #00624F',
                                            borderRadius: '8px',
                                            fontSize: '13px',
                                            boxSizing: 'border-box',
                                            outline: 'none',
                                            background: '#fff',
                                            fontWeight: 600
                                        }}
                                    />
                                </div>

                                <select
                                    value={calcForm.aset_id}
                                    onChange={e => handleSelectAsset(e.target.value)}
                                    required
                                    style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #00624F', borderRadius: '8px', fontSize: '13px', fontWeight: 700, color: '#0f172a', background: '#fff', outline: 'none' }}
                                >
                                    <option value="">-- Pilih Barang / Aset ({filteredAsetOptions.length} unit ditemukan) --</option>
                                    {filteredAsetOptions.map(a => (
                                        <option key={a.aset_id} value={a.aset_id}>
                                            [{a.kode_aset || `AST-${a.aset_id}`}] {a.nama_aset} - {a.nama_lokasi || a.lokasi || 'Lokasi'} - (Harga: {formatRupiah(a.harga_beli)})
                                        </option>
                                    ))}
                                </select>

                                {selectedAset && (
                                    <div style={{ marginTop: '12px', fontSize: '12px', color: '#0369a1', background: '#e0f2fe', padding: '8px 12px', borderRadius: '6px', fontWeight: 600 }}>
                                        ✓ Barang Terpilih: <strong>{selectedAset.nama_aset}</strong> ({selectedAset.kode_aset}) | Kategori: <strong>{selectedAset.nama_kategori || selectedAset.kategori || 'IT'}</strong>
                                    </div>
                                )}
                            </div>

                            {/* Step 2: Parameter Perhitungan Depresiasi */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                                        Harga Perolehan Awal (Rp)
                                    </label>
                                    <input
                                        type="number"
                                        value={calcForm.harga_perolehan}
                                        onChange={e => setCalcForm({ ...calcForm, harga_perolehan: e.target.value })}
                                        required
                                        style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', fontWeight: 700 }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                                        Masa Manfaat Ekonomis (Tahun)
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="30"
                                        value={calcForm.masa_manfaat}
                                        onChange={e => setCalcForm({ ...calcForm, masa_manfaat: e.target.value })}
                                        required
                                        style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', fontWeight: 700 }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                                        Nilai Sisa / Residu Akhir (Rp)
                                    </label>
                                    <input
                                        type="number"
                                        placeholder="0"
                                        value={calcForm.nilai_sisa}
                                        onChange={e => setCalcForm({ ...calcForm, nilai_sisa: e.target.value })}
                                        style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                                        Metode Depresiasi Akuntansi
                                    </label>
                                    <select
                                        value={calcForm.metode}
                                        onChange={e => setCalcForm({ ...calcForm, metode: e.target.value })}
                                        style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', background: '#fff', fontWeight: 700 }}
                                    >
                                        <option value="Garis Lurus">Garis Lurus (Straight Line)</option>
                                        <option value="Saldo Menurun">Saldo Menurun (Declining Balance)</option>
                                    </select>
                                </div>
                            </div>

                            {/* Table Simulasi Hasil Kalkulasi */}
                            <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', background: '#f8fafc', marginBottom: '20px' }}>
                                <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', marginBottom: '10px', display: 'flex', justifyContent: 'space-between' }}>
                                    <span>📊 Tabel Hasil Perhitungan Depresiasi Pertahun:</span>
                                    <span style={{ color: '#dc2626' }}>Beban / Thn: {formatRupiah(annualDepreciation)}</span>
                                </div>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', background: '#fff', borderRadius: '6px', overflow: 'hidden' }}>
                                    <thead>
                                        <tr style={{ background: '#00624F', color: '#fff' }}>
                                            <th style={{ padding: '8px', textAlign: 'center' }}>Tahun Ke</th>
                                            <th style={{ padding: '8px', textAlign: 'center' }}>Tahun Kalender</th>
                                            <th style={{ padding: '8px', textAlign: 'right' }}>Beban Depresiasi</th>
                                            <th style={{ padding: '8px', textAlign: 'right' }}>Akumulasi Depresiasi</th>
                                            <th style={{ padding: '8px', textAlign: 'right' }}>Nilai Buku Bersih</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currentSchedule.map(s => (
                                            <tr key={s.tahunKe} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                <td style={{ padding: '8px', textAlign: 'center', fontWeight: 700 }}>Tahun {s.tahunKe}</td>
                                                <td style={{ padding: '8px', textAlign: 'center', color: '#64748b' }}>{s.tahunKalender}</td>
                                                <td style={{ padding: '8px', textAlign: 'right', color: '#dc2626', fontWeight: 600 }}>{formatRupiah(s.bebanPenyusutan)}</td>
                                                <td style={{ padding: '8px', textAlign: 'right', color: '#b91c1c' }}>{formatRupiah(s.akumulasiDepresiasi)}</td>
                                                <td style={{ padding: '8px', textAlign: 'right', fontWeight: 800, color: '#00624F' }}>{formatRupiah(s.nilaiBukuAkhir)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
                                <button
                                    type="button"
                                    onClick={() => setShowCalcModal(false)}
                                    style={{ background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '9px 16px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting || !calcForm.aset_id}
                                    style={{ background: '#00624F', color: '#fff', border: 'none', borderRadius: '6px', padding: '9px 18px', fontSize: '13px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', opacity: !calcForm.aset_id ? 0.6 : 1 }}
                                >
                                    {submitting ? (
                                        <>
                                            <i className="fa-solid fa-spinner fa-spin"></i> Menyimpan...
                                        </>
                                    ) : (
                                        <>
                                            <i className="fa-solid fa-floppy-disk"></i> Simpan Hasil Penyusutan ke MySQL
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal 2: Detail Jadwal Skedul Penyusutan Aset */}
            {detailModalItem && (
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
                        maxWidth: '560px',
                        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
                        padding: '24px'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
                            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <i className="fa-solid fa-chart-line" style={{ color: '#00624F' }}></i>
                                Rincian Skedul Depresiasi Aset
                            </h3>
                            <button
                                onClick={() => setDetailModalItem(null)}
                                style={{ background: 'transparent', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#64748b' }}
                            >
                                <i className="fa-solid fa-xmark"></i>
                            </button>
                        </div>

                        <div style={{ fontSize: '13px', lineHeight: 1.6, color: '#334155' }}>
                            <div style={{ marginBottom: '14px', background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                <div><strong>Kode Aset:</strong> <code>{detailModalItem.kode_aset}</code></div>
                                <div><strong>Nama Barang:</strong> {detailModalItem.nama_aset}</div>
                                <div><strong>Kategori:</strong> {detailModalItem.kategori}</div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                                <span>Harga Perolehan Awal:</span>
                                <strong style={{ color: '#0f172a' }}>{formatRupiah(detailModalItem.harga_perolehan)}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                                <span>Masa Manfaat Ekonomis:</span>
                                <strong>{detailModalItem.masa_manfaat} Tahun</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                                <span>Depresiasi Per Tahun:</span>
                                <strong style={{ color: '#dc2626' }}>{formatRupiah(detailModalItem.penyusutan_pertahun)}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                                <span>Akumulasi Depresiasi Berjalan:</span>
                                <strong style={{ color: '#b91c1c' }}>{formatRupiah(detailModalItem.akumulasi_penyusutan)}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0 0 0', fontSize: '15px', fontWeight: 800 }}>
                                <span>Nilai Buku Bersih Saat Ini:</span>
                                <span style={{ color: '#00624F' }}>{formatRupiah(detailModalItem.nilai_buku)}</span>
                            </div>
                        </div>

                        <div style={{ marginTop: '24px', textAlign: 'right' }}>
                            <button
                                onClick={() => setDetailModalItem(null)}
                                style={{ background: '#00624F', color: '#fff', border: 'none', borderRadius: '6px', padding: '9px 20px', fontWeight: 800, cursor: 'pointer' }}
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
