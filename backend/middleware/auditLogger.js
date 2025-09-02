// backend/middleware/auditLogger.js
const pool = require('../config/database');

const auditLogger = (action, entityType, options = {}) => {
  return async (req, res, next) => {
    // Store original res.json to intercept the response
    const originalJson = res.json;
    
    res.json = function(data) {
      // Only log if the request was successful
      if (res.statusCode >= 200 && res.statusCode < 300) {
        logAuditAction(req, action, entityType, options, data);
      }
      return originalJson.call(this, data);
    };
    
    next();
  };
};

const logAuditAction = async (req, action, entityType, options, responseData) => {
  try {
    if (!req.user || !req.user.id) {
      return; // Skip logging if no user context
    }

    const connection = await pool.getConnection();
    try {
      // Get admin details
      const [admins] = await connection.query(
        'SELECT name FROM users WHERE id = ?',
        [req.user.id]
      );

      if (admins.length === 0) {
        return;
      }

      const adminName = admins[0].name;
      const ipAddress = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'];
      const userAgent = req.headers['user-agent'];

             // Extract entity information
       let entityId = null;
       let entityName = null;
       let oldValues = null;
       let newValues = null;

       // Handle different entity types and actions
       if (options.getEntityId) {
         entityId = options.getEntityId(req, responseData);
       } else if (req.params.id) {
         entityId = req.params.id;
       }

             if (options.getEntityName) {
        const result = options.getEntityName(req, responseData);
        // Handle both sync and async getEntityName functions
        if (result && typeof result.then === 'function') {
          entityName = await result;
        } else {
          entityName = result;
        }
      }

             if (options.getOldValues) {
        const result = options.getOldValues(req);
        // Handle both sync and async getOldValues functions
        if (result && typeof result.then === 'function') {
          oldValues = await result;
        } else {
          oldValues = result;
        }
      }

      if (options.getNewValues) {
        const result = options.getNewValues(req, responseData);
        // Handle both sync and async getNewValues functions
        if (result && typeof result.then === 'function') {
          newValues = await result;
        } else {
          newValues = result;
        }
      }

             // Ensure entityName is not null, undefined, or empty
      if (!entityName || entityName.trim() === '') {
         // For different entity types, try to fetch the actual names
         if (entityType === 'user' && entityId) {
           try {
             const [users] = await connection.query('SELECT name FROM users WHERE id = ?', [entityId]);
             if (users.length > 0) {
               entityName = users[0].name;
             } else {
               entityName = `User #${entityId}`;
             }
           } catch (error) {
             console.error('Error fetching user name for audit log:', error);
             entityName = `User #${entityId}`;
           }
         } else if (entityType === 'donation' && entityId) {
           try {
             const [donations] = await connection.query(
               'SELECT d.*, u.name as donor_name FROM donations d JOIN users u ON d.donor_id = u.id WHERE d.id = ?',
               [entityId]
             );
             if (donations.length > 0) {
               entityName = `Donation by ${donations[0].donor_name}`;
             } else {
               entityName = `Donation #${entityId}`;
             }
           } catch (error) {
             console.error('Error fetching donation name for audit log:', error);
             entityName = `Donation #${entityId}`;
           }
         } else if (entityType === 'appointment' && entityId) {
           try {
             const [appointments] = await connection.query('SELECT name FROM campaign_reservations WHERE id = ?', [entityId]);
             if (appointments.length > 0) {
               entityName = `Appointment for ${appointments[0].name}`;
             } else {
               entityName = `Appointment #${entityId}`;
             }
           } catch (error) {
             console.error('Error fetching appointment name for audit log:', error);
             entityName = `Appointment #${entityId}`;
           }
         } else if (entityType === 'campaign' && entityId) {
           try {
             const [campaigns] = await connection.query('SELECT location FROM campaigns WHERE id = ?', [entityId]);
             if (campaigns.length > 0) {
               entityName = campaigns[0].location;
             } else {
               entityName = `Campaign #${entityId}`;
             }
           } catch (error) {
             console.error('Error fetching campaign name for audit log:', error);
             entityName = `Campaign #${entityId}`;
           }
         } else if (entityType === 'inventory' && entityId) {
           try {
             // Parse entityId format: "bankId_bloodType"
             const [bankId, bloodType] = entityId.split('_');
             const [bloodBanks] = await connection.query('SELECT name FROM blood_banks WHERE id = ?', [bankId]);
             const bankName = bloodBanks.length > 0 ? bloodBanks[0].name : `Blood Bank #${bankId}`;
             entityName = `${bankName} - ${bloodType}`;
           } catch (error) {
             console.error('Error fetching inventory name for audit log:', error);
             entityName = `Inventory #${entityId}`;
           }
                   } else if (entityType === 'message' && entityId) {
            try {
              const [messages] = await connection.query('SELECT subject, name FROM messages WHERE id = ?', [entityId]);
              if (messages.length > 0) {
                entityName = `Message: ${messages[0].subject} (from ${messages[0].name})`;
              } else {
                entityName = `Message #${entityId}`;
              }
            } catch (error) {
              console.error('Error fetching message name for audit log:', error);
              entityName = `Message #${entityId}`;
            }
          } else if (entityType === 'blood_bank' && entityId) {
            try {
              const [bloodBanks] = await connection.query('SELECT name FROM blood_banks WHERE id = ?', [entityId]);
              if (bloodBanks.length > 0) {
                entityName = bloodBanks[0].name;
              } else {
                entityName = `Blood Bank #${entityId}`;
              }
            } catch (error) {
              console.error('Error fetching blood bank name for audit log:', error);
              entityName = `Blood Bank #${entityId}`;
            }
          } else if (entityType === 'notification' && entityId) {
            // For bulk notifications, entityId is already formatted as "bulk_timestamp"
            entityName = `Bulk Notification #${entityId}`;
          } else {
            entityName = `${entityType} #${entityId || 'Unknown'}`;
          }
       }

      // Final safety check - ensure entityName is never empty
      if (!entityName || entityName.trim() === '') {
        entityName = `${entityType} #${entityId || 'Unknown'}`;
      }

      // Insert audit log
      await connection.query(
        `INSERT INTO audit_logs 
         (admin_id, admin_name, action, entity_type, entity_id, entity_name, old_values, new_values, ip_address, user_agent)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          req.user.id,
          adminName,
          action,
          entityType,
          entityId,
          entityName,
          oldValues ? JSON.stringify(oldValues) : null,
          newValues ? JSON.stringify(newValues) : null,
          ipAddress,
          userAgent
        ]
      );

    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Audit logging error:', error);
    // Don't throw error to avoid breaking the main request
  }
};

// Helper functions for common audit scenarios
const auditHelpers = {
  // User management
  userCreated: (req, responseData) => {
    return {
      entityId: responseData?.user?.id,
      entityName: responseData?.user?.name || req.body.name,
      newValues: {
        name: req.body.name,
        email: req.body.email,
        role: req.body.role,
        status: req.body.status
      }
    };
  },

  userUpdated: async (req, responseData) => {
    const connection = await pool.getConnection();
    try {
      const [users] = await connection.query(
        'SELECT name, email, role, status FROM users WHERE id = ?',
        [req.params.id]
      );
      
      if (users.length > 0) {
        const oldUser = users[0];
        return {
          entityId: req.params.id,
          entityName: oldUser.name,
          oldValues: oldUser,
          newValues: {
            name: req.body.name,
            email: req.body.email,
            role: req.body.role,
            status: req.body.status
          }
        };
      }
    } finally {
      connection.release();
    }
    return null;
  },

  userStatusChanged: async (req, responseData) => {
    const connection = await pool.getConnection();
    try {
      const [users] = await connection.query(
        'SELECT name, status FROM users WHERE id = ?',
        [req.params.id]
      );
      
      if (users.length > 0) {
        const user = users[0];
        return {
          entityId: req.params.id,
          entityName: user.name,
          oldValues: { status: user.status },
          newValues: { status: req.body.status }
        };
      }
    } finally {
      connection.release();
    }
    return null;
  },

  // Donation management
  donationCreated: (req, responseData) => {
    return {
      entityId: responseData?.donation?.id,
      entityName: `Donation by ${req.body.donor_id}`,
      newValues: {
        donor_id: req.body.donor_id,
        blood_bank_id: req.body.blood_bank_id,
        donation_date: req.body.donation_date,
        blood_type: req.body.blood_type,
        quantity_ml: req.body.quantity_ml,
        status: req.body.status || 'Pending'
      }
    };
  },

  donationUpdated: async (req, responseData) => {
    const connection = await pool.getConnection();
    try {
      const [donations] = await connection.query(
        'SELECT d.*, u.name as donor_name FROM donations d JOIN users u ON d.donor_id = u.id WHERE d.id = ?',
        [req.params.id]
      );
      
      if (donations.length > 0) {
        const oldDonation = donations[0];
        return {
          entityId: req.params.id,
          entityName: `Donation by ${oldDonation.donor_name}`,
          oldValues: {
            status: oldDonation.status,
            health_screening_notes: oldDonation.health_screening_notes
          },
          newValues: {
            status: req.body.status,
            health_screening_notes: req.body.health_screening_notes
          }
        };
      }
    } finally {
      connection.release();
    }
    return null;
  },

  // Campaign management
  campaignCreated: (req, responseData) => {
    return {
      entityId: responseData?.campaign?.id,
      entityName: req.body.location,
      newValues: {
        location: req.body.location,
        organizer: req.body.organizer,
        address: req.body.address,
        sessions: req.body.sessions
      }
    };
  },

  campaignUpdated: async (req, responseData) => {
    const connection = await pool.getConnection();
    try {
      const [campaigns] = await connection.query(
        'SELECT * FROM campaigns WHERE id = ?',
        [req.params.id]
      );
      
      if (campaigns.length > 0) {
        const oldCampaign = campaigns[0];
        return {
          entityId: req.params.id,
          entityName: oldCampaign.location,
          oldValues: oldCampaign,
          newValues: {
            location: req.body.location,
            organizer: req.body.organizer,
            address: req.body.address,
            sessions: req.body.sessions
          }
        };
      }
    } finally {
      connection.release();
    }
    return null;
  },

  campaignDeleted: async (req, responseData) => {
    const connection = await pool.getConnection();
    try {
      const [campaigns] = await connection.query(
        'SELECT * FROM campaigns WHERE id = ?',
        [req.params.id]
      );
      
      if (campaigns.length > 0) {
        const campaign = campaigns[0];
        return {
          entityId: req.params.id,
          entityName: campaign.location,
          oldValues: campaign
        };
      }
    } finally {
      connection.release();
    }
    return null;
  },

  // Appointment management
  appointmentStatusChanged: async (req, responseData) => {
    const connection = await pool.getConnection();
    try {
      const [appointments] = await connection.query(
        'SELECT * FROM campaign_reservations WHERE id = ?',
        [req.params.id]
      );
      
      if (appointments.length > 0) {
        const appointment = appointments[0];
        return {
          entityId: req.params.id,
          entityName: `Appointment for ${appointment.name}`,
          oldValues: { status: appointment.status },
          newValues: { status: req.body.status || req.body.action }
        };
      }
    } finally {
      connection.release();
    }
    return null;
  },

  appointmentCompleted: async (req, responseData) => {
    const connection = await pool.getConnection();
    try {
      const [appointments] = await connection.query(
        'SELECT * FROM campaign_reservations WHERE id = ?',
        [req.params.id]
      );
      
      if (appointments.length > 0) {
        const appointment = appointments[0];
        return {
          entityId: req.params.id,
          entityName: `Appointment for ${appointment.name}`,
          oldValues: { donation_completed: appointment.donation_completed },
          newValues: { 
            donation_completed: true,
            donation_completed_date: req.body.donation_completed_date,
            next_eligible_date: req.body.next_eligible_date
          }
        };
      }
    } finally {
      connection.release();
    }
    return null;
  }
};

module.exports = { auditLogger, auditHelpers };
