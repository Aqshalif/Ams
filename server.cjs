const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const { pool, testConnection } = require('./config/db.cjs');

const app = express();
const PORT = process.env.PORT || 3000;
const STORE_PATH = path.join(__dirname, 'data', 'store.json');

app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Helper functions to read/write JSON store safely
function readStore() {
    try {
        if (fs.existsSync(STORE_PATH)) {
            const raw = fs.readFileSync(STORE_PATH, 'utf8');
            return JSON.parse(raw);
        }
    } catch (err) {
        console.error('Error reading store.json:', err);
    }
    return {};
}

function writeStore(data) {
    try {
        fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2), 'utf8');
        return true;
    } catch (err) {
        console.error('Error writing store.json:', err);
        return false;
    }
}

// REST API Endpoints
app.get('/api/store', async (req, res) => {
    const store = readStore();

    try {
        const [asetRows] = await pool.query('SELECT COUNT(*) as total FROM aset');
        if (asetRows && asetRows[0]) {
            store.mysql_aset_total = asetRows[0].total;
        }
    } catch (err) {
        console.log('MySQL live query warning:', err.message);
    }

    res.json({ success: true, data: store, db_name: 'db_ams' });
});

app.post('/api/store', (req, res) => {
    const newData = req.body;
    if (!newData || typeof newData !== 'object') {
        return res.status(400).json({ success: false, message: 'Invalid payload' });
    }
    writeStore(newData);
    res.json({ success: true, message: 'Store saved successfully' });
});

// MySQL Relational Query Endpoint (Performs JOIN for relational tables)
app.get('/api/mysql/:table', async (req, res) => {
    const tableName = req.params.table;
    const allowed = ['aset', 'kategori_aset', 'lokasi', 'maintenance', 'mutasi_aset', 'peminjaman', 'penghapusan', 'penyusutan', 'supplier', 'user'];
    
    if (!allowed.includes(tableName)) {
        return res.status(400).json({ success: false, message: 'Table not allowed' });
    }

    try {
        let queryStr = `SELECT * FROM \`${tableName}\``;
        
        if (tableName === 'aset') {
            queryStr = `
                SELECT a.*, k.nama_kategori as kategori, l.nama_lokasi as lokasi, s.nama_supplier as supplier 
                FROM aset a 
                LEFT JOIN kategori_aset k ON a.kategori_id = k.kategori_id 
                LEFT JOIN lokasi l ON a.lokasi_id = l.lokasi_id 
                LEFT JOIN supplier s ON a.supplier_id = s.supplier_id 
                ORDER BY a.aset_id ASC
            `;
        } else if (tableName === 'maintenance') {
            queryStr = `
                SELECT m.*, a.nama_aset as aset, a.kode_aset 
                FROM maintenance m 
                LEFT JOIN aset a ON m.aset_id = a.aset_id
                ORDER BY m.maintenance_id DESC
            `;
        } else if (tableName === 'peminjaman') {
            queryStr = `
                SELECT p.*, a.nama_aset as aset, a.kode_aset, u.nama_lengkap as peminjam 
                FROM peminjaman p 
                LEFT JOIN aset a ON p.aset_id = a.aset_id 
                LEFT JOIN user u ON p.user_id = u.user_id
                ORDER BY p.peminjaman_id DESC
            `;
        } else if (tableName === 'penyusutan') {
            queryStr = `
                SELECT py.*, a.nama_aset as aset, a.kode_aset, a.harga_beli 
                FROM penyusutan py 
                LEFT JOIN aset a ON py.aset_id = a.aset_id
                ORDER BY py.penyusutan_id DESC
            `;
        } else if (tableName === 'penghapusan') {
            queryStr = `
                SELECT ph.*, a.nama_aset as aset, a.kode_aset 
                FROM penghapusan ph 
                LEFT JOIN aset a ON ph.aset_id = a.aset_id
                ORDER BY ph.penghapusan_id DESC
            `;
        } else if (tableName === 'mutasi_aset') {
            queryStr = `
                SELECT ma.*, a.nama_aset as aset, a.kode_aset 
                FROM mutasi_aset ma 
                LEFT JOIN aset a ON ma.aset_id = a.aset_id
                ORDER BY ma.mutasi_id DESC
            `;
        }

        const limitParam = req.query.limit;
        if (limitParam && limitParam.toLowerCase() !== 'all') {
            const limitNum = parseInt(limitParam, 10);
            if (!isNaN(limitNum) && limitNum > 0) {
                queryStr += ` LIMIT ${limitNum}`;
            }
        }
        
        const [rows] = await pool.query(queryStr);
        res.json({ success: true, data: rows, table: tableName, total: rows.length });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// MySQL Insert POST Endpoint
app.post('/api/mysql/:table', async (req, res) => {
    const tableName = req.params.table;
    const allowed = ['aset', 'kategori_aset', 'lokasi', 'maintenance', 'mutasi_aset', 'peminjaman', 'penghapusan', 'penyusutan', 'supplier', 'user'];
    
    if (!allowed.includes(tableName)) {
        return res.status(400).json({ success: false, message: 'Table not allowed' });
    }

    try {
        const body = req.body;
        if (!body || typeof body !== 'object') {
            return res.status(400).json({ success: false, message: 'Invalid payload' });
        }

        if (tableName === 'aset') {
            const [lastRows] = await pool.query('SELECT max(aset_id) as max_id FROM aset');
            const nextId = (lastRows[0].max_id || 0) + 1;
            const nextKode = body.kode_aset || `AST-OFF-${String(nextId).padStart(4, '0')}`;

            const [result] = await pool.query(
                `INSERT INTO aset (kode_aset, nama_aset, kategori_id, lokasi_id, supplier_id, merk, nomor_seri, tanggal_beli, harga_beli, kondisi, status) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    nextKode,
                    body.nama_aset || 'Unit Aset Baru',
                    parseInt(body.kategori_id || 1, 10),
                    parseInt(body.lokasi_id || 1, 10),
                    parseInt(body.supplier_id || 1, 10),
                    body.merk || 'Generic',
                    body.nomor_seri || `SN-${Date.now()}`,
                    body.tanggal_beli || new Date().toISOString().split('T')[0],
                    parseFloat(body.harga_beli || 0),
                    body.kondisi || 'Baik',
                    body.status || 'Tersedia'
                ]
            );

            return res.json({ success: true, message: 'Aset baru berhasil ditambahkan ke db_ams!', insertId: result.insertId, kode_aset: nextKode });
        }

        if (tableName === 'penyusutan') {
            const asetId = parseInt(body.aset_id || 1, 10);
            const tahun = parseInt(body.tahun || new Date().getFullYear(), 10);
            const nilaiAwal = parseFloat(body.harga_perolehan || body.nilai_awal || 0);
            const nilaiPenyusutan = parseFloat(body.penyusutan_pertahun || body.nilai_penyusutan || 0);
            const nilaiAkhir = parseFloat(body.nilai_buku || body.nilai_akhir || 0);

            const [result] = await pool.query(
                `INSERT INTO penyusutan (aset_id, tahun, nilai_awal, nilai_penyusutan, nilai_akhir) 
                 VALUES (?, ?, ?, ?, ?)`,
                [asetId, tahun, nilaiAwal, nilaiPenyusutan, nilaiAkhir]
            );

            return res.json({ success: true, message: 'Kalkulasi penyusutan aset berhasil disimpan ke db_ams!', insertId: result.insertId });
        }

        const keys = Object.keys(body);
        const values = Object.values(body);
        const placeholders = keys.map(() => '?').join(', ');
        const fields = keys.map(k => `\`${k}\``).join(', ');

        const [result] = await pool.query(`INSERT INTO \`${tableName}\` (${fields}) VALUES (${placeholders})`, values);
        res.json({ success: true, message: `Data ${tableName} berhasil ditambahkan!`, insertId: result.insertId });
    } catch (err) {
        console.error(`Error inserting into ${tableName}:`, err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// MySQL Update PUT Endpoint
app.put('/api/mysql/:table/:id', async (req, res) => {
    const tableName = req.params.table;
    const id = req.params.id;
    const allowed = ['aset', 'kategori_aset', 'lokasi', 'maintenance', 'mutasi_aset', 'peminjaman', 'penghapusan', 'penyusutan', 'supplier', 'user'];
    
    if (!allowed.includes(tableName)) {
        return res.status(400).json({ success: false, message: 'Table not allowed' });
    }

    try {
        const body = req.body;
        if (!body || typeof body !== 'object') {
            return res.status(400).json({ success: false, message: 'Invalid payload' });
        }

        const pkMap = {
            aset: 'aset_id',
            kategori_aset: 'kategori_id',
            lokasi: 'lokasi_id',
            supplier: 'supplier_id',
            maintenance: 'maintenance_id',
            peminjaman: 'peminjaman_id',
            penghapusan: 'penghapusan_id',
            penyusutan: 'penyusutan_id',
            user: 'user_id'
        };

        const pkName = pkMap[tableName] || `${tableName}_id`;

        if (tableName === 'aset') {
            await pool.query(
                `UPDATE aset SET nama_aset = ?, kategori_id = ?, lokasi_id = ?, supplier_id = ?, merk = ?, nomor_seri = ?, harga_beli = ?, kondisi = ?, status = ? WHERE aset_id = ?`,
                [
                    body.nama_aset,
                    parseInt(body.kategori_id || 1, 10),
                    parseInt(body.lokasi_id || 1, 10),
                    parseInt(body.supplier_id || 1, 10),
                    body.merk || '',
                    body.nomor_seri || '',
                    parseFloat(body.harga_beli || 0),
                    body.kondisi || 'Baik',
                    body.status || 'Tersedia',
                    id
                ]
            );
            return res.json({ success: true, message: 'Data aset berhasil diperbarui!' });
        }

        const keys = Object.keys(body).filter(k => k !== pkName && k !== 'created_at' && k !== 'updated_at' && k !== 'kategori' && k !== 'lokasi' && k !== 'supplier');
        const setClause = keys.map(k => `\`${k}\` = ?`).join(', ');
        const values = keys.map(k => body[k]);
        values.push(id);

        await pool.query(`UPDATE \`${tableName}\` SET ${setClause} WHERE \`${pkName}\` = ?`, values);
        res.json({ success: true, message: `Data ${tableName} berhasil diperbarui!` });
    } catch (err) {
        console.error(`Error updating ${tableName}:`, err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// MySQL Delete DELETE Endpoint
app.delete('/api/mysql/:table/:id', async (req, res) => {
    const tableName = req.params.table;
    const id = req.params.id;
    const allowed = ['aset', 'kategori_aset', 'lokasi', 'maintenance', 'mutasi_aset', 'peminjaman', 'penghapusan', 'penyusutan', 'supplier', 'user'];
    
    if (!allowed.includes(tableName)) {
        return res.status(400).json({ success: false, message: 'Table not allowed' });
    }

    try {
        const pkMap = {
            aset: 'aset_id',
            kategori_aset: 'kategori_id',
            lokasi: 'lokasi_id',
            supplier: 'supplier_id',
            maintenance: 'maintenance_id',
            peminjaman: 'peminjaman_id',
            penghapusan: 'penghapusan_id',
            penyusutan: 'penyusutan_id',
            user: 'user_id'
        };

        const pkName = pkMap[tableName] || `${tableName}_id`;

        await pool.query(`DELETE FROM \`${tableName}\` WHERE \`${pkName}\` = ?`, [id]);
        res.json({ success: true, message: `Data ${tableName} berhasil dihapus!` });
    } catch (err) {
        console.error(`Error deleting from ${tableName}:`, err);
        res.status(500).json({ success: false, message: err.message });
    }
});

app.get('/api/table/:table', (req, res) => {
    const tableName = req.params.table;
    const store = readStore();

    if (tableName.startsWith('custom_data_')) {
        const customTables = store.custom_tables || {};
        return res.json({ success: true, data: customTables[tableName] || [] });
    }

    res.json({ success: true, data: store[tableName] || [] });
});

app.post('/api/table/:table', (req, res) => {
    const tableName = req.params.table;
    const payload = req.body;
    const store = readStore();

    if (tableName.startsWith('custom_data_')) {
        if (!store.custom_tables) store.custom_tables = {};
        store.custom_tables[tableName] = payload;
    } else {
        store[tableName] = payload;
    }

    writeStore(store);
    res.json({ success: true, message: `Table ${tableName} updated successfully` });
});

// Serve Static Frontend Assets
app.use(express.static(path.join(__dirname, 'dist')));

// Catch-all route to serve index.html for root or unknown static routes
app.get('*', (req, res) => {
    const distPath = path.join(__dirname, 'dist', 'index.html');
    if (fs.existsSync(distPath)) {
        res.sendFile(distPath);
    } else {
        res.send('AMS Backend Server Running. (Dist folder not built yet)');
    }
});

app.listen(PORT, async () => {
    console.log(`====================================================`);
    console.log(` AMS Node.js Backend Server Running!`);
    console.log(` Server URL: http://localhost:${PORT}`);
    console.log(` Project Path: ${__dirname}`);
    await testConnection();
    console.log(`====================================================`);
});
