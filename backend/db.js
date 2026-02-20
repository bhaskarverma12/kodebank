const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: {
    rejectUnauthorized: false
  }
});

async function initializeDB() {
  try {
    const connection = await pool.getConnection();
    console.log('Connected to Aiven MySQL DB!');

    // Create KodUser table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS KodUser (
        uid INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        balance DECIMAL(15,2) DEFAULT 100000.00,
        phone VARCHAR(20),
        role ENUM('Customer', 'manager', 'admin') DEFAULT 'Customer'
      )
    `);
    console.log('KodUser table ensured.');

    // Create UserToken table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS UserToken (
        tid INT AUTO_INCREMENT PRIMARY KEY,
        token VARCHAR(500) NOT NULL,
        uid INT NOT NULL,
        expairy VARCHAR(255),
        FOREIGN KEY (uid) REFERENCES KodUser(uid) ON DELETE CASCADE
      )
    `);
    console.log('UserToken table ensured.');

    connection.release();
  } catch (err) {
    console.error('Error initializing database:', err);
    if (err.code) console.error('Error code:', err.code);
    if (err.fatal) console.error('Fatal error:', err.fatal);
  }
}

module.exports = { pool, initializeDB };
