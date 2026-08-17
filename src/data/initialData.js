export const STORE_VERSION = 'v2.6_no_vehicles';

export const INITIAL_DATA = {
    users: [
        { user_id: 1, nama_lengkap: "Administrator System", username: "admin", role: "admin", email: "admin@gofleet.co.id" },
        { user_id: 2, nama_lengkap: "Staff Operasional", username: "staff", role: "staff", email: "staff@gofleet.co.id" },
        { user_id: 3, nama_lengkap: "Manager Fleet", username: "manager", role: "manager", email: "manager@gofleet.co.id" },
        { user_id: 4, nama_lengkap: "Rian Hidayat", username: "rian", role: "staff", email: "rian@gofleet.co.id" },
        { user_id: 5, nama_lengkap: "Dewi Lestari", username: "dewi", role: "manager", email: "dewi@gofleet.co.id" }
    ],

    kategori: [
        { kategori_id: 1, nama_kategori: "Elektronik & IT", deskripsi: "Laptop, Desktop PC, Server, Printer, Monitor" },
        { kategori_id: 3, nama_kategori: "Peralatan Kantor", deskripsi: "Meja Kerja, Kursi Ergonomis, Brankas, Proyektor" },
        { kategori_id: 4, nama_kategori: "Mesin & Fasilitas", deskripsi: "AC Split, Generator Set, Dispenser, Mesin Absensi" }
    ],

    lokasi: [
        { lokasi_id: 1, nama_lokasi: "Head Office Jakarta - Lt. 3", alamat: "Jl. Lapangan Bola No. 1, Kebon Jeruk, Jakarta Barat" },
        { lokasi_id: 2, nama_lokasi: "Pool Armada Sunter - Jakarta Utara", alamat: "Jl. Danau Sunter Selatan No. 12, Sunter" },
        { lokasi_id: 3, nama_lokasi: "Branch Office Surabaya - Lt. 2", alamat: "Jl. Raya Darmo No. 45, Surabaya" },
        { lokasi_id: 4, nama_lokasi: "Gudang Logistik Cikarang", alamat: "Kawasan Industri Jababeka Phase 3, Cikarang" }
    ],

    supplier: [
        { supplier_id: 1, nama_supplier: "PT Astra Graphia Tbk", kontak: "Bambang Kurnia", telepon: "021-3904567", email: "sales@astragraphia.co.id", alamat: "Jl. Kramat Raya No. 43, Jakarta" },
        { supplier_id: 2, nama_supplier: "PT Bhinneka Mentari Dimensi", kontak: "Siska Putri", telepon: "021-29292828", email: "b2b@bhinneka.com", alamat: "Jl. Gunung Sahari Raya No. 73C, Jakarta" },
        { supplier_id: 3, nama_supplier: "CV Furnitur Jaya Abadi", kontak: "Hendra Wijaya", telepon: "031-5678901", email: "info@furniturjaya.com", alamat: "Jl. Rungkut Industri No. 88, Surabaya" }
    ],

    aset: [
        { aset_id: 1, kode_aset: "AST-2026-0001", nama_aset: "Lenovo ThinkPad X1 Carbon Gen 11", kategori_id: 1, lokasi_id: 1, supplier_id: 2, merk: "Lenovo", nomor_seri: "SN-TPX1-99201", tanggal_beli: "2024-01-15", harga_beli: 38500000, kondisi: "Perlu Perbaikan", status: "Dalam Perawatan" },
        { aset_id: 3, kode_aset: "AST-2026-0003", nama_aset: "Server Dell PowerEdge R750", kategori_id: 1, lokasi_id: 1, supplier_id: 2, merk: "Dell", nomor_seri: "SN-PE-R750-3341", tanggal_beli: "2023-11-20", harga_beli: 85000000, kondisi: "Baik", status: "Tersedia" },
        { aset_id: 5, kode_aset: "AST-2026-0005", nama_aset: "Printer HP LaserJet Enterprise M507", kategori_id: 1, lokasi_id: 3, supplier_id: 1, merk: "HP", nomor_seri: "SN-HP-M507-8812", tanggal_beli: "2024-03-10", harga_beli: 12500000, kondisi: "Baik", status: "Tersedia" },
        { aset_id: 6, kode_aset: "AST-2026-0006", nama_aset: "Set Kursi Kerja Ergonomis Herman Miller", kategori_id: 3, lokasi_id: 1, supplier_id: 3, merk: "Herman Miller", nomor_seri: "SN-HM-AERON-09", tanggal_beli: "2024-04-01", harga_beli: 24000000, kondisi: "Baik", status: "Dipinjam" },
        { aset_id: 7, kode_aset: "AST-2026-0007", nama_aset: "Genset Silent 50 KVA Perkins", kategori_id: 4, lokasi_id: 4, supplier_id: 1, merk: "Perkins", nomor_seri: "SN-PK-50KVA-77", tanggal_beli: "2022-08-15", harga_beli: 145000000, kondisi: "Rusak Berat", status: "Non-Aktif" }
    ],

    peminjaman: [
        { peminjaman_id: 1, aset_id: 6, user_id: 4, tanggal_pengajuan: "2026-08-01", tanggal_pinjam: "2026-08-02", tanggal_kembali: "2026-08-30", status: "Disetujui", lokasi_asal_id: 1, lokasi_tujuan_id: 3, keterangan: "Peminjaman fasilitas kerja direksi cabang Surabaya", disetujui_oleh: 5, alasan_penolakan: "" },
        { peminjaman_id: 2, aset_id: 5, user_id: 2, tanggal_pengajuan: "2026-08-05", tanggal_pinjam: "2026-08-06", tanggal_kembali: "2026-08-12", status: "Menunggu Persetujuan", lokasi_asal_id: 3, lokasi_tujuan_id: 2, keterangan: "Dukungan operasional cetak dokumen event Sunter", disetujui_oleh: null, alasan_penolakan: "" }
    ],

    maintenance: [
        { maintenance_id: 1, aset_id: 1, tanggal_maintenance: "2026-08-05", jenis_perawatan: "Perbaikan Display LCD & Service Keypad Keyboard", biaya: 3500000, teknisi: "Budi Santoso", status_perawatan: "Dalam Perawatan", tgl_selesai: null, keterangan: "Layar bergaris dan beberapa tombol keyboard tidak merespon." },
        { maintenance_id: 2, aset_id: 3, tanggal_maintenance: "2026-07-20", jenis_perawatan: "Pembersihan Dust Fan & Ganti Thermal Paste Server", biaya: 1200000, teknisi: "Eko Prasetyo", status_perawatan: "Selesai", tgl_selesai: "2026-07-21", keterangan: "Perawatan rutin pencegahan overheat server." }
    ],

    penyusutan: [
        { penyusutan_id: 1, aset_id: 1, tahun: 2024, nilai_awal: 38500000, nilai_penyusutan: 7700000, nilai_akhir: 30800000, metode: "Metode Garis Lurus", umur_ekonomis: 5, updated_at: "2026-08-07 14:00:00" },
        { penyusutan_id: 3, aset_id: 3, tahun: 2023, nilai_awal: 85000000, nilai_penyusutan: 17000000, nilai_akhir: 68000000, metode: "Metode Garis Lurus", umur_ekonomis: 5, updated_at: "2026-08-05 09:30:00" }
    ],

    penghapusan: [
        { penghapusan_id: 1, aset_id: 7, user_id: 2, tanggal_pengajuan: "2026-08-03", alasan: "Genset mengalami kerusakan dinamo permanen, biaya perbaikan melebihi nilai ekonomis aset.", status: "Disetujui", disetujui_oleh: 3, tanggal_persetujuan: "2026-08-04", keterangan_persetujuan: "Disetujui untuk dihapuskan (Write-Off)." }
    ]
};
