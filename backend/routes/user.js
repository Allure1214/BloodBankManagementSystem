// backend/routes/user.js
const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const bcrypt = require('bcryptjs');
const authMiddleware = require('../middleware/auth');

// Apply auth middleware to protect all user routes
router.use(authMiddleware);

const validatePassword = (password) => {
  // Check length (8-20 characters)
  if (password.length < 8 || password.length > 20) {
      return {
          isValid: false,
          message: 'Password must be between 8 and 20 characters'
      };
  }

  // Check for lowercase letter
  if (!/[a-z]/.test(password)) {
      return {
          isValid: false,
          message: 'Password must include at least one lowercase letter'
      };
  }

  // Check for uppercase letter
  if (!/[A-Z]/.test(password)) {
      return {
          isValid: false,
          message: 'Password must include at least one uppercase letter'
      };
  }

  // Check for number
  if (!/\d/.test(password)) {
      return {
          isValid: false,
          message: 'Password must include at least one number'
      };
  }

  return { isValid: true };
};

router.put('/appointments/:id/cancel', async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    
    connection = await pool.getConnection();

    // Verify appointment belongs to user and is pending
    const [appointment] = await connection.query(
      `SELECT * FROM campaign_reservations 
       WHERE id = ? AND user_id = ? AND status = 'pending'`,
      [id, req.user.id]
    );

    if (appointment.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found or cannot be cancelled'
      });
    }

    // Update appointment status
    await connection.query(
      `UPDATE campaign_reservations 
       SET status = 'cancelled'
       WHERE id = ?`,
      [id]
    );

    // Create a notification for the user
    await connection.query(
      `INSERT INTO notifications (user_id, title, message, type)
       VALUES (?, 'Appointment Cancelled', 'Your blood donation appointment has been cancelled.', 'info')`,
      [req.user.id]
    );

    res.json({
      success: true,
      message: 'Appointment cancelled successfully'
    });

  } catch (error) {
    console.error('Error cancelling appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel appointment'
    });
  } finally {
    if (connection) connection.release();
  }
});

router.get('/reservation', async (req, res) => {
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
        cr.donation_completed,
        cr.donation_completed_date,
        cr.next_eligible_date,
        c.location as campaign_name,
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

// Get user profile
router.get('/profile', async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    
    const [results] = await connection.query(
      `SELECT 
        u.id,
        u.name,
        u.email,
        u.phone,
        u.status,
        up.blood_type,
        CONVERT_TZ(up.date_of_birth, '+00:00', '+08:00') as date_of_birth,
        up.gender,
        up.area
      FROM users u
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE u.id = ?`,
      [req.user.id]
    );

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found'
      });
    }

    res.json({
      success: true,
      data: results[0]
    });

  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user profile'
    });
  } finally {
    if (connection) connection.release();
  }
});

// Get user donations
router.get('/donations', async (req, res) => { 
  let connection;
  try {
    connection = await pool.getConnection();
    
    const [results] = await connection.query(
      `SELECT 
        d.id,
        d.donation_date,
        d.blood_type,
        d.quantity_ml,
        d.status,
        d.health_screening_notes,
        bb.name as blood_bank_name,
        bb.address as blood_bank_address
      FROM donations d
      JOIN blood_banks bb ON d.blood_bank_id = bb.id
      WHERE d.donor_id = ?
      ORDER BY d.donation_date DESC`,
      [req.user.id]
    );

    res.json({
      success: true,
      data: results
    });

  } catch (error) {
    console.error('Error fetching donations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch donations'
    });
  } finally {
    if (connection) connection.release();
  }
});

// Get donation statistics
router.get('/donation-stats', async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    
    const [results] = await connection.query(
      `SELECT 
        COUNT(*) as total_donations,
        SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completed_donations,
        SUM(CASE WHEN status = 'Completed' THEN quantity_ml ELSE 0 END) as total_volume_donated,
        MAX(donation_date) as last_donation_date
      FROM donations
      WHERE donor_id = ?`,
      [req.user.id]
    );

    res.json({
      success: true,
      data: results[0]
    });

  } catch (error) {
    console.error('Error fetching donation statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch donation statistics'
    });
  } finally {
    if (connection) connection.release();
  }
});

// Get upcoming donation appointments
router.get('/appointments', async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    
    const [results] = await connection.query(
      `SELECT 
        cr.id,
        cr.campaign_id,
        cr.session_date,
        cr.preferred_time,
        c.location as campaign_location,
        c.organizer,
        c.address
      FROM campaign_reservations cr
      JOIN campaigns c ON cr.campaign_id = c.id
      WHERE cr.email = ? 
      AND cr.session_date >= CURDATE()
      ORDER BY cr.session_date, cr.preferred_time`,
      [req.user.email]
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

router.put('/change-password', async (req, res) => {
  let connection;
  try {
      const { currentPassword, newPassword } = req.body;

      // Validate new password
      const validation = validatePassword(newPassword);
      if (!validation.isValid) {
          return res.status(400).json({
              success: false,
              message: validation.message
          });
      }

      connection = await pool.getConnection();

      // Get current user
      const [users] = await connection.query(
          'SELECT password FROM users WHERE id = ?',
          [req.user.id]
      );

      if (users.length === 0) {
          return res.status(404).json({
              success: false,
              message: 'User not found'
          });
      }

      // Verify current password
      const validPassword = await bcrypt.compare(currentPassword, users[0].password);
      if (!validPassword) {
          return res.status(400).json({
              success: false,
              message: 'Current password is incorrect'
          });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password
      await connection.query(
          'UPDATE users SET password = ? WHERE id = ?',
          [hashedPassword, req.user.id]
      );

      res.json({
          success: true,
          message: 'Password updated successfully'
      });

  } catch (error) {
      console.error('Error changing password:', error);
      res.status(500).json({
          success: false,
          message: 'Failed to change password'
      });
  } finally {
      if (connection) connection.release();
  }
});

router.put('/update-blood-type', async (req, res) => {
  let connection;
  try {
    const userId = req.user.id;
    const { bloodType } = req.body;

    const allowedBloodTypes = new Set(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']);
    if (!allowedBloodTypes.has(bloodType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid blood type'
      });
    }

    connection = await pool.getConnection();
    
    // Start transaction
    await connection.beginTransaction();

    // Update or insert into user_profiles table
    const [existingProfile] = await connection.query(
      'SELECT * FROM user_profiles WHERE user_id = ?',
      [userId]
    );

    if (existingProfile.length > 0) {
      // Update existing profile
      await connection.query(
        `UPDATE user_profiles 
         SET blood_type = ?
         WHERE user_id = ?`,
        [bloodType, userId]
      );
    } else {
      // Insert new profile
      await connection.query(
        `INSERT INTO user_profiles 
         (user_id, blood_type)
         VALUES (?, ?)`,
        [userId, bloodType]
      );
    }

    // Commit the transaction
    await connection.commit();

    res.json({
      success: true,
      message: 'Blood type updated successfully'
    });

  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error('Blood type update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update blood type',
      error: error.message
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

router.put('/profile', authMiddleware, async (req, res) => {
  let connection;
  try {
    const { name, phone, bloodType, dateOfBirth, gender, area } = req.body;
    const userId = req.user.id;

    connection = await pool.getConnection();
    
    // Start transaction
    await connection.beginTransaction();

    // Update user table
    await connection.query(
      'UPDATE users SET name = ?, phone = ? WHERE id = ?',
      [name, phone, userId]
    );

    // Update or insert into user_profiles table
    const [existingProfile] = await connection.query(
      'SELECT * FROM user_profiles WHERE user_id = ?',
      [userId]
    );

    if (existingProfile.length > 0) {
      // Update existing profile
      await connection.query(
        `UPDATE user_profiles 
         SET blood_type = ?, date_of_birth = ?, gender = ?, area = ?
         WHERE user_id = ?`,
        [bloodType, dateOfBirth, gender, area, userId]
      );
    } else {
      // Insert new profile
      await connection.query(
        `INSERT INTO user_profiles 
         (user_id, blood_type, date_of_birth, gender, area)
         VALUES (?, ?, ?, ?, ?)`,
        [userId, bloodType, dateOfBirth, gender, area]
      );
    }

    // Commit the transaction
    await connection.commit();

    // Fetch updated user data
    const [updatedUser] = await connection.query(
      `SELECT u.*, up.blood_type, up.date_of_birth, up.gender
       FROM users u
       LEFT JOIN user_profiles up ON u.id = up.user_id
       WHERE u.id = ?`,
      [userId]
    );

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: updatedUser[0].id,
        name: updatedUser[0].name,
        email: updatedUser[0].email,
        phone: updatedUser[0].phone,
        bloodType: updatedUser[0].blood_type,
        dateOfBirth: updatedUser[0].date_of_birth,
        gender: updatedUser[0].gender
      }
    });

  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

router.put('/notification-preferences', async (req, res) => {
  let connection;
  try {
    const { preference } = req.body;
    const userId = req.user.id;

    connection = await pool.getConnection();

    await connection.query(
      `UPDATE user_profiles 
       SET notification_preference = ?
       WHERE user_id = ?`,
      [preference, userId]
    );

    res.json({
      success: true,
      message: 'Notification preferences updated successfully'
    });

  } catch (error) {
    console.error('Error updating notification preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update notification preferences'
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

module.exports = router;
