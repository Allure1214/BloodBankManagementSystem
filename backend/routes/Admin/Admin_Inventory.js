const express = require('express');
const router = express.Router();
const pool = require('../../config/database');
const authMiddleware = require('../../middleware/auth');
const checkPermission = require('../../middleware/checkPermission');
const { auditLogger } = require('../../middleware/auditLogger');

// Update inventory
router.put('/inventory/update', authMiddleware, checkPermission('can_manage_inventory'), auditLogger('UPDATE_INVENTORY', 'inventory', {
  getEntityId: (req) => `${req.body.bankId}_${req.body.bloodType}`,
  getEntityName: async (req, responseData) => {
    // Try to get blood bank name from response data first
    if (responseData?.bloodBank?.name) {
      return `${responseData.bloodBank.name} - ${req.body.bloodType}`;
    }
    
    // If not available in response, fetch from database
    try {
      const connection = await pool.getConnection();
      const [bloodBanks] = await connection.query(
        'SELECT name FROM blood_banks WHERE id = ?',
        [req.body.bankId]
      );
      connection.release();
      
      if (bloodBanks.length > 0) {
        return `${bloodBanks[0].name} - ${req.body.bloodType}`;
      }
    } catch (error) {
      console.error('Error fetching blood bank name for audit log:', error);
    }
    
    // Fallback to placeholder
    return `Blood Bank #${req.body.bankId} - ${req.body.bloodType}`;
  },
  getOldValues: async (req) => {
    const connection = await pool.getConnection();
    try {
      const [inventory] = await connection.query(
        'SELECT units_available FROM blood_inventory WHERE blood_bank_id = ? AND blood_type = ?',
        [req.body.bankId, req.body.bloodType]
      );
      return inventory.length > 0 ? { units_available: inventory[0].units_available } : null;
    } finally {
      connection.release();
    }
  },
  getNewValues: (req) => {
    // Calculate new units based on operation
    const operation = req.body.operation;
    const units = req.body.units;
    return {
      operation: operation,
      units_changed: units,
      blood_type: req.body.bloodType,
      blood_bank_id: req.body.bankId
    };
  }
}), async (req, res) => {
  let connection;
  try {
    const bankId = Number(req.body.bankId);
    const units = Number(req.body.units);
    const { bloodType, operation } = req.body;
    const validBloodTypes = new Set(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']);

    if (
      !Number.isInteger(bankId) ||
      !Number.isInteger(units) ||
      units <= 0 ||
      !validBloodTypes.has(bloodType) ||
      !['add', 'subtract'].includes(operation)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid bank, blood type, operation, or unit count'
      });
    }

    connection = await pool.getConnection();

    const sql = operation === 'add'
      ? `UPDATE blood_inventory
         SET units_available = units_available + ?, last_updated = CURRENT_TIMESTAMP
         WHERE blood_bank_id = ? AND blood_type = ?`
      : `UPDATE blood_inventory
         SET units_available = units_available - ?, last_updated = CURRENT_TIMESTAMP
         WHERE blood_bank_id = ? AND blood_type = ? AND units_available >= ?`;
    const params = operation === 'add'
      ? [units, bankId, bloodType]
      : [units, bankId, bloodType, units];
    const [result] = await connection.query(sql, params);

    if (result.affectedRows !== 1) {
      return res.status(409).json({
        success: false,
        message: operation === 'subtract'
          ? 'Inventory missing or insufficient'
          : 'Inventory record not found'
      });
    }

    // Get blood bank name for response
    const [bloodBanks] = await connection.query(
      'SELECT name FROM blood_banks WHERE id = ?',
      [bankId]
    );

    res.json({
      success: true,
      message: 'Inventory updated successfully',
      bloodBank: bloodBanks.length > 0 ? { name: bloodBanks[0].name } : null
    });

  } catch (error) {
    console.error('Error updating inventory:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update inventory'
    });
  } finally {
    if (connection) connection.release();
  }
});

module.exports = router;
