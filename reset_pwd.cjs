const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

async function updateDB() {
    try {
        const hash = await bcrypt.hash('123456', 10);
        console.log('Generated hash for "123456":', hash);

        const pool = mysql.createPool({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'db_ams'
        });

        const [result] = await pool.query('UPDATE user SET password = ?', [hash]);
        console.log('Passwords updated successfully. Rows affected:', result.affectedRows);

        // Verification
        const [rows] = await pool.query('SELECT password FROM user WHERE username = "budi1"');
        const isMatch = await bcrypt.compare('123456', rows[0].password);
        console.log('Verification match?', isMatch);

        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}
updateDB();
