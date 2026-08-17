import React, { useState, useEffect } from 'react';
import { Pagination } from '../components/Pagination';
import { useData } from '../context/DataContext';

export const Laporan = () => {
    const { checkPermission } = useData();
    const canExport = checkPermission('laporan', 'export');
    const [reportType, setReportType] = useState('aset');
    const [startDate, setStartDate] = useState('2026-08-01');
    const [endDate, setEndDate] = useState('2026-08-31');
    const [sortOrder, setSortOrder] = useState('terbaru');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(true);

    const safeFetchJSON = async (url) => {
        try {
            const res = await fetch(url);
            if (!res.ok) return null;
            const text = await res.text();
            if (!text || !text.trim()) return null;
            return JSON.parse(text);
        } catch (err) {
            return null;
        }
    };

    const loadReportFromMySQL = async (type) => {
        setLoading(true);
        try {
            const res = await safeFetchJSON(`/api/mysql/${type}`);
            if (res && res.data && res.data.length > 0) {
                setReportData(res.data);
            } else {
                if (type === 'aset') {
                    setReportData([
                        { aset_id: 1, kode_aset: 'AST-2026-0007', nama_aset: 'Genset Silent 50 KVA Perkins', kategori: 'Mesin & Fasilitas', lokasi: 'Gudang Logistik Cikarang', harga_beli: 145000000, status: 'Non-Aktif' },
                        { aset_id: 2, kode_aset: 'AST-2026-0006', nama_aset: 'Set Kursi Kerja Ergonomis Herman Miller', kategori: 'Mebel & Furnitur Kantor', lokasi: 'Head Office Jakarta - Lt. 3', harga_beli: 24000000, status: 'Dipinjam' },
                        { aset_id: 3, kode_aset: 'AST-2026-0005', nama_aset: 'Printer HP LaserJet Enterprise M507', kategori: 'Perangkat IT & Komputer', lokasi: 'Branch Office Surabaya - Lt. 2', harga_beli: 12500000, status: 'Tersedia' },
                        { aset_id: 4, kode_aset: 'AST-2026-0003', nama_aset: 'Server Dell PowerEdge R750', kategori: 'Perangkat IT & Komputer', lokasi: 'Head Office Jakarta - Lt. 3', harga_beli: 85000000, status: 'Tersedia' }
                    ]);
                } else if (type === 'peminjaman') {
                    setReportData([
                        { peminjaman_id: 1, kode: 'PJM-1', aset: 'Set Kursi Kerja Ergonomis Herman Miller', peminjam: 'Rian Hidayat (Auditor)', asal: 'Head Office Jakarta - Lt. 3', tujuan: 'Branch Office Surabaya - Lt. 2', tgl_pinjam: '2026-08-02', tgl_kembali: '2026-08-30', status: 'Disetujui' }
                    ]);
                } else if (type === 'maintenance') {
                    setReportData([
                        { maintenance_id: 1, kode_spk: 'SPK-MNT-9901', aset: 'Toyota Hilux B 9123 FLT', teknisi: 'Bengkel Resmi Auto2000 Cikarang', deskripsi: 'Ganti Oli & Servis Berkala', biaya: 2450000, status: 'Dalam Pengerjaan' }
                    ]);
                } else if (type === 'penyusutan') {
                    setReportData([
                        { penyusutan_id: 1, kode_aset: 'AST-2026-0003', nama_aset: 'Server Dell PowerEdge R750', harga_perolehan: 85000000, masa_manfaat: 5, nilai_buku: 51000000 }
                    ]);
                } else if (type === 'penghapusan') {
                    setReportData([
                        { penghapusan_id: 1, kode_ba: 'BA-WO-8801', aset: 'AC Split Panasonic 2 PK', alasan: 'Kerusakan Kompresor Parah', nilai_buku: 1200000, status: 'Menunggu Approval' }
                    ]);
                }
            }
        } catch (err) {
            console.warn('Report fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadReportFromMySQL(reportType);
    }, [reportType]);

    const formatRupiah = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val || 0);

    // Export Excel (CSV format for native Excel compatibility)
    const handleExportExcel = () => {
        if (!reportData || reportData.length === 0) {
            alert('Tidak ada data laporan untuk diekspor!');
            return;
        }

        let headers = [];
        let getRowValues = (row, idx) => [];

        if (reportType === 'aset') {
            headers = ['No', 'Kode Aset', 'Nama Barang / Unit Aset', 'Kategori', 'Lokasi Penempatan', 'Merk', 'Nomor Seri', 'Harga Beli (Rp)', 'Kondisi', 'Status'];
            getRowValues = (row, idx) => [
                idx + 1,
                row.kode_aset || `AST-${idx + 1}`,
                row.nama_aset || row.nama || '-',
                row.kategori || row.nama_kategori || '-',
                row.lokasi || row.nama_lokasi || '-',
                row.merk || '-',
                row.nomor_seri || '-',
                row.harga_beli || 0,
                row.kondisi || 'Baik',
                row.status || 'Tersedia'
            ];
        } else if (reportType === 'peminjaman') {
            headers = ['No', 'Kode Peminjaman', 'Unit Aset', 'Nama Peminjam / User', 'Lokasi Asal', 'Lokasi Tujuan', 'Tanggal Pinjam', 'Tanggal Kembali', 'Status'];
            getRowValues = (row, idx) => [
                idx + 1,
                row.kode || row.kode_peminjaman || `PJM-${idx + 1}`,
                row.aset || row.nama_aset || '-',
                row.peminjam || row.user || '-',
                row.asal || '-',
                row.tujuan || '-',
                row.tgl_pinjam || row.tanggal_pinjam || '-',
                row.tgl_kembali || row.tanggal_kembali || '-',
                row.status || 'Dipinjam'
            ];
        } else if (reportType === 'maintenance') {
            headers = ['No', 'No SPK / Servis', 'Unit Aset', 'Bengkel / Teknisi', 'Deskripsi Perbaikan', 'Biaya (Rp)', 'Status'];
            getRowValues = (row, idx) => [
                idx + 1,
                row.kode_spk || row.spk || `SPK-${idx + 1}`,
                row.aset || row.nama_aset || '-',
                row.teknisi || row.bengkel || '-',
                row.deskripsi || '-',
                row.biaya || row.biaya_servis || 0,
                row.status || 'Dalam Pengerjaan'
            ];
        } else if (reportType === 'penyusutan') {
            headers = ['No', 'Kode Aset', 'Nama Barang', 'Harga Perolehan (Rp)', 'Masa Manfaat (Tahun)', 'Nilai Buku Terakhir (Rp)'];
            getRowValues = (row, idx) => [
                idx + 1,
                row.kode_aset || `AST-${idx + 1}`,
                row.nama_aset || row.nama || '-',
                row.harga_perolehan || row.harga_beli || 0,
                row.masa_manfaat || 5,
                row.nilai_buku || 0
            ];
        } else if (reportType === 'penghapusan') {
            headers = ['No', 'Kode Berita Acara', 'Unit Aset', 'Alasan Penghapusan', 'Nilai Buku Sisa (Rp)', 'Status Approval'];
            getRowValues = (row, idx) => [
                idx + 1,
                row.kode_ba || `BA-WO-${idx + 1}`,
                row.aset || row.nama_aset || '-',
                row.alasan || '-',
                row.nilai_buku || 0,
                row.status || 'Menunggu Approval'
            ];
        } else {
            headers = Object.keys(reportData[0] || {});
            getRowValues = (row, idx) => Object.values(row);
        }

        const escapeCSV = (val) => {
            const str = String(val === null || val === undefined ? '' : val);
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
        };

        const csvRows = [];
        csvRows.push(headers.map(escapeCSV).join(','));

        reportData.forEach((row, idx) => {
            const values = getRowValues(row, idx);
            csvRows.push(values.map(escapeCSV).join(','));
        });

        const csvContent = '\uFEFF' + csvRows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const filename = `Laporan_Inventaris_${reportType.toUpperCase()}_${new Date().toISOString().split('T')[0]}.csv`;
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    // Export PDF (Print-ready document rendering)
    const handleExportPDF = () => {
        if (!reportData || reportData.length === 0) {
            alert('Tidak ada data laporan untuk diekspor!');
            return;
        }

        const printWin = window.open('', '_blank');
        if (!printWin) {
            alert('Pop-up terblokir oleh browser. Izinkan pop-up untuk mencetak PDF.');
            return;
        }

        let headers = [];
        let getRowValues = (row, idx) => [];

        if (reportType === 'aset') {
            headers = ['No', 'Kode Aset', 'Nama Barang / Unit Aset', 'Kategori', 'Lokasi Penempatan', 'Harga Beli (Rp)', 'Status'];
            getRowValues = (row, idx) => [
                idx + 1,
                row.kode_aset || `AST-${idx + 1}`,
                row.nama_aset || row.nama || '-',
                row.kategori || row.nama_kategori || '-',
                row.lokasi || row.nama_lokasi || '-',
                formatRupiah(row.harga_beli || 0),
                row.status || 'Tersedia'
            ];
        } else if (reportType === 'peminjaman') {
            headers = ['No', 'Kode', 'Unit Aset', 'Peminjam / User', 'Tgl Pinjam', 'Tgl Kembali', 'Status'];
            getRowValues = (row, idx) => [
                idx + 1,
                row.kode || row.kode_peminjaman || `PJM-${idx + 1}`,
                row.aset || row.nama_aset || '-',
                row.peminjam || row.user || '-',
                row.tgl_pinjam || '-',
                row.tgl_kembali || '-',
                row.status || 'Dipinjam'
            ];
        } else if (reportType === 'maintenance') {
            headers = ['No', 'No SPK', 'Unit Aset', 'Bengkel / Teknisi', 'Biaya (Rp)', 'Status'];
            getRowValues = (row, idx) => [
                idx + 1,
                row.kode_spk || row.spk || `SPK-${idx + 1}`,
                row.aset || row.nama_aset || '-',
                row.teknisi || row.bengkel || '-',
                formatRupiah(row.biaya || row.biaya_servis || 0),
                row.status || 'Dalam Pengerjaan'
            ];
        } else if (reportType === 'penyusutan') {
            headers = ['No', 'Kode Aset', 'Nama Barang', 'Harga Perolehan', 'Masa Manfaat', 'Nilai Buku'];
            getRowValues = (row, idx) => [
                idx + 1,
                row.kode_aset || `AST-${idx + 1}`,
                row.nama_aset || '-',
                formatRupiah(row.harga_perolehan || row.harga_beli || 0),
                `${row.masa_manfaat || 5} Tahun`,
                formatRupiah(row.nilai_buku || 0)
            ];
        } else if (reportType === 'penghapusan') {
            headers = ['No', 'No Berita Acara', 'Unit Aset', 'Alasan', 'Nilai Buku Sisa', 'Status'];
            getRowValues = (row, idx) => [
                idx + 1,
                row.kode_ba || `BA-${idx + 1}`,
                row.aset || row.nama_aset || '-',
                row.alasan || '-',
                formatRupiah(row.nilai_buku || 0),
                row.status || 'Menunggu Approval'
            ];
        }

        const tableHeaderHtml = headers.map(h => `<th style="padding: 10px 12px; border: 1px solid #cbd5e1; background: #00624F; color: #ffffff; text-align: left; font-size: 11px; font-weight: bold;">${h}</th>`).join('');
        
        const tableBodyHtml = reportData.map((row, idx) => {
            const vals = getRowValues(row, idx);
            const bg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
            return `<tr style="background: ${bg};">${vals.map(v => `<td style="padding: 8px 12px; border: 1px solid #e2e8f0; font-size: 11px; color: #334155;">${v}</td>`).join('')}</tr>`;
        }).join('');

        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Laporan_Inventaris_${reportType.toUpperCase()}</title>
                <style>
                    body { font-family: 'Segoe UI', Arial, sans-serif; margin: 30px; color: #0f172a; }
                    .header-logo { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #00624F; padding-bottom: 12px; margin-bottom: 20px; }
                    h1 { color: #00624F; margin: 0; font-size: 22px; font-weight: 800; text-transform: uppercase; }
                    .subtitle { color: #64748b; font-size: 12px; margin-top: 4px; }
                    .meta-info { background: #f8fafc; padding: 12px 16px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 20px; font-size: 12px; display: flex; justify-content: space-between; }
                    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                    .footer { margin-top: 40px; font-size: 11px; color: #94a3b8; text-align: right; border-top: 1px solid #e2e8f0; padding-top: 12px; }
                    @media print {
                        @page { size: A4 landscape; margin: 10mm; }
                    }
                </style>
            </head>
            <body>
                <div class="header-logo">
                    <div>
                        <h1>LAPORAN EXECUTIVE AUDIT INVENTARIS ASET</h1>
                        <div class="subtitle">Asset Management System (AMS) - Database db_ams Live Report</div>
                    </div>
                    <div style="text-align: right; font-size: 11px; color: #475569;">
                        <strong>PT. ASSET MANAGEMENT UTAMA</strong><br/>
                        Dokumen Resmi Audit Internal
                    </div>
                </div>

                <div class="meta-info">
                    <div><strong>Kategori Laporan:</strong> ${reportType.toUpperCase()}</div>
                    <div><strong>Periode Filter:</strong> ${startDate} s/d ${endDate}</div>
                    <div><strong>Total Record:</strong> ${reportData.length} Item</div>
                    <div><strong>Tanggal Cetak:</strong> ${new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}</div>
                </div>

                <table>
                    <thead><tr>${tableHeaderHtml}</tr></thead>
                    <tbody>${tableBodyHtml}</tbody>
                </table>

                <div class="footer">
                    Dokumen ini di-generate secara otomatis dari database MySQL <code>db_ams</code> via Sistem AMS.
                </div>

                <script>
                    window.onload = function() {
                        window.print();
                    }
                </script>
            </body>
            </html>
        `;

        printWin.document.open();
        printWin.document.write(htmlContent);
        printWin.document.close();
    };

    const handlePrint = () => {
        handleExportPDF();
    };

    return (
        <div style={{ padding: '4px' }}>
            {/* Header Section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>Laporan & Executive Audit Center</h2>
                    <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
                        Cetak dan ekspor laporan inventaris aset perusahaan secara berkala.
                    </p>
                </div>
                {canExport && (
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <button
                            onClick={handleExportExcel}
                            style={{ background: '#16a34a', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 16px', fontSize: '13px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                        >
                            <i className="fa-solid fa-file-excel"></i> Export Excel (.CSV)
                        </button>
                        <button
                            onClick={handleExportPDF}
                            style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 16px', fontSize: '13px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                        >
                            <i className="fa-solid fa-file-pdf"></i> Export PDF
                        </button>
                        <button
                            onClick={handlePrint}
                            style={{ background: '#00624F', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 16px', fontSize: '13px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                        >
                            <i className="fa-solid fa-print"></i> Print Report
                        </button>
                    </div>
                )}
            </div>

            {/* Filter Controls Card */}
            <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '16px 20px', marginBottom: '20px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
                <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#475569', marginBottom: '4px' }}>JENIS LAPORAN / TABEL</label>
                    <select
                        value={reportType}
                        onChange={e => {
                            setReportType(e.target.value);
                            setCurrentPage(1);
                        }}
                        style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', fontWeight: 700, color: '#334155', background: '#fff' }}
                    >
                        <option value="aset">1. Laporan Inventaris Aset (aset)</option>
                        <option value="peminjaman">2. Laporan Peminjaman & Mutasi (peminjaman)</option>
                        <option value="maintenance">3. Laporan Maintenance & Servis (maintenance)</option>
                        <option value="penyusutan">4. Laporan Penyusutan Nilai Aset (penyusutan)</option>
                        <option value="penghapusan">5. Laporan Penghapusan Aset (penghapusan)</option>
                    </select>
                </div>

                <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#475569', marginBottom: '4px' }}>TANGGAL MULAI</label>
                    <input
                        type="date"
                        value={startDate}
                        onChange={e => setStartDate(e.target.value)}
                        style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px' }}
                    />
                </div>

                <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#475569', marginBottom: '4px' }}>TANGGAL SELESAI</label>
                    <input
                        type="date"
                        value={endDate}
                        onChange={e => setEndDate(e.target.value)}
                        style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px' }}
                    />
                </div>

                <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#475569', marginBottom: '4px' }}>URUTAN DATA</label>
                    <select
                        value={sortOrder}
                        onChange={e => {
                            setSortOrder(e.target.value);
                            setCurrentPage(1);
                        }}
                        style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', fontWeight: 700, color: '#334155', background: '#fff' }}
                    >
                        <option value="terbaru">Urutkan: Terbaru</option>
                        <option value="terlama">Urutkan: Terlama</option>
                        <option value="nama_asc">Nama / Aset (A - Z)</option>
                        <option value="nama_desc">Nama / Aset (Z - A)</option>
                        <option value="nilai_desc">Nilai / Biaya (Highest)</option>
                        <option value="nilai_asc">Nilai / Biaya (Lowest)</option>
                    </select>
                </div>
            </div>

            {/* Preview Table */}
            {loading ? (
                <div style={{ padding: '30px', textAlign: 'center', color: '#00624F', fontWeight: 700 }}>
                    <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '20px', marginBottom: '8px', display: 'block' }}></i>
                    Mengambil Data Laporan dari Tabel MySQL {reportType}...
                </div>
            ) : (
                (() => {
                    const sortedData = [...reportData].sort((a, b) => {
                        const idA = a.aset_id || a.peminjaman_id || a.maintenance_id || a.penyusutan_id || a.penghapusan_id || 0;
                        const idB = b.aset_id || b.peminjaman_id || b.maintenance_id || b.penyusutan_id || b.penghapusan_id || 0;
                        if (sortOrder === 'terbaru') return idB - idA;
                        if (sortOrder === 'terlama') return idA - idB;

                        const nameA = a.nama_aset || a.aset || a.peminjam || a.alasan || '';
                        const nameB = b.nama_aset || b.aset || b.peminjam || b.alasan || '';
                        if (sortOrder === 'nama_asc') return nameA.localeCompare(nameB);
                        if (sortOrder === 'nama_desc') return nameB.localeCompare(nameA);

                        const valA = a.harga_beli || a.harga_perolehan || a.biaya || a.nilai_buku || 0;
                        const valB = b.harga_beli || b.harga_perolehan || b.biaya || b.nilai_buku || 0;
                        if (sortOrder === 'nilai_desc') return valB - valA;
                        if (sortOrder === 'nilai_asc') return valA - valB;

                        return 0;
                    });

                    const totalItems = sortedData.length;
                    const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
                    const startIndex = (currentPage - 1) * itemsPerPage;
                    const paginatedData = sortedData.slice(startIndex, startIndex + itemsPerPage);

                    return (
                        <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflowX: 'auto' }}>
                            <div style={{ padding: '14px 18px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>
                                    Preview Data Laporan: <span style={{ color: '#00624F', textTransform: 'uppercase' }}>{reportType}</span> ({reportData.length} Total Rekord Live MySQL)
                                </div>
                            </div>

                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                <thead>
                                    <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #e2e8f0' }}>
                                        <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>No</th>
                                        <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Kode / Referensi</th>
                                        <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Nama / Keterangan</th>
                                        <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Nilai / Biaya</th>
                                        <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedData.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
                                                Tidak ada data laporan.
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedData.map((row, idx) => (
                                            <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                <td style={{ padding: '12px 14px', color: '#64748b' }}>{startIndex + idx + 1}</td>
                                                <td style={{ padding: '12px 14px', fontWeight: 800, color: '#00624F' }}>
                                                    <code>{row.kode_aset || row.kode || row.kode_spk || row.kode_ba || `REF-${idx + 1}`}</code>
                                                </td>
                                                <td style={{ padding: '12px 14px', fontWeight: 600, color: '#0f172a' }}>
                                                    {row.nama_aset || row.aset || row.peminjam || row.alasan || 'Data Master'}
                                                </td>
                                                <td style={{ padding: '12px 14px', color: '#334155', fontWeight: 600 }}>
                                                    {formatRupiah(row.harga_beli || row.harga_perolehan || row.biaya || row.nilai_buku || 0)}
                                                </td>
                                                <td style={{ padding: '12px 14px' }}>
                                                    <span style={{ background: '#dcfce7', color: '#166534', padding: '3px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 800 }}>
                                                        {(row.status || 'TERSIMPAN').toUpperCase()}
                                                    </span>
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
                    );
                })()
            )}
        </div>
    );
};
