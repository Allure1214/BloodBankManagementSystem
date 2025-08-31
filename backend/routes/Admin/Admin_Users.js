const express = require('express');
const router = express.Router();
const pool = require('../../config/database');
const authMiddleware = require('../../middleware/auth');
const bcrypt = require('bcryptjs');

const validatePassword = (password) => {
  if (password.length < 8 || password.length > 20) {
      return { isValid: false, message: 'Password must be between 8 and 20 characters' };
  }
  if (!/[a-z]/.test(password)) {
      return { isValid: false, message: 'Password must include at least one lowercase letter' };
  }
  if (!/[A-Z]/.test(password)) {
      return { isValid: false, message: 'Password must include at least one uppercase letter' };
  }
  if (!/[0-9]/.test(password)) {
      return { isValid: false, message: 'Password must include at least one number' };
  }
  return { isValid: true };
};

router.get('/appointments', async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    
    const [results] = await connection.query(
      `SELECT 
        cr.id,
        cr.campaign_id,
        cr.name,
        cr.email,
        cr.phone,
        cr.blood_type,
        cr.preferred_time,
        cr.session_date,
        cr.status,
        cr.created_at,
        c.location as campaign_location,  // Make sure this is included
        c.address as location
      FROM campaign_reservations cr
      JOIN campaigns c ON cr.campaign_id = c.id
      WHERE cr.user_id = ?
      ORDER BY cr.session_date DESC, cr.preferred_time DESC`,
      [req.user.id]
    );

    res.json({
      success: true,
      data: results
    });

  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch appointments'
    });
  } finally {
    if (connection) connection.release();
  }
});

// Get all users
router.get('/', authMiddleware, async (req, res) => {
  if (req.user.role !== 'superadmin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied: Super Admin Only'
    });
  }
  let connection;
  try {
    connection = await pool.getConnection();
    const [users] = await connection.query(
      `SELECT id, name, email, role, status, created_at 
       FROM users 
       ORDER BY created_at DESC`
    );
    
    res.json({
      success: true,
      users
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users'
    });
  } finally {
    if (connection) connection.release();
  }
});

// Get user profiles for demographics
router.get('/profiles', authMiddleware, async (req, res) => {
  if (req.user.role !== 'superadmin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied: Super Admin Only'
    });
  }
  let connection;
  try {
    connection = await pool.getConnection();
    // First, let's check what tables exist
    const [tables] = await connection.query('SHOW TABLES LIKE "user_profiles"');
    
    if (tables.length === 0) {
      // Try alternative table names
      const [altTables] = await connection.query('SHOW TABLES LIKE "%profile%"');
      console.log('Alternative profile tables found:', altTables);
      
      if (altTables.length === 0) {
        return res.json({
          success: true,
          data: [],
          message: 'No user profile table found'
        });
      }
    }
    
    const [profiles] = await connection.query(
      `SELECT 
        up.id,
        up.user_id,
        up.blood_type,
        up.date_of_birth,
        up.gender,
        up.area,
        up.notification_preference,
        u.name,
        u.email,
        u.created_at
       FROM user_profiles up
       JOIN users u ON up.user_id = u.id
       WHERE up.date_of_birth IS NOT NULL 
         AND up.gender IS NOT NULL 
         AND up.gender != 'NULL'
       ORDER BY u.created_at DESC`
    );
    
    res.json({
      success: true,
      data: profiles
    });
  } catch (error) {
    console.error('Error fetching user profiles:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user profiles'
    });
  } finally {
    if (connection) connection.release();
  }
});

// Update user
router.put('/:id', authMiddleware, async (req, res) => {
  let connection;
  try {
    const { name, email, role, status } = req.body;
    const userId = req.params.id;

    connection = await pool.getConnection();
    await connection.query(
      `UPDATE users 
       SET name = ?, email = ?, role = ?, status = ? 
       WHERE id = ?`,
      [name, email, role, status, userId]
    );
    
    res.json({
      success: true,
      message: 'User updated successfully'
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user'
    });
  } finally {
    if (connection) connection.release();
  }
});

// Update user status
router.put('/:id/status', authMiddleware, async (req, res) => {
  let connection;
  try {
    const { status } = req.body;
    const userId = req.params.id;

    connection = await pool.getConnection();
    await connection.query(
      'UPDATE users SET status = ? WHERE id = ?',
      [status, userId]
    );
    
    res.json({
      success: true,
      message: 'User status updated successfully'
    });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user status'
    });
  } finally {
    if (connection) connection.release();
  }
});

// Create new user
router.post('/', authMiddleware, async (req, res) => {
  if (req.user.role !== 'superadmin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied: Super Admin Only'
    });
  }
  let connection;
  try {
    const { name, email, password, role, status } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required'
      });
    }

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: passwordValidation.message
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    connection = await pool.getConnection();

    // Check if email already exists
    const [existingUsers] = await connection.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }

    // Insert new user
    const [result] = await connection.query(
      `INSERT INTO users (name, email, password, role, status) 
        VALUES (?, ?, ?, ?, ?)`,
      [name, email, hashedPassword, role, status]
    );

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      userId: result.insertId
    });

  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create user'
    });
  } finally {
    if (connection) connection.release();
  }
});

router.get('/permissions', async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    
    // For superadmin, return all permissions as true
    if (req.user.role === 'superadmin') {
      return res.json({
        success: true,
        permissions: {
          can_manage_users: true,
          can_manage_inventory: true,
          can_manage_campaigns: true,
          can_manage_blood_banks: true,
          can_manage_donations: true,
          can_manage_appointments: true,
          can_manage_reports: true
        }
      });
    }

    // For regular admin, get permissions from database
    const [permissions] = await connection.query(
      'SELECT * FROM admin_permissions WHERE user_id = ?',
      [req.user.id]
    );

    res.json({
      success: true,
      permissions: permissions[0] || {}
    });

  } catch (error) {
    console.error('Error fetching permissions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch permissions'
    });
  } finally {
    if (connection) connection.release();
  }
});

module.exports = router;