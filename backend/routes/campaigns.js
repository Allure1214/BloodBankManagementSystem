// backend/routes/campaigns.js
const express = require('express');
const router = express.Router();
const pool = require('../config/database');

const formatDateForMySQL = (dateString) => {
  // Handle MM/DD/YYYY format
  const parts = dateString.split('/');
  if (parts.length === 3) {
    const [month, day, year] = parts;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  // If already in YYYY-MM-DD format, return as is
  return dateString;
};

router.post('/reserve', async (req, res) => {
  let connection;
  try {
    const { 
      campaign_id, 
      user_id, 
      name, 
      email, 
      phone, 
      blood_type, 
      preferred_time, 
      session_date 
    } = req.body;

    // Format the date properly for MySQL
    const formattedDate = formatDateForMySQL(session_date);

    connection = await pool.getConnection();

    // Check if user has any active reservations
    const [activeReservations] = await connection.query(
      `SELECT * FROM campaign_reservations 
       WHERE user_id = ? 
       AND status IN ('pending', 'confirmed')
       AND donation_completed = FALSE`,
      [user_id]
    );

    if (activeReservations.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'You have an active appointment. Please cancel it before making a new reservation.'
      });
    }

    // If donation is completed, check eligibility based on completion date
    const [lastDonation] = await connection.query(
      `SELECT donation_completed_date, next_eligible_date 
       FROM campaign_reservations 
       WHERE user_id = ? 
       AND donation_completed = TRUE 
       ORDER BY donation_completed_date DESC 
       LIMIT 1`,
      [user_id]
    );

    if (lastDonation.length > 0 && lastDonation[0].next_eligible_date) {
      const nextEligibleDate = new Date(lastDonation[0].next_eligible_date);
      const reservationDate = new Date(formattedDate);
      
      if (reservationDate < nextEligibleDate) {
        return res.status(400).json({
          success: false,
          message: `You are not eligible to donate until ${nextEligibleDate.toLocaleDateString()}`,
          nextEligibleDate
        });
      }
    }

    // If all checks pass, create the reservation
    const [result] = await connection.query(
      `INSERT INTO campaign_reservations 
       (campaign_id, user_id, name, email, phone, blood_type, preferred_time, session_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [campaign_id, user_id, name, email, phone, blood_type, preferred_time, formattedDate]
    );

    res.json({
      success: true,
      message: 'Reservation created successfully',
      reservationId: result.insertId
    });

  } catch (error) {
    console.error('Error creating reservation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create reservation',
      error: error.message
    });
  } finally {
    if (connection) connection.release();
  }
});

router.get('/check-reservation/:userId', async (req, res) => {
  let connection;
  try {
    const { userId } = req.params;
    
    connection = await pool.getConnection();
    
    // Get the active reservation with campaign info and completed donation details
    const [reservations] = await connection.query(
      `SELECT 
        cr.*,
        c.location as campaign_name,
        c.address as campaign_address,
        (
          SELECT donation_completed_date 
          FROM campaign_reservations 
          WHERE user_id = ? 
          AND donation_completed = TRUE 
          ORDER BY donation_completed_date DESC 
          LIMIT 1
        ) as last_donation_date,
        (
          SELECT next_eligible_date 
          FROM campaign_reservations 
          WHERE user_id = ? 
          AND donation_completed = TRUE 
          ORDER BY donation_completed_date DESC 
          LIMIT 1
        ) as next_eligible_date
      FROM campaign_reservations cr
      JOIN campaigns c ON cr.campaign_id = c.id
      WHERE cr.user_id = ? 
      AND cr.status IN ('pending', 'confirmed')
      AND (cr.donation_completed = FALSE OR cr.donation_completed IS NULL)
      ORDER BY cr.session_date ASC
      LIMIT 1`,
      [userId, userId, userId]
    );

    const hasReservation = reservations.length > 0;
    const activeReservation = hasReservation ? {
      ...reservations[0],
      campaign_name: reservations[0].campaign_name,
      campaign_address: reservations[0].campaign_address,
      last_donation_date: reservations[0].last_donation_date,
      next_eligible_date: reservations[0].next_eligible_date
    } : null;

    res.json({
      success: true,
      hasReservation,
      reservation: activeReservation,
      message: hasReservation ? 'Active reservation found' : 'No active reservations'
    });

  } catch (error) {
    console.error('Error checking reservation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check reservation status'
    });
  } finally {
    if (connection) connection.release();
  }
});

router.put('/complete-donation/:reservationId', async (req, res) => {
  let connection;
  try {
    const { reservationId } = req.params;
    
    connection = await pool.getConnection();
    
    const completionDate = new Date();
    const nextEligibleDate = new Date();
    nextEligibleDate.setMonth(nextEligibleDate.getMonth() + 3);

    await connection.query(
      `UPDATE campaign_reservations 
       SET donation_completed = TRUE,
           donation_completed_date = ?,
           next_eligible_date = ?,
           status = 'completed'
       WHERE id = ?`,
      [completionDate, nextEligibleDate, reservationId]
    );

    res.json({
      success: true,
      message: 'Donation marked as completed',
      nextEligibleDate
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

// Update check-eligibility endpoint
router.get('/check-eligibility/:userId', async (req, res) => {
  let connection;
  try {
    const { userId } = req.params;
    
    connection = await pool.getConnection();
    
    // Check for active reservations first
    const [activeReservations] = await connection.query(
      `SELECT * FROM campaign_reservations 
       WHERE user_id = ? 
       AND status IN ('pending', 'confirmed')
       AND donation_completed = FALSE`,
      [userId]
    );

    if (activeReservations.length > 0) {
      return res.json({
        success: true,
        eligible: false,
        message: 'You have an active appointment',
        activeReservation: activeReservations[0]
      });
    }

    // Check last completed donation
    const [lastDonation] = await connection.query(
      `SELECT donation_completed_date, next_eligible_date 
       FROM campaign_reservations 
       WHERE user_id = ? 
       AND donation_completed = TRUE 
       ORDER BY donation_completed_date DESC 
       LIMIT 1`,
      [userId]
    );

    if (lastDonation.length > 0) {
      const nextEligibleDate = new Date(lastDonation[0].next_eligible_date);
      const today = new Date();
      
      return res.json({
        success: true,
        eligible: today >= nextEligibleDate,
        lastDonationDate: lastDonation[0].donation_completed_date,
        nextEligibleDate
      });
    }

    // If no completed donations found, user is eligible
    res.json({
      success: true,
      eligible: true
    });

  } catch (error) {
    console.error('Error checking eligibility:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check eligibility'
    });
  } finally {
    if (connection) connection.release();
  }
});

router.get('/:campaignId/check-reservation/:userId', async (req, res) => {
  let connection;
  try {
    const { campaignId, userId } = req.params;
    
    connection = await pool.getConnection();
    
    const [reservations] = await connection.query(
      `SELECT id, session_date, preferred_time, status 
       FROM campaign_reservations 
       WHERE campaign_id = ? AND user_id = ? AND status != 'cancelled'`,
      [campaignId, userId]
    );

    res.json({
      success: true,
      hasReservation: reservations.length > 0,
      reservation: reservations[0] || null
    });

  } catch (error) {
    console.error('Error checking reservation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check reservation status'
    });
  } finally {
    if (connection) connection.release();
  }
});

router.get('/upcoming', async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    
    // Modify query to exclude current date
    const [results] = await connection.query(`
      SELECT 
        c.id,
        c.location,
        c.organizer,
        c.address,
        c.latitude,
        c.longitude,
        DATE_FORMAT(cs.date, '%Y-%m-%d') as date,
        TIME_FORMAT(cs.start_time, '%H:%i') as start_time,
        TIME_FORMAT(cs.end_time, '%H:%i') as end_time
      FROM campaigns c
      JOIN campaign_sessions cs ON c.id = cs.campaign_id
      WHERE cs.date > CURDATE()
      ORDER BY cs.date, cs.start_time
    `);

    // Transform the data
    const campaigns = results.reduce((acc, curr) => {
      if (!acc[curr.id]) {
        acc[curr.id] = {
          id: curr.id,
          location: curr.location,
          organizer: curr.organizer,
          address: curr.address,
          latitude: parseFloat(curr.latitude),
          longitude: parseFloat(curr.longitude),
          sessions: []
        };
      }
      
      // Format the date consistently
      const formattedDate = new Date(curr.date).toLocaleDateString();
      acc[curr.id].sessions.push({
        date: formattedDate,
        time: `${curr.start_time} - ${curr.end_time}`
      });
      
      return acc;
    }, {});

    res.json({
      success: true,
      data: Object.values(campaigns)
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching upcoming campaigns'
    });
  } finally {
    if (connection) connection.release();
  }
});

module.exports = router;
