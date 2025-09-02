// backend/routes/Admin/Admin_AuditLogs.js
const express = require('express');
const router = express.Router();
const pool = require('../../config/database');
const authMiddleware = require('../../middleware/auth');
const checkPermission = require('../../middleware/checkPermission');

// Get audit logs with filtering and pagination
router.get('/', authMiddleware, (req, res, next) => {
  if (req.user.role !== 'superadmin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied: Superadmin only'
    });
  }
  next();
}, async (req, res) => {
  let connection;
  try {
    const {
      page = 1,
      limit = 20,
      admin_id,
      action,
      entity_type,
      start_date,
      end_date,
      search
    } = req.query;

    const offset = (page - 1) * limit;
    connection = await pool.getConnection();

    // Build WHERE clause
    let whereConditions = [];
    let queryParams = [];

    if (admin_id) {
      whereConditions.push('al.admin_id = ?');
      queryParams.push(admin_id);
    }

    if (action) {
      whereConditions.push('al.action = ?');
      queryParams.push(action);
    }

    if (entity_type) {
      whereConditions.push('al.entity_type = ?');
      queryParams.push(entity_type);
    }

    if (start_date) {
      whereConditions.push('DATE(al.created_at) >= ?');
      queryParams.push(start_date);
    }

    if (end_date) {
      whereConditions.push('DATE(al.created_at) <= ?');
      queryParams.push(end_date);
    }

    if (search) {
      whereConditions.push('(al.admin_name LIKE ? OR al.entity_name LIKE ? OR al.action LIKE ?)');
      const searchTerm = `%${search}%`;
      queryParams.push(searchTerm, searchTerm, searchTerm);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Get total count
    const [countResult] = await connection.query(
      `SELECT COUNT(*) as total FROM audit_logs al ${whereClause}`,
      queryParams
    );
    const total = countResult[0].total;

    // Get audit logs
    const [auditLogs] = await connection.query(
      `SELECT 
        al.id,
        al.admin_id,
        al.admin_name,
        al.action,
        al.entity_type,
        al.entity_id,
        al.entity_name,
        al.old_values,
        al.new_values,
        al.ip_address,
        al.user_agent,
        al.created_at
      FROM audit_logs al 
      ${whereClause}
      ORDER BY al.created_at DESC 
      LIMIT ? OFFSET ?`,
      [...queryParams, parseInt(limit), parseInt(offset)]
    );

    // Parse JSON fields (handle both string and object formats)
    const parsedLogs = auditLogs.map(log => ({
      ...log,
      old_values: log.old_values ? (typeof log.old_values === 'string' ? JSON.parse(log.old_values) : log.old_values) : null,
      new_values: log.new_values ? (typeof log.new_values === 'string' ? JSON.parse(log.new_values) : log.new_values) : null
    }));

    res.json({
      success: true,
      data: parsedLogs,
      pagination: {
        current_page: parseInt(page),
        per_page: parseInt(limit),
        total,
        total_pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch audit logs'
    });
  } finally {
    if (connection) connection.release();
  }
});

// Get audit log details
router.get('/:id', authMiddleware, (req, res, next) => {
  if (req.user.role !== 'superadmin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied: Superadmin only'
    });
  }
  next();
}, async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    connection = await pool.getConnection();

    const [auditLogs] = await connection.query(
      `SELECT 
        al.id,
        al.admin_id,
        al.admin_name,
        al.action,
        al.entity_type,
        al.entity_id,
        al.entity_name,
        al.old_values,
        al.new_values,
        al.ip_address,
        al.user_agent,
        al.created_at
      FROM audit_logs al 
      WHERE al.id = ?`,
      [id]
    );

    if (auditLogs.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Audit log not found'
      });
    }

    const auditLog = auditLogs[0];
    auditLog.old_values = auditLog.old_values ? (typeof auditLog.old_values === 'string' ? JSON.parse(auditLog.old_values) : auditLog.old_values) : null;
    auditLog.new_values = auditLog.new_values ? (typeof auditLog.new_values === 'string' ? JSON.parse(auditLog.new_values) : auditLog.new_values) : null;

    res.json({
      success: true,
      data: auditLog
    });

  } catch (error) {
    console.error('Error fetching audit log:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch audit log'
    });
  } finally {
    if (connection) connection.release();
  }
});

// Get audit log statistics
router.get('/stats/summary', authMiddleware, (req, res, next) => {
  if (req.user.role !== 'superadmin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied: Superadmin only'
    });
  }
  next();
}, async (req, res) => {
  let connection;
  try {
    const { days = 30 } = req.query;
    connection = await pool.getConnection();

    // Get total actions in the last N days
    const [totalActions] = await connection.query(
      `SELECT COUNT(*) as total FROM audit_logs 
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)`,
      [days]
    );

    // Get actions by type
    const [actionsByType] = await connection.query(
      `SELECT action, COUNT(*) as count FROM audit_logs 
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
       GROUP BY action ORDER BY count DESC`,
      [days]
    );

    // Get actions by entity type
    const [actionsByEntity] = await connection.query(
      `SELECT entity_type, COUNT(*) as count FROM audit_logs 
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
       GROUP BY entity_type ORDER BY count DESC`,
      [days]
    );

    // Get most active admins
    const [activeAdmins] = await connection.query(
      `SELECT admin_name, COUNT(*) as count FROM audit_logs 
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
       GROUP BY admin_id, admin_name ORDER BY count DESC LIMIT 10`,
      [days]
    );

    // Get daily activity for the last 7 days
    const [dailyActivity] = await connection.query(
      `SELECT DATE(created_at) as date, COUNT(*) as count FROM audit_logs 
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
       GROUP BY DATE(created_at) ORDER BY date DESC`,
      []
    );

    res.json({
      success: true,
      data: {
        total_actions: totalActions[0].total,
        actions_by_type: actionsByType,
        actions_by_entity: actionsByEntity,
        active_admins: activeAdmins,
        daily_activity: dailyActivity
      }
    });

  } catch (error) {
    console.error('Error fetching audit stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch audit statistics'
    });
  } finally {
    if (connection) connection.release();
  }
});

// Get available filter options
router.get('/filters/options', authMiddleware, (req, res, next) => {
  if (req.user.role !== 'superadmin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied: Superadmin only'
    });
  }
  next();
}, async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();

    // Get unique actions
    const [actions] = await connection.query(
      'SELECT DISTINCT action FROM audit_logs ORDER BY action'
    );

    // Get unique entity types
    const [entityTypes] = await connection.query(
      'SELECT DISTINCT entity_type FROM audit_logs ORDER BY entity_type'
    );

    // Get unique admins
    const [admins] = await connection.query(
      'SELECT DISTINCT admin_id, admin_name FROM audit_logs ORDER BY admin_name'
    );

    res.json({
      success: true,
      data: {
        actions: actions.map(a => a.action),
        entity_types: entityTypes.map(e => e.entity_type),
        admins: admins.map(a => ({ id: a.admin_id, name: a.admin_name }))
      }
    });

  } catch (error) {
    console.error('Error fetching filter options:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch filter options'
    });
  } finally {
    if (connection) connection.release();
  }
});

module.exports = router;
