// backend/routes/admin/campaigns.js
const express = require('express');
const router = express.Router();
const pool = require('../../config/database');
const authMiddleware = require('../../middleware/auth');
const checkPermission = require('../../middleware/checkPermission');

// Get all campaigns
router.get('/', authMiddleware, checkPermission('can_manage_campaigns'), async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    
    // First get all campaigns
    const [campaigns] = await connection.query(
      'SELECT * FROM campaigns ORDER BY created_at DESC'
    );

    // Then get sessions for each campaign
    const campaignsWithSessions = await Promise.all(campaigns.map(async (campaign) => {
      const [sessions] = await connection.query(
        `SELECT 
        id,
        CONVERT_TZ(date, '+00:00', '+08:00') as date, 
        start_time, 
        end_time, 
        status 
        FROM campaign_sessions 
        WHERE campaign_id = ?
        ORDER BY date, start_time`,
        [campaign.id]
      );

      return {
        ...campaign,
        sessions: sessions || []
      };
    }));

    res.json({
      success: true,
      data: campaignsWithSessions
    });

  } catch (error) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch campaigns'
    });
  } finally {
    if (connection) connection.release();
  }
});

// Add new campaign
router.post('/', authMiddleware, checkPermission('can_manage_campaigns'), async (req, res) => {
  let connection;
  try {
    const { location, organizer, address, latitude, longitude, sessions } = req.body;
    
    // Validate required fields
    if (!location || !organizer || !address || !sessions || !sessions.length) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // Validate coordinates
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({
        success: false,
        message: 'Invalid coordinates'
      });
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Insert campaign with coordinates
    const [campaignResult] = await connection.query(
      `INSERT INTO campaigns (location, organizer, address, latitude, longitude)
       VALUES (?, ?, ?, ?, ?)`,
      [location, organizer, address, lat, lng]
    );

    // Insert sessions
    await Promise.all(sessions.map(session => 
      connection.query(
        `INSERT INTO campaign_sessions (campaign_id, date, start_time, end_time, status)
         VALUES (?, ?, ?, ?, 'scheduled')`,
        [campaignResult.insertId, session.date, session.start_time, session.end_time]
      )
    ));

    await connection.commit();

    res.status(201).json({
      success: true,
      message: 'Campaign created successfully'
    });

  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error('Error creating campaign:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create campaign'
    });
  } finally {
    if (connection) connection.release();
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    const { location, organizer, address, latitude, longitude, sessions } = req.body;

    // Initial validations...

    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Get all affected reservations with both pending and confirmed status
    const [reservations] = await connection.query(
      `SELECT cr.id, cr.user_id, cr.session_date, cr.preferred_time, cr.status,
              u.email, u.name
       FROM campaign_reservations cr
       JOIN users u ON cr.user_id = u.id
       WHERE cr.campaign_id = ? AND cr.status IN ('pending', 'confirmed')`,
      [id]
    );

    // Update campaign details
    await connection.query(
      `UPDATE campaigns 
       SET location = ?, organizer = ?, address = ?, latitude = ?, longitude = ?
       WHERE id = ?`,
      [location, organizer, address, latitude, longitude, id]
    );

    // Delete existing sessions
    await connection.query(
      'DELETE FROM campaign_sessions WHERE campaign_id = ?',
      [id]
    );

    // Insert new sessions
    await Promise.all(sessions.map(session => 
      connection.query(
        `INSERT INTO campaign_sessions (campaign_id, date, start_time, end_time, status)
         VALUES (?, ?, ?, ?, 'scheduled')`,
        [id, session.date, session.start_time, session.end_time]
      )
    ));

    // Process affected reservations
    for (const reservation of reservations) {
      const [resHours, resMinutes] = reservation.preferred_time.split(':').map(Number);
      const reservationTimeInMinutes = resHours * 60 + resMinutes;
    
      // Convert reservation date to local timezone (UTC+8)
      const reservationDate = new Date(reservation.session_date);
      reservationDate.setHours(reservationDate.getHours() + 8); // Convert to UTC+8
      const reservationDateStr = reservationDate.toISOString().split('T')[0];
    
      let foundValidSession = false;
      
      for (const session of sessions) {
        // Parse session times
        const [startHours, startMinutes] = session.start_time.split(':').map(Number);
        const [endHours, endMinutes] = session.end_time.split(':').map(Number);
        
        const sessionStartInMinutes = startHours * 60 + startMinutes;
        const sessionEndInMinutes = endHours * 60 + endMinutes;
    
        // Use the session date directly since it's already in the correct format
        const sessionDateStr = session.date;
    
    
        if (reservationDateStr === sessionDateStr) {
          
          if (reservationTimeInMinutes >= sessionStartInMinutes && 
              reservationTimeInMinutes <= sessionEndInMinutes) {
            foundValidSession = true;
            break;
          }
        }
      }
    
      if (!foundValidSession) {
        await connection.query(
          `UPDATE campaign_reservations 
           SET status = 'cancelled'
           WHERE id = ?`,
          [reservation.id]
        );
    
        const notificationMessage = `Your ${reservation.status} blood donation appointment at ${location} on ${new Date(reservation.session_date).toLocaleDateString()} at ${reservation.preferred_time} has been cancelled due to schedule changes. Please make a new reservation.`;
    
        await connection.query(
          `INSERT INTO notifications (user_id, title, message, type)
           VALUES (?, ?, ?, 'info')`,
          [
            reservation.user_id,
            'Appointment Cancelled',
            notificationMessage,
            'info'
          ]
        );
      } 
    }

    await connection.commit();

    // Include summary in response
    const cancelledCount = reservations.filter(r => !sessions.some(s => 
      s.date === r.session_date &&
      s.start_time <= r.preferred_time &&
      s.end_time > r.preferred_time
    )).length;

    res.json({
      success: true,
      message: `Campaign updated successfully. ${cancelledCount} reservations were affected and users have been notified.`
    });

  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error('Error updating campaign:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update campaign'
    });
  } finally {
    if (connection) connection.release();
  }
});

// Delete campaign
router.delete('/:id', authMiddleware, async (req, res) => {
  let connection;
  try {
    const { id } = req.params;

    connection = await pool.getConnection();
    await connection.beginTransaction();

    // First get campaign details and affected reservations
    const [campaign] = await connection.query(
      'SELECT location FROM campaigns WHERE id = ?',
      [id]
    );

    // Get all active reservations (pending or confirmed)
    const [reservations] = await connection.query(
      `SELECT cr.id, cr.user_id, cr.session_date, cr.preferred_time, cr.status,
              u.email, u.name
       FROM campaign_reservations cr
       JOIN users u ON cr.user_id = u.id
       WHERE cr.campaign_id = ? AND cr.status IN ('pending', 'confirmed')`,
      [id]
    );

    // Create notifications for affected users
    if (reservations.length > 0) {
      await Promise.all(reservations.map(reservation => 
        connection.query(
          `INSERT INTO notifications (user_id, title, message, type)
           VALUES (?, ?, ?, 'info')`,
          [
            reservation.user_id,
            'Campaign Cancelled',
            `The blood donation campaign at ${campaign[0].location} has been cancelled. Your appointment on ${new Date(reservation.session_date).toLocaleDateString()} at ${reservation.preferred_time} has been cancelled.`,
            'info'
          ]
        )
      ));
    }

    // Delete sessions first (due to foreign key constraint)
    await connection.query(
      'DELETE FROM campaign_sessions WHERE campaign_id = ?',
      [id]
    );

    // Delete campaign reservations
    await connection.query(
      'DELETE FROM campaign_reservations WHERE campaign_id = ?',
      [id]
    );

    // Delete campaign
    await connection.query(
      'DELETE FROM campaigns WHERE id = ?',
      [id]
    );

    await connection.commit();

    res.json({
      success: true,
      message: `Campaign deleted successfully. ${reservations.length} users have been notified.`
    });

  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error('Error deleting campaign:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete campaign'
    });
  } finally {
    if (connection) connection.release();
  }
});

// Get all campaign reservations for analytics
router.get('/reservations', authMiddleware, checkPermission('can_manage_campaigns'), async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    
    const [reservations] = await connection.query(
      `SELECT 
        cr.id,
        cr.campaign_id,
        cr.user_id,
        cr.name,
        cr.email,
        cr.phone,
        cr.blood_type,
        cr.preferred_time,
        cr.session_date,
        cr.status,
        cr.created_at,
        cr.updated_at,
        cr.donation_completed,
        cr.donation_completed_date,
        cr.next_eligible_date,
        c.location as campaign_location,
        c.organizer as campaign_organizer
      FROM campaign_reservations cr
      JOIN campaigns c ON cr.campaign_id = c.id
      ORDER BY cr.created_at DESC`
    );

    res.json({
      success: true,
      data: reservations
    });

  } catch (error) {
    console.error('Error fetching campaign reservations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch campaign reservations'
    });
  } finally {
    if (connection) connection.release();
  }
});

// Get campaign details
router.get('/:id', authMiddleware, async (req, res) => {
  let connection;
  try {
    const { id } = req.params;

    connection = await pool.getConnection();
    
    const [campaigns] = await connection.query(
      `SELECT 
        c.*,
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'id', cs.id,
            'date', cs.date,
            'start_time', cs.start_time,
            'end_time', cs.end_time,
            'status', cs.status
          )
        ) as sessions
      FROM campaigns c
      LEFT JOIN campaign_sessions cs ON c.id = cs.campaign_id
      WHERE c.id = ?
      GROUP BY c.id`,
      [id]
    );

    if (campaigns.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    const campaign = {
      ...campaigns[0],
      sessions: JSON.parse(campaigns[0].sessions)
    };

    res.json({
      success: true,
      data: campaign
    });

  } catch (error) {
    console.error('Error fetching campaign:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch campaign details'
    });
  } finally {
    if (connection) connection.release();
  }
});

module.exports = router;