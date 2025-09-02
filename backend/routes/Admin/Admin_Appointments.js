// backend/routes/admin/appointments.js
const express = require('express');
const router = express.Router();
const pool = require('../../config/database');
const authMiddleware = require('../../middleware/auth');
const checkPermission = require('../../middleware/checkPermission');
const { auditLogger } = require('../../middleware/auditLogger');

// Get all appointments
router.get('/', authMiddleware, checkPermission('can_manage_appointments'), async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    
    const [appointments] = await connection.query(`
      SELECT 
        cr.id,
        cr.user_id,
        cr.name,
        cr.email,
        cr.phone,
        cr.blood_type,
        cr.preferred_time,
        cr.session_date,
        cr.status,
        cr.created_at,
        c.location as campaign_location,
        c.organizer,
        c.address as campaign_address
      FROM campaign_reservations cr
      JOIN campaigns c ON cr.campaign_id = c.id
      ORDER BY cr.session_date DESC, cr.preferred_time ASC
    `);

    res.json({
      success: true,
      data: appointments
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

router.put('/:id/complete-donation', authMiddleware, checkPermission('can_manage_appointments'), auditLogger('COMPLETE_APPOINTMENT', 'appointment', {
  getEntityId: (req) => req.params.id,
  getEntityName: (req, responseData) => {
    // Use response data if available, otherwise return a placeholder
    const userName = responseData?.appointment?.name || `User #${req.params.id}`;
    return `Appointment for ${userName}`;
  },
  getOldValues: async (req) => {
    const connection = await pool.getConnection();
    try {
      const [appointments] = await connection.query('SELECT donation_completed, donation_completed_date, next_eligible_date FROM campaign_reservations WHERE id = ?', [req.params.id]);
      return appointments.length > 0 ? appointments[0] : null;
    } finally {
      connection.release();
    }
  },
  getNewValues: (req) => ({
    donation_completed: req.body.donation_completed,
    donation_completed_date: req.body.donation_completed_date,
    next_eligible_date: req.body.next_eligible_date
  })
}), async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    const { donation_completed, donation_completed_date, next_eligible_date } = req.body;

    connection = await pool.getConnection();

    // Update appointment with donation completion details
    await connection.query(
      `UPDATE campaign_reservations 
       SET donation_completed = ?,
           donation_completed_date = ?,
           next_eligible_date = ?
       WHERE id = ?`,
      [donation_completed, donation_completed_date, next_eligible_date, id]
    );

    // Get user details for notification
    const [appointment] = await connection.query(
      `SELECT cr.user_id, c.location as campaign_location
       FROM campaign_reservations cr
       JOIN campaigns c ON cr.campaign_id = c.id
       WHERE cr.id = ?`,
      [id]
    );

    if (appointment.length > 0) {
      // Create notification for user
      await connection.query(
        `INSERT INTO notifications (user_id, title, message, type)
         VALUES (?, ?, ?, ?)`,
        [
          appointment[0].user_id,
          'Donation Completed',
          `Your blood donation at ${appointment[0].campaign_location} has been completed. Your next eligible donation date is ${next_eligible_date}.`,
          'success'
        ]
      );
    }

    res.json({
      success: true,
      message: 'Donation marked as completed successfully'
    });

  } catch (error) {
    console.error('Error completing donation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete donation'
    });
  } finally {
    if (connection) connection.release();
  }
});

// Get single appointment details
router.get('/:id', authMiddleware, async (req, res) => {
  let connection;
  try {
    const { id } = req.params;

    connection = await pool.getConnection();
    
    const [appointments] = await connection.query(`
      SELECT 
        cr.*,
        c.location as campaign_location,
        c.organizer,
        c.address as campaign_address
      FROM campaign_reservations cr
      JOIN campaigns c ON cr.campaign_id = c.id
      WHERE cr.id = ?
    `, [id]);

    if (appointments.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    res.json({
      success: true,
      data: appointments[0]
    });

  } catch (error) {
    console.error('Error fetching appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch appointment details'
    });
  } finally {
    if (connection) connection.release();
  }
});

// Update appointment status
router.put('/:id/status', authMiddleware, checkPermission('can_manage_appointments'), auditLogger('CHANGE_APPOINTMENT_STATUS', 'appointment', {
  getEntityId: (req) => req.params.id,
  getEntityName: (req, responseData) => {
    // Use response data if available, otherwise return a placeholder
    const userName = responseData?.appointment?.name || `User #${req.params.id}`;
    return `Appointment for ${userName}`;
  },
  getOldValues: async (req) => {
    const connection = await pool.getConnection();
    try {
      const [appointments] = await connection.query('SELECT status FROM campaign_reservations WHERE id = ?', [req.params.id]);
      return appointments.length > 0 ? { status: appointments[0].status } : null;
    } finally {
      connection.release();
    }
  },
  getNewValues: (req) => ({ status: req.body.status })
}), async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Match exact enum values
    if (!['pending', 'confirmed', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be: pending, confirmed, or cancelled'
      });
    }

    connection = await pool.getConnection();

    // Get appointment details with campaign info
    const [existing] = await connection.query(`
      SELECT 
        cr.*,
        c.location as campaign_location,
        c.organizer
      FROM campaign_reservations cr
      JOIN campaigns c ON cr.campaign_id = c.id
      WHERE cr.id = ?
    `, [id]);

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Update appointment status
    await connection.query(
      'UPDATE campaign_reservations SET status = ? WHERE id = ?',
      [status, id]
    );

    // Create notification based on status
    if (existing[0].user_id) {
      let notificationTitle, notificationMessage;

      if (status === 'confirmed') {
        notificationTitle = 'Appointment Confirmed';
        notificationMessage = `Your blood donation appointment at ${existing[0].campaign_location} on ${
          new Date(existing[0].session_date).toLocaleDateString()
        } at ${existing[0].preferred_time} has been confirmed.`;
      } else if (status === 'cancelled') {
        notificationTitle = 'Appointment Cancelled';
        notificationMessage = `Your blood donation appointment at ${existing[0].campaign_location} on ${
          new Date(existing[0].session_date).toLocaleDateString()
        } at ${existing[0].preferred_time} has been cancelled.`;
      }

      if (notificationTitle && notificationMessage) {
        await connection.query(
          `INSERT INTO notifications (user_id, title, message, type)
           VALUES (?, ?, ?, ?)`,
          [existing[0].user_id, notificationTitle, notificationMessage, status === 'confirmed' ? 'success' : 'info']
        );
      }
    }

    res.json({
      success: true,
      message: 'Appointment status updated successfully'
    });

  } catch (error) {
    console.error('Error updating appointment status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update appointment status'
    });
  } finally {
    if (connection) connection.release();
  }
});

router.get('/time-slots/:campaignId/:date', async (req, res) => {
  let connection;
  try {
    const { campaignId, date } = req.params;
    
    // Convert the date string to MySQL format (YYYY-MM-DD)
    const formattedDate = new Date(date).toISOString().split('T')[0];
    
    connection = await pool.getConnection();

    // First get the session details for this campaign and date
    const [sessions] = await connection.query(
      `SELECT 
        DATE_FORMAT(start_time, '%H:%i') as start_time, 
        DATE_FORMAT(end_time, '%H:%i') as end_time 
       FROM campaign_sessions 
       WHERE campaign_id = ? AND date = ?`,
      [campaignId, formattedDate]
    );

    if (sessions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No session found for this date'
      });
    }

    // Get all existing reservations for this slot to check availability
    const [reservations] = await connection.query(
      `SELECT preferred_time, COUNT(*) as count
       FROM campaign_reservations
       WHERE campaign_id = ? AND session_date = ?
       GROUP BY preferred_time`,
      [campaignId, formattedDate]
    );

    // Generate time slots in 1-hour intervals
    const startTime = new Date(`2000-01-01 ${sessions[0].start_time}`);
    const endTime = new Date(`2000-01-01 ${sessions[0].end_time}`);
    
    const timeSlots = [];
    const maxReservationsPerSlot = 3; // You can adjust this number

    while (startTime < endTime) {
      const timeString = startTime.toTimeString().slice(0, 5);
      
      // Find existing reservations for this time slot
      const existingReservations = reservations.find(
        r => r.preferred_time === timeString
      );

      timeSlots.push({
        time: timeString,
        available: !existingReservations || 
                  existingReservations.count < maxReservationsPerSlot
      });

      startTime.setHours(startTime.getHours() + 1);
    }

    res.json({
      success: true,
      data: timeSlots
    });

  } catch (error) {
    console.error('Error fetching time slots:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available time slots'
    });
  } finally {
    if (connection) connection.release();
  }
});

router.put('/:id/update-time', authMiddleware, async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    const { preferred_time } = req.body;

    connection = await pool.getConnection();
    
    // Get appointment to check status and get campaign info
    const [appointment] = await connection.query(
      `SELECT cr.*, c.location 
       FROM campaign_reservations cr
       JOIN campaigns c ON cr.campaign_id = c.id
       WHERE cr.id = ? AND cr.user_id = ?`,
      [id, req.user.id]
    );

    if (appointment.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    if (appointment[0].status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending appointments can be modified'
      });
    }

    // Check if the new time slot is available
    const [existingBookings] = await connection.query(
      `SELECT COUNT(*) as count
       FROM campaign_reservations cr
       JOIN campaigns c ON cr.campaign_id = c.id
       WHERE c.location = ? 
       AND cr.session_date = ?
       AND cr.preferred_time = ?`,
      [appointment[0].location, appointment[0].session_date, preferred_time]
    );

    if (existingBookings[0].count >= 3) {
      return res.status(400).json({
        success: false,
        message: 'Selected time slot is no longer available'
      });
    }

    // Update appointment
    await connection.query(
      'UPDATE campaign_reservations SET preferred_time = ? WHERE id = ?',
      [preferred_time, id]
    );

    res.json({
      success: true,
      message: 'Appointment time updated successfully'
    });

  } catch (error) {
    console.error('Error updating appointment time:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update appointment time'
    });
  } finally {
    if (connection) connection.release();
  }
});

module.exports = router;