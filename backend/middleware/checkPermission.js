// backend/middleware/checkPermission.js
const pool = require('../config/database');
const jwt = require('jsonwebtoken');

const checkPermission = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      // Get token from header
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          message: 'No valid authorization header found'
        });
      }

      // Verify token
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user information
      const connection = await pool.getConnection();
      try {
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

        // Allow superadmin to bypass all permission checks immediately
        if (user.role === 'superadmin') {
          req.user = {
            ...user,
            permissions: {
              can_manage_users: true,
              can_manage_inventory: true,
              can_manage_campaigns: true,
              can_manage_blood_banks: true,
              can_manage_donations: true,
              can_manage_appointments: true,
              can_manage_reports: true
            }
          };
          return next();
        }

        // Check if user is admin
        if (user.role !== 'admin') {
          return res.status(403).json({
            success: false,
            message: 'Access denied: Insufficient permissions'
          });
        }

        // Check specific permission for admin
        const [permissions] = await connection.query(
          `SELECT * FROM admin_permissions WHERE user_id = ?`,
          [user.id]
        );

        if (permissions.length === 0 || !permissions[0][requiredPermission]) {
          return res.status(403).json({
            success: false,
            message: 'Access denied: Insufficient permissions'
          });
        }

        // Attach user and permissions to request
        req.user = {
          ...user,
          permissions: permissions[0]
        };
        next();
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Permission check error:', error);
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Invalid token'
        });
      }
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token expired'
        });
      }
      res.status(500).json({
        success: false,
        message: 'Error checking permissions'
      });
    }
  };
};

module.exports = checkPermission;