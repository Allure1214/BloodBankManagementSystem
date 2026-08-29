// backend/config/database.js
const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST || (process.env.NODE_ENV !== 'production' ? 'localhost' : undefined),
    user: process.env.DB_USER || (process.env.NODE_ENV !== 'production' ? 'root' : undefined),
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || (process.env.NODE_ENV !== 'production' ? 'blood_bank_db' : undefined),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

console.log('Database configuration:', {
    ...dbConfig,
    password: '******' // Hide password in logs
});

const pool = mysql.createPool(dbConfig);

// Test database connection
const testConnection = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('Database connection test successful');
        connection.release();
    } catch (error) {
        console.error('Database connection test failed:', error);
        throw error;
    }
};

// Execute connection test
testConnection();

module.exports = pool;
