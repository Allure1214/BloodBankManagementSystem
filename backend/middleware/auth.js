// backend/middleware/auth.js
const jwt = require('jsonwebtoken');
const pool = require('../config/database');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No valid authorization header found'
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get connection from pool
    const connection = await pool.getConnection();
    try {
      // Check if user exists and is active
      const [users] = await connection.query(
        'SELECT id, role, status FROM users WHERE id = ?',
        [decoded.userId]
      );

      if (users.length === 0) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      const user = users[0];

      // Check if user is inactive
      if (user.status === 'inactive') {
        return res.status(403).json({
          success: false,
          message: 'Your account has been deactivated'
        });
      }

      // Add user info to request
      req.user = {
        id: user.id,
        role: user.role
      };

      next();
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Auth Middleware Error:', error);
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

module.exports = authMiddleware;
