const express = require('express');
const router = express.Router();
const pool = require('../../config/database');
const authMiddleware = require('../../middleware/auth');
const checkPermission = require('../../middleware/checkPermission');
const { auditLogger } = require('../../middleware/auditLogger');

router.post('/send', authMiddleware, checkPermission('can_manage_notifications'), auditLogger('SEND_NOTIFICATION', 'notification', {
  getEntityId: (req, responseData) => `bulk_${Date.now()}`,
  getEntityName: (req, responseData) => {
    const recipientCount = responseData?.recipientCount || 0;
    return `Notification: "${req.body.title}" (sent to ${recipientCount} users)`;
  },
  getOldValues: () => null,
  getNewValues: (req, responseData) => ({
    title: req.body.title,
    message: req.body.message,
    filters: req.body.filters,
    recipient_count: responseData?.recipientCount || 0
  })
}), async (req, res) => {
  let connection;
  try {
    const { title, message, filters } = req.body;
    const { bloodType, area } = filters;

    connection = await pool.getConnection();

    // Build query based on filters and notification preferences
    let query = `
      SELECT DISTINCT u.id
      FROM users u
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE u.role = 'user'
    `;
    const queryParams = [];

    // Add notification preference conditions
    if (area && area.length > 0) {
      const areaPlaceholders = area.map(() => '?').join(',');
      query += ` AND (
        up.notification_preference = 'receiveAll'
        OR (up.notification_preference = 'receiveImportant' AND up.area IN (${areaPlaceholders}))
        OR up.notification_preference IS NULL
      )`;
      queryParams.push(...area);
    } else {
      query += ` AND (up.notification_preference = 'receiveAll' OR up.notification_preference IS NULL)`;
    }

    if (bloodType && bloodType.length > 0) {
      const bloodTypePlaceholders = bloodType.map(() => '?').join(',');
      query += ` AND (up.blood_type IN (${bloodTypePlaceholders}) OR up.blood_type IS NULL)`;
      queryParams.push(...bloodType);
    }

    if (area && area.length > 0) {
      const areaPlaceholders = area.map(() => '?').join(',');
      query += ` AND up.area IN (${areaPlaceholders})`;
      queryParams.push(...area);
    }

    // Exclude users who have opted out
    query += ` AND (up.notification_preference != 'receiveNone' OR up.notification_preference IS NULL)`;

    // Get users matching filters
    const [users] = await connection.query(query, queryParams);

    // Create notifications for matched users
    if (users.length > 0) {
      const notifications = users.map(user => [
        user.id,
        title,
        message,
        'info',
        0, // is_read set to false
        new Date()
      ]);

      await connection.query(
        `INSERT INTO notifications 
         (user_id, title, message, type, is_read, created_at)
         VALUES ?`,
        [notifications]
      );
    }

    res.json({
      success: true,
      message: `Notification sent to ${users.length} users`,
      recipientCount: users.length
    });

  } catch (error) {
    console.error('Error sending notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send notifications'
    });
  } finally {
    if (connection) connection.release();
  }
});

router.get('/all', authMiddleware, async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();

    const [notifications] = await connection.query(`
      SELECT n.*, u.name as user_name, up.blood_type, up.area
      FROM notifications n
      JOIN users u ON n.user_id = u.id
      JOIN user_profiles up ON u.id = up.user_id
      ORDER BY n.created_at DESC
    `);

    res.json({
      success: true,
      data: notifications
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications'
    });
  } finally {
    if (connection) connection.release();
  }
});

router.post('/check-recipients', authMiddleware, async (req, res) => {
    let connection;
    try {
      const { filters } = req.body;
      const { bloodType, area } = filters;
  
      connection = await pool.getConnection();
  
            let query = `
        SELECT COUNT(DISTINCT u.id) as count
        FROM users u
        LEFT JOIN user_profiles up ON u.id = up.user_id
        WHERE u.role = 'user'
      `;
      const queryParams = [];

      // Add notification preference conditions
      if (area && area.length > 0) {
        const areaPlaceholders = area.map(() => '?').join(',');
        query += ` AND (
          up.notification_preference = 'receiveAll'
          OR (up.notification_preference = 'receiveImportant' AND up.area IN (${areaPlaceholders}))
          OR up.notification_preference IS NULL
        )`;
        queryParams.push(...area);
      } else {
        query += ` AND (up.notification_preference = 'receiveAll' OR up.notification_preference IS NULL)`;
      }

      // Add blood type filter
      if (bloodType && bloodType.length > 0) {
        const bloodTypePlaceholders = bloodType.map(() => '?').join(',');
        query += ` AND (up.blood_type IN (${bloodTypePlaceholders}) OR up.blood_type IS NULL)`;
        queryParams.push(...bloodType);
      }

      // Add area filter
      if (area && area.length > 0) {
        const areaPlaceholders = area.map(() => '?').join(',');
        query += ` AND up.area IN (${areaPlaceholders})`;
        queryParams.push(...area);
      }

      // Exclude users who opted out
      query += ` AND (up.notification_preference != 'receiveNone' OR up.notification_preference IS NULL)`;
  
      const [result] = await connection.query(query, queryParams);
  
      res.json({
        success: true,
        recipientCount: result[0].count
      });
  
    } catch (error) {
      console.error('Error checking recipients:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to check recipients'
      });
    } finally {
      if (connection) connection.release();
    }
  });

router.post('/recipient-details', authMiddleware, async (req, res) => {
  let connection;
  try {
    const { filters } = req.body;
    const { bloodType, area } = filters;

    connection = await pool.getConnection();

    let query = `
      SELECT DISTINCT 
        u.id,
        u.name,
        u.email,
        u.phone,
        up.blood_type,
        up.area
      FROM users u
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE u.role = 'user'
    `;
    const queryParams = [];

    // Add notification preference conditions
    if (area && area.length > 0) {
      const areaPlaceholders = area.map(() => '?').join(',');
      query += ` AND (
        up.notification_preference = 'receiveAll'
        OR (up.notification_preference = 'receiveImportant' AND up.area IN (${areaPlaceholders}))
        OR up.notification_preference IS NULL
      )`;
      queryParams.push(...area);
    } else {
      query += ` AND (up.notification_preference = 'receiveAll' OR up.notification_preference IS NULL)`;
    }

    // Add blood type filter
    if (bloodType && bloodType.length > 0) {
      const bloodTypePlaceholders = bloodType.map(() => '?').join(',');
      query += ` AND (up.blood_type IN (${bloodTypePlaceholders}) OR up.blood_type IS NULL)`;
      queryParams.push(...bloodType);
    }

    // Add area filter
    if (area && area.length > 0) {
      const areaPlaceholders = area.map(() => '?').join(',');
      query += ` AND up.area IN (${areaPlaceholders})`;
      queryParams.push(...area);
    }

    // Exclude users who opted out
    query += ` AND (up.notification_preference != 'receiveNone' OR up.notification_preference IS NULL)`;
    
    // Order by name for consistent results
    query += ` ORDER BY u.name ASC`;

    const [recipients] = await connection.query(query, queryParams);

    res.json({
      success: true,
      recipients: recipients
    });

  } catch (error) {
    console.error('Error fetching recipient details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recipient details'
    });
  } finally {
    if (connection) connection.release();
  }
});

module.exports = router;