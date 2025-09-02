// backend/routes/admin/donations.js
const express = require('express');
const router = express.Router();
const pool = require('../../config/database');
const authMiddleware = require('../../middleware/auth');
const checkPermission = require('../../middleware/checkPermission');
const { auditLogger } = require('../../middleware/auditLogger');

// Get all donations with donor and blood bank details
router.get('/', authMiddleware, checkPermission('can_manage_donations'), async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    
    const [donations] = await connection.query(`
      SELECT 
        d.id,
        d.donation_date,
        d.blood_type,
        d.quantity_ml,
        d.status,
        d.health_screening_notes,
        d.created_at,
        u.name as donor_name,
        u.email as donor_email,
        u.phone as donor_phone,
        bb.name as blood_bank_name,
        bb.address as blood_bank_address
      FROM donations d
      JOIN users u ON d.donor_id = u.id
      JOIN blood_banks bb ON d.blood_bank_id = bb.id
      ORDER BY d.donation_date DESC
    `);

    res.json({
      success: true,
      data: donations
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

// Get single donation details
router.get('/:id', authMiddleware, async (req, res) => {
  let connection;
  try {
    const { id } = req.params;

    connection = await pool.getConnection();
    
    const [donations] = await connection.query(`
      SELECT 
        d.id,
        d.donation_date,
        d.blood_type,
        d.quantity_ml,
        d.status,
        d.health_screening_notes,
        d.created_at,
        u.name as donor_name,
        u.email as donor_email,
        u.phone as donor_phone,
        bb.name as blood_bank_name,
        bb.address as blood_bank_address
      FROM donations d
      JOIN users u ON d.donor_id = u.id
      JOIN blood_banks bb ON d.blood_bank_id = bb.id
      WHERE d.id = ?
    `, [id]);

    if (donations.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Donation not found'
      });
    }

    res.json({
      success: true,
      data: donations[0]
    });

  } catch (error) {
    console.error('Error fetching donation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch donation details'
    });
  } finally {
    if (connection) connection.release();
  }
});

// Update donation status and notes
router.put('/:id', authMiddleware, checkPermission('can_manage_donations'), auditLogger('UPDATE_DONATION', 'donation', {
  getEntityId: (req) => req.params.id,
  getEntityName: (req, responseData) => {
    // Use response data if available, otherwise return a placeholder
    const donorName = responseData?.donor?.name || `Donor #${req.body.donor_id || req.params.id}`;
    return `Donation by ${donorName}`;
  },
  getOldValues: async (req) => {
    const connection = await pool.getConnection();
    try {
      const [donations] = await connection.query('SELECT status, health_screening_notes FROM donations WHERE id = ?', [req.params.id]);
      return donations.length > 0 ? donations[0] : null;
    } finally {
      connection.release();
    }
  },
  getNewValues: (req) => ({
    status: req.body.status,
    health_screening_notes: req.body.health_screening_notes
  })
}), async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    const { status, health_screening_notes } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    connection = await pool.getConnection();

    // Check if donation exists
    const [existing] = await connection.query(
      'SELECT id FROM donations WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Donation not found'
      });
    }

    // Update donation
    await connection.query(
      `UPDATE donations 
       SET status = ?, health_screening_notes = ?
       WHERE id = ?`,
      [status, health_screening_notes || null, id]
    );

    // If status is 'Completed', update blood inventory
    if (status === 'Completed') {
      const [donationDetails] = await connection.query(
        `SELECT blood_bank_id, blood_type, quantity_ml 
         FROM donations 
         WHERE id = ?`,
        [id]
      );

      if (donationDetails.length > 0) {
        const { blood_bank_id, blood_type, quantity_ml } = donationDetails[0];
        
        // Update blood inventory
        await connection.query(
          `UPDATE blood_inventory 
           SET units_available = units_available + ?,
               last_updated = CURRENT_TIMESTAMP
           WHERE blood_bank_id = ? AND blood_type = ?`,
          [Math.floor(quantity_ml / 450), blood_bank_id, blood_type]
        );
      }
    }

    res.json({
      success: true,
      message: 'Donation updated successfully'
    });

  } catch (error) {
    console.error('Error updating donation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update donation'
    });
  } finally {
    if (connection) connection.release();
  }
});

// Get donation statistics
router.get('/stats/summary', authMiddleware, async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    
    const [stats] = await connection.query(`
      SELECT
        COUNT(*) as total_donations,
        COUNT(CASE WHEN status = 'Completed' THEN 1 END) as completed_donations,
        COUNT(CASE WHEN status = 'Pending' THEN 1 END) as pending_donations,
        COUNT(CASE WHEN status = 'Rejected' THEN 1 END) as rejected_donations,
        SUM(CASE WHEN status = 'Completed' THEN quantity_ml ELSE 0 END) as total_volume_collected
      FROM donations
    `);

    // Get blood type distribution
    const [bloodTypes] = await connection.query(`
      SELECT 
        blood_type,
        COUNT(*) as count
      FROM donations
      WHERE status = 'Completed'
      GROUP BY blood_type
    `);

    res.json({
      success: true,
      data: {
        ...stats[0],
        blood_type_distribution: bloodTypes
      }
    });

  } catch (error) {
    console.error('Error fetching donation stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch donation statistics'
    });
  } finally {
    if (connection) connection.release();
  }
});

// Add new donation
router.post('/', authMiddleware, checkPermission('can_manage_donations'), auditLogger('CREATE_DONATION', 'donation', {
  getEntityId: (req, responseData) => responseData?.donation?.id,
  getEntityName: (req, responseData) => {
    const donorName = responseData?.donor?.name || `Donor #${req.body.donor_id}`;
    return `Donation by ${donorName}`;
  },
  getNewValues: (req) => ({
    donor_id: req.body.donor_id,
    blood_bank_id: req.body.blood_bank_id,
    donation_date: req.body.donation_date,
    blood_type: req.body.blood_type,
    quantity_ml: req.body.quantity_ml,
    status: req.body.status || 'Pending'
  })
}), async (req, res) => {
  let connection;
  try {
    const {
      donor_id,
      blood_bank_id,
      donation_date,
      blood_type,
      quantity_ml,
      health_screening_notes
    } = req.body;

    // Validate required fields
    if (!donor_id || !blood_bank_id || !donation_date || !blood_type || !quantity_ml) {
      return res.status(400).json({
        success: false,
        message: 'All required fields must be provided'
      });
    }

    connection = await pool.getConnection();

    // Start transaction
    await connection.beginTransaction();

    // Insert donation record
    const [result] = await connection.query(
      `INSERT INTO donations 
        (donor_id, blood_bank_id, donation_date, blood_type, quantity_ml, status, health_screening_notes)
       VALUES (?, ?, ?, ?, ?, 'Pending', ?)`,
      [donor_id, blood_bank_id, donation_date, blood_type, quantity_ml, health_screening_notes || null]
    );

    // Get donor details for notification
    const [donors] = await connection.query(
      `SELECT name FROM users WHERE id = ?`,
      [donor_id]
    );

    // Get blood bank details
    const [bloodBanks] = await connection.query(
      `SELECT name FROM blood_banks WHERE id = ?`,
      [blood_bank_id]
    );

    // Create notification for donor
    if (donors.length > 0) {
      await connection.query(
        `INSERT INTO notifications (user_id, title, message, type)
         VALUES (?, 'New Donation Record', ?, 'info')`,
        [
          donor_id,
          `Your blood donation at ${bloodBanks[0].name} on ${new Date(donation_date).toLocaleDateString()} has been recorded.`
        ]
      );
    }

    // Commit transaction
    await connection.commit();

    res.status(201).json({
      success: true,
      message: 'Donation record created successfully',
      data: {
        id: result.insertId
      }
    });

  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error('Error creating donation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create donation record'
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

// Add route to get donors
router.get('/users/donors', authMiddleware, async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();

    const [donors] = await connection.query(`
      SELECT 
        u.id,
        u.name,
        u.email,
        up.blood_type
      FROM users u
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE u.role = 'user'
      ORDER BY u.name
    `);

    res.json({
      success: true,
      data: donors
    });

  } catch (error) {
    console.error('Error fetching donors:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch donors'
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

module.exports = router;