import mysql from 'mysql2/promise';

async function createPenghapusanTable() {
    try {
        const conn = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'db_ams'
        });

        const createSql = `
        CREATE TABLE IF NOT EXISTS \`penghapusan\` (
          \`penghapusan_id\` INT NOT NULL AUTO_INCREMENT,
          \`aset_id\` INT NOT NULL,
          \`tanggal_penghapusan\` DATE DEFAULT NULL,
          \`alasan\` TEXT,
          \`metode\` ENUM('Dijual', 'Dimusnahkan', 'Hibah', 'Rusak Berat', 'Lainnya') DEFAULT 'Dimusnahkan',
          \`nilai_jual\` DECIMAL(15,2) DEFAULT 0.00,
          \`disetujui_oleh\` VARCHAR(100) DEFAULT NULL,
          \`keterangan\` TEXT,
          \`created_at\` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (\`penghapusan_id\`),
          KEY \`idx_hapus_aset\` (\`aset_id\`),
          CONSTRAINT \`penghapusan_ibfk_1\` FOREIGN KEY (\`aset_id\`) REFERENCES \`aset\` (\`aset_id\`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `;

        await conn.query(createSql);
        console.log('✔ Table penghapusan successfully created in db_ams!');

        const seedSql = `
        INSERT INTO \`penghapusan\` (\`aset_id\`, \`tanggal_penghapusan\`, \`alasan\`, \`metode\`, \`nilai_jual\`, \`disetujui_oleh\`, \`keterangan\`) VALUES
        (10, '2026-05-10', 'Kerusakan motherboard total & out of warranty', 'Dimusnahkan', 0.00, 'Manager Fleet', 'Scraping resmi divisi IT'),
        (15, '2026-06-15', 'Peremajaan unit laptop operasional lama', 'Dijual', 1500000.00, 'Administrator System', 'Lelang internal karyawan'),
        (22, '2026-07-20', 'Hibah unit komputer kantor ke sekolah binaan', 'Hibah', 0.00, 'Manager Fleet', 'Program CSR pendidikan'),
        (30, '2026-08-01', 'Printer tua tidak dapat dipasangkan suku cadang baru', 'Dimusnahkan', 0.00, 'Staff Operasional', 'Afkir inventaris gudang');
        `;

        await conn.query(seedSql);
        console.log('✔ Sample data inserted into penghapusan table!');

        const [rows] = await conn.query('SELECT p.*, a.nama_aset FROM penghapusan p LEFT JOIN aset a ON p.aset_id = a.aset_id');
        console.log('Verification query results:', rows);

        await conn.end();
    } catch (err) {
        console.error('Error creating penghapusan table:', err);
    }
}

createPenghapusanTable();
