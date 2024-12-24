// backend/middleware/sessionManager.js
const pool = require('../config/database');

const sessionManager = {
    async createSession(userId, deviceInfo, ipAddress) {
        const connection = await pool.getConnection();
        try {
            // Generate unique session ID
            const sessionId = require('crypto').randomBytes(32).toString('hex');
            
            // Remove any existing sessions for this user
            await connection.query(
                'DELETE FROM user_sessions WHERE user_id = ?',
                [userId]
            );
            
            // Create new session
            await connection.query(
                `INSERT INTO user_sessions (id, user_id, device_info, ip_address) 
                 VALUES (?, ?, ?, ?)`,
                [sessionId, userId, deviceInfo, ipAddress]
            );
            
            return sessionId;
        } finally {
            connection.release();
        }
    },

    async validateSession(sessionId, userId) {
        const connection = await pool.getConnection();
        try {
            const [sessions] = await connection.query(
                `SELECT * FROM user_sessions 
                 WHERE id = ? AND user_id = ? 
                 AND last_active > DATE_SUB(NOW(), INTERVAL 24 HOUR)`,
                [sessionId, userId]
            );
            
            if (sessions.length === 0) {
                return false;
            }
            
            // Update last_active timestamp
            await connection.query(
                'UPDATE user_sessions SET last_active = NOW() WHERE id = ?',
                [sessionId]
            );
            
            return true;
        } finally {
            connection.release();
        }
    },

    async endSession(sessionId) {
        const connection = await pool.getConnection();
        try {
            await connection.query(
                'DELETE FROM user_sessions WHERE id = ?',
                [sessionId]
            );
        } finally {
            connection.release();
        }
    }
};

module.exports = sessionManager;