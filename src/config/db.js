const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: 'hospital_app',
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0,
  connectTimeout: 30000, // 👈 very important
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// Test connection once at startup
(async () => {
  try {
    const conn = await pool.getConnection();
    console.log('✅ MySQL pool connected');
    conn.release();
  } catch (err) {
    console.error('❌ MySQL pool failed:', err.message);
  }
})();

module.exports = pool;
