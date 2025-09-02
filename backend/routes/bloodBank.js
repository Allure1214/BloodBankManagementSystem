// backend/routes/bloodBank.js
const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const authMiddleware = require('../middleware/auth');
const checkPermission = require('../middleware/checkPermission');
const { auditLogger } = require('../middleware/auditLogger');

// Add blood bank
router.post('/', authMiddleware, checkPermission('can_manage_blood_banks'), auditLogger('CREATE_BLOOD_BANK', 'blood_bank', {
  getEntityId: (req, responseData) => responseData?.data?.id || 'new',
  getEntityName: (req, responseData) => req.body.name || `Blood Bank #${responseData?.data?.id || 'new'}`,
  getOldValues: () => null,
  getNewValues: (req) => ({
    name: req.body.name,
    address: req.body.address,
    area: req.body.area,
    contact: req.body.contact,
    operating_hours: req.body.operating_hours
  })
}), async (req, res) => {
  let connection;
  try {
    const { name, address, area, contact, operating_hours } = req.body;
    
    if (!name || !address || !area) {
      return res.status(400).json({
        success: false,
        message: 'Name, address, and area are required'
      });
    }

    connection = await pool.getConnection();
    const [result] = await connection.query(
      `INSERT INTO blood_banks (name, address, area, contact, operating_hours)
       VALUES (?, ?, ?, ?, ?)`,
      [name, address, area, contact, operating_hours]
    );

    // Initialize blood inventory for new blood bank
    const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    await Promise.all(bloodTypes.map(type => 
      connection.query(
        `INSERT INTO blood_inventory (blood_bank_id, blood_type, units_available)
         VALUES (?, ?, 0)`,
        [result.insertId, type]
      )
    ));

    res.status(201).json({
      success: true,
      message: 'Blood bank added successfully',
      data: { id: result.insertId }
    });

  } catch (error) {
    console.error('Error adding blood bank:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add blood bank'
    });
  } finally {
    if (connection) connection.release();
  }
});

// Update blood bank
router.put('/:id', authMiddleware, checkPermission('can_manage_blood_banks'), auditLogger('UPDATE_BLOOD_BANK', 'blood_bank', {
  getEntityId: (req) => req.params.id,
  getEntityName: (req, responseData) => {
    // Try to get blood bank name from response data first
    if (responseData?.bloodBank?.name) {
      return responseData.bloodBank.name;
    }
    
    // Use the name from request body if available
    if (req.body.name) {
      return req.body.name;
    }
    
    // Fallback to placeholder
    return `Blood Bank #${req.params.id}`;
  },
  getOldValues: async (req) => {
    const connection = await pool.getConnection();
    try {
      const [bloodBanks] = await connection.query(
        'SELECT name, address, area, contact, operating_hours FROM blood_banks WHERE id = ?',
        [req.params.id]
      );
      return bloodBanks.length > 0 ? bloodBanks[0] : null;
    } finally {
      connection.release();
    }
  },
  getNewValues: (req) => ({
    name: req.body.name,
    address: req.body.address,
    area: req.body.area,
    contact: req.body.contact,
    operating_hours: req.body.operating_hours
  })
}), async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    const { name, address, area, contact, operating_hours } = req.body;

    if (!name || !address || !area) {
      return res.status(400).json({
        success: false,
        message: 'Name, address, and area are required'
      });
    }

    connection = await pool.getConnection();
    
    // Check if blood bank exists
    const [existing] = await connection.query(
      'SELECT id FROM blood_banks WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Blood bank not found'
      });
    }

    await connection.query(
      `UPDATE blood_banks 
       SET name = ?, address = ?, area = ?, contact = ?, operating_hours = ?
       WHERE id = ?`,
      [name, address, area, contact, operating_hours, id]
    );

    // Get blood bank name for response
    const [bloodBanks] = await connection.query(
      'SELECT name FROM blood_banks WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: 'Blood bank updated successfully',
      bloodBank: bloodBanks.length > 0 ? { name: bloodBanks[0].name } : null
    });

  } catch (error) {
    console.error('Error updating blood bank:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update blood bank'
    });
  } finally {
    if (connection) connection.release();
  }
});

// Delete blood bank
router.delete('/:id', authMiddleware, checkPermission('can_manage_blood_banks'), auditLogger('DELETE_BLOOD_BANK', 'blood_bank', {
  getEntityId: (req) => req.params.id,
  getEntityName: async (req) => {
    // For delete operations, fetch the blood bank name before deletion
    try {
      const connection = await pool.getConnection();
      const [bloodBanks] = await connection.query(
        'SELECT name FROM blood_banks WHERE id = ?',
        [req.params.id]
      );
      connection.release();
      
      if (bloodBanks.length > 0) {
        return bloodBanks[0].name;
      }
    } catch (error) {
      console.error('Error fetching blood bank name for delete audit log:', error);
    }
    
    return `Blood Bank #${req.params.id}`;
  },
  getOldValues: async (req) => {
    const connection = await pool.getConnection();
    try {
      const [bloodBanks] = await connection.query(
        'SELECT name, address, area, contact, operating_hours FROM blood_banks WHERE id = ?',
        [req.params.id]
      );
      return bloodBanks.length > 0 ? bloodBanks[0] : null;
    } finally {
      connection.release();
    }
  },
  getNewValues: () => null
}), async (req, res) => {
  let connection;
  try {
    const { id } = req.params;

    connection = await pool.getConnection();
    
    // Check if blood bank exists
    const [existing] = await connection.query(
      'SELECT id FROM blood_banks WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Blood bank not found'
      });
    }

    // Start transaction
    await connection.beginTransaction();

    // Delete blood inventory first (due to foreign key constraint)
    await connection.query(
      'DELETE FROM blood_inventory WHERE blood_bank_id = ?',
      [id]
    );

    // Delete blood bank
    await connection.query(
      'DELETE FROM blood_banks WHERE id = ?',
      [id]
    );

    // Commit transaction
    await connection.commit();

    res.json({
      success: true,
      message: 'Blood bank deleted successfully'
    });

  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error('Error deleting blood bank:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete blood bank'
    });
  } finally {
    if (connection) connection.release();
  }
});

router.get('/inventory-summary', async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    
    // Get blood inventory totals
    const [inventoryResults] = await connection.query(`
      SELECT 
        bi.blood_type,
        SUM(bi.units_available) as total_units,
        COUNT(DISTINCT bi.blood_bank_id) as bank_count
      FROM blood_inventory bi
      GROUP BY bi.blood_type
      ORDER BY bi.blood_type
    `);

    // Get monthly donations (simulated for now - you'll need to create a donations table)
    const [monthlyResults] = await connection.query(`
      SELECT 
        DATE_FORMAT(last_updated, '%b') as month,
        SUM(units_available) as donations
      FROM blood_inventory
      GROUP BY DATE_FORMAT(last_updated, '%b')
      ORDER BY MIN(last_updated)
    `);

    // Get statistics
    const [stats] = await connection.query(`
      SELECT 
        COUNT(DISTINCT id) as total_blood_banks
      FROM blood_banks
    `);

    const [donorStats] = await connection.query(`
      SELECT COUNT(*) as total_donors
      FROM users 
      WHERE role = 'user'
    `);

    // Format inventory data
    const inventoryData = inventoryResults.reduce((acc, curr) => {
      acc[curr.blood_type] = parseInt(curr.total_units);
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        statistics: {
          totalDonors: donorStats[0].total_donors,
          totalDonations: monthlyResults.reduce((sum, month) => sum + parseInt(month.donations), 0),
          totalBloodBanks: stats[0].total_blood_banks
        },
        bloodInventory: inventoryData,
        monthlyDonations: monthlyResults.map(row => ({
          month: row.month,
          donations: parseInt(row.donations)
        }))
      }
    });

  } catch (error) {
    console.error('Error fetching inventory summary:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching inventory summary',
      error: error.message
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

// Get blood availability by area and blood type
router.get('/availability', async (req, res) => {
    const { area, bloodType } = req.query;
    let connection;

    try {
        connection = await pool.getConnection();

        const query = `
            SELECT 
                bb.id,
                bb.name,
                bb.address,
                bb.contact,
                bb.operating_hours,
                bi.blood_type,
                bi.units_available,
                bi.last_updated
            FROM blood_banks bb
            JOIN blood_inventory bi ON bb.id = bi.blood_bank_id
            WHERE bb.area = ?
            ${bloodType ? 'AND bi.blood_type = ?' : ''}
            ORDER BY bi.units_available DESC
        `;

        const params = bloodType ? [area, bloodType] : [area];
        const [results] = await connection.query(query, params);

        // Group results by blood bank
        const bloodBanks = results.reduce((acc, curr) => {
            if (!acc[curr.id]) {
                acc[curr.id] = {
                    id: curr.id,
                    name: curr.name,
                    address: curr.address,
                    contact: curr.contact,
                    operatingHours: curr.operating_hours,
                    inventory: {}
                };
            }
            acc[curr.id].inventory[curr.blood_type] = {
                unitsAvailable: curr.units_available,
                lastUpdated: curr.last_updated
            };
            return acc;
        }, {});

        res.json({
            success: true,
            data: Object.values(bloodBanks)
        });

    } catch (error) {
        console.error('Error fetching blood availability:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching blood availability',
            error: error.message
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
});

router.get('/all', async (req, res) => {
    let connection;
    try {
      connection = await pool.getConnection();
      const [results] = await connection.query(
        'SELECT * FROM blood_banks ORDER BY name'
      );
      
      res.json({
        success: true,
        data: results
      });
    } catch (error) {
      console.error('Error fetching blood banks:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching blood banks'
      });
    } finally {
      if (connection) {
        connection.release();
      }
    }
  });

// Get all areas
router.get('/areas', async (req, res) => {
    let connection;

    try {
        connection = await pool.getConnection();
        const [results] = await connection.query(
            'SELECT DISTINCT area FROM blood_banks ORDER BY area'
        );

        res.json({
            success: true,
            data: results.map(r => r.area)
        });

    } catch (error) {
        console.error('Error fetching areas:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching areas',
            error: error.message
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
});

router.get('/:id', async (req, res) => {
    let connection;
    try {
      connection = await pool.getConnection();
      const [results] = await connection.query(
        'SELECT * FROM blood_banks WHERE id = ?',
        [req.params.id]
      );
      
      if (results.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Blood bank not found'
        });
      }
  
      res.json({
        success: true,
        data: results[0]
      });
    } catch (error) {
      console.error('Error fetching blood bank:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching blood bank details'
      });
    } finally {
      if (connection) connection.release();
    }
  });

  router.get('/:id/availability', async (req, res) => {
    let connection;
    try {
      connection = await pool.getConnection();
      const [results] = await connection.query(
        'SELECT blood_type, units_available, last_updated FROM blood_inventory WHERE blood_bank_id = ?',
        [req.params.id]
      );
  
      res.json({
        success: true,
        data: results
      });
    } catch (error) {
      console.error('Error fetching availability:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching availability data'
      });
    } finally {
      if (connection) connection.release();
    }
  });

  router.get('/debug-inventory', async (req, res) => {
    let connection;
    try {
      connection = await pool.getConnection();
      
      // Get raw data
      const [results] = await connection.query('SELECT * FROM blood_inventory LIMIT 10');
      
      res.json({
        success: true,
        data: results,
        count: results.length
      });
      
    } catch (error) {
      console.error('Debug error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    } finally {
      if (connection) {
        connection.release();
      }
    }
  });

  router.get('/:id/inventory',checkPermission('can_manage_inventory'), async (req, res) => {
    let connection;
    try {
      const bankId = req.params.id;
  
      connection = await pool.getConnection();
      
      // First check if blood bank exists
      const [bank] = await connection.query(
        'SELECT id FROM blood_banks WHERE id = ?',
        [bankId]
      );
  
      if (bank.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Blood bank not found'
        });
      }
  
      // Get inventory for all blood types, ensuring each blood type has an entry
      const [inventory] = await connection.query(`
        SELECT 
          bt.blood_type,
          COALESCE(bi.units_available, 0) as units_available,
          COALESCE(bi.last_updated, CURRENT_TIMESTAMP) as last_updated
        FROM (
          SELECT 'A+' as blood_type
          UNION SELECT 'A-'
          UNION SELECT 'B+'
          UNION SELECT 'B-'
          UNION SELECT 'AB+'
          UNION SELECT 'AB-'
          UNION SELECT 'O+'
          UNION SELECT 'O-'
        ) bt
        LEFT JOIN blood_inventory bi ON 
          bi.blood_type = bt.blood_type AND 
          bi.blood_bank_id = ?
        ORDER BY bt.blood_type`,
        [bankId]
      );
  
      // If no inventory exists yet, create default entries
      if (inventory.length === 0) {
        const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
        await Promise.all(bloodTypes.map(type => 
          connection.query(
            `INSERT INTO blood_inventory (blood_bank_id, blood_type, units_available)
              VALUES (?, ?, 0)
              ON DUPLICATE KEY UPDATE units_available = units_available`,
            [bankId, type]
          )
        ));
  
        // Fetch the newly created inventory
        const [newInventory] = await connection.query(
          'SELECT blood_type, units_available, last_updated FROM blood_inventory WHERE blood_bank_id = ?',
          [bankId]
        );
        
        return res.json({
          success: true,
          data: newInventory
        });
      }
  
      res.json({
        success: true,
        data: inventory
      });
  
    } catch (error) {
      console.error('Error fetching blood bank inventory:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch inventory data'
      });
    } finally {
      if (connection) connection.release();
    }
  });

module.exports = router;