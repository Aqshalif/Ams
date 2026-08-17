const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'db_ams',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log(' Connected successfully to MySQL Database: db_ams');
        connection.release();
        return true;
    } catch (err) {
        console.error(' MySQL Connection Warning:', err.message);
        return false;
    }
}

module.exports = {
    pool,
    testConnection
};
