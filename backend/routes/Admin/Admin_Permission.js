// backend/routes/admin/settings.js
const express = require('express');
const router = express.Router();
const pool = require('../../config/database');
const authMiddleware = require('../../middleware/auth');

// Get all normal admins with their permissions
router.get('/normal-admins', authMiddleware, async (req, res) => {
  let connection;
  try {
    // Only superadmin can access this
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Superadmin only'
      });
    }

    connection = await pool.getConnection();
    
    // Get all admin users (excluding superadmins) with their permissions
    const [admins] = await connection.query(`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.status,
        ap.can_manage_inventory,
        ap.can_manage_campaigns,
        ap.can_manage_blood_banks,
        ap.can_manage_donations,
        ap.can_manage_appointments,
        ap.can_manage_reports
      FROM users u
      LEFT JOIN admin_permissions ap ON u.id = ap.user_id
      WHERE u.role = 'admin'
      ORDER BY u.name
    `);

    // Format the response
    const formattedAdmins = admins.map(admin => ({
      id: admin.id,
      name: admin.name,
      email: admin.email,
      status: admin.status,
      permissions: {
        can_manage_inventory: Boolean(admin.can_manage_inventory),
        can_manage_campaigns: Boolean(admin.can_manage_campaigns),
        can_manage_blood_banks: Boolean(admin.can_manage_blood_banks),
        can_manage_donations: Boolean(admin.can_manage_donations),
        can_manage_appointments: Boolean(admin.can_manage_appointments),
        can_manage_reports: Boolean(admin.can_manage_reports)
      }
    }));

    res.json({
      success: true,
      admins: formattedAdmins
    });

  } catch (error) {
    console.error('Error fetching admin users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch admin users'
    });
  } finally {
    if (connection) connection.release();
  }
});

// Update admin permissions
router.put('/:adminId', authMiddleware, async (req, res) => {
  let connection;
  try {
    // Only superadmin can update permissions
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Superadmin only'
      });
    }

    const { adminId } = req.params;
    const permissions = req.body;

    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Verify the user is an admin
    const [users] = await connection.query(
      'SELECT role FROM users WHERE id = ?',
      [adminId]
    );

    if (users.length === 0 || users[0].role !== 'admin') {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Invalid admin user'
      });
    }

    // Update or insert permissions
    const [existing] = await connection.query(
      'SELECT id FROM admin_permissions WHERE user_id = ?',
      [adminId]
    );

    if (existing.length > 0) {
      // Update existing permissions
      await connection.query(
        `UPDATE admin_permissions 
         SET ? 
         WHERE user_id = ?`,
        [permissions, adminId]
      );
    } else {
      // Insert new permissions
      await connection.query(
        `INSERT INTO admin_permissions 
         SET ?, user_id = ?`,
        [{ ...permissions, user_id: adminId }, adminId]
      );
    }

    await connection.commit();

    res.json({
      success: true,
      message: 'Permissions updated successfully'
    });

  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error('Error updating permissions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update permissions'
    });
  } finally {
    if (connection) connection.release();
  }
});

module.exports = router;