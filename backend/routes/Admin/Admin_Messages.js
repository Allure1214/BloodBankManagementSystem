// backend/routes/Admin/Admin_Messages.js
const express = require('express');
const router = express.Router();
const pool = require('../../config/database');
const authMiddleware = require('../../middleware/auth');
const { auditLogger } = require('../../middleware/auditLogger');

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied: Admin only'
    });
  }
  next();
};

// Apply middleware to all routes
router.use(authMiddleware, isAdmin);

  // Get all messages with pagination and filtering
  router.get('/messages', async (req, res) => {
    let connection;
    try {
      const { page = 1, limit = 10, status, search } = req.query;
      const offset = (page - 1) * limit;
      
      connection = await pool.getConnection();
      
      let whereClause = '';
      let queryParams = [];
      
      if (status && status !== 'all') {
        whereClause += ' WHERE status = ?';
        queryParams.push(status);
      }
      
      if (search) {
        const searchCondition = whereClause ? ' AND' : ' WHERE';
        whereClause += `${searchCondition} (name LIKE ? OR email LIKE ? OR subject LIKE ? OR message LIKE ?)`;
        queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
      }
      
      // Get total count
      const [countResult] = await connection.query(
        `SELECT COUNT(*) as total FROM messages${whereClause}`,
        queryParams
      );
      
      const totalMessages = countResult[0].total;
      const totalPages = Math.ceil(totalMessages / limit);
      
      // Get messages
      const [messages] = await connection.query(
        `SELECT id, name, email, subject, message, status, created_at 
         FROM messages${whereClause}
         ORDER BY created_at DESC 
         LIMIT ? OFFSET ?`,
        [...queryParams, parseInt(limit), offset]
      );
      
      res.json({
        success: true,
        messages,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalMessages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      });
      
    } catch (error) {
      console.error('Error fetching messages:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch messages'
      });
    } finally {
      if (connection) connection.release();
    }
  });

// Get single message by ID
router.get('/messages/:id', async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    
    connection = await pool.getConnection();
    
    const [messages] = await connection.query(
      'SELECT * FROM messages WHERE id = ?',
      [id]
    );
    
    if (messages.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }
    
    // Mark message as read if it's new
    if (messages[0].status === 'New') {
      await connection.query(
        'UPDATE messages SET status = ? WHERE id = ?',
        ['Read', id]
      );
      messages[0].status = 'Read';
    }
    
    res.json({
      success: true,
      message: messages[0]
    });
    
  } catch (error) {
    console.error('Error fetching message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch message'
    });
  } finally {
    if (connection) connection.release();
  }
});

// Update message status
router.patch('/messages/:id/status', auditLogger('UPDATE_MESSAGE_STATUS', 'message', {
  getEntityId: (req) => req.params.id,
  getEntityName: (req, responseData) => {
    // Use response data if available, otherwise return a placeholder
    return responseData?.message?.subject ? 
      `Message: ${responseData.message.subject} (from ${responseData.message.name || 'Unknown'})` : 
      `Message #${req.params.id}`;
  },
  getOldValues: async (req) => {
    const connection = await pool.getConnection();
    try {
      const [messages] = await connection.query('SELECT status FROM messages WHERE id = ?', [req.params.id]);
      return messages.length > 0 ? { status: messages[0].status } : null;
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
    
    if (!['New', 'Read', 'Replied'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be New, Read, or Replied'
      });
    }
    
    connection = await pool.getConnection();
    
    const [result] = await connection.query(
      'UPDATE messages SET status = ? WHERE id = ?',
      [status, id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Message status updated successfully'
    });
    
  } catch (error) {
    console.error('Error updating message status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update message status'
    });
  } finally {
    if (connection) connection.release();
  }
});

// Add admin response to message
router.post('/messages/:id/respond', auditLogger('RESPOND_TO_MESSAGE', 'message', {
  getEntityId: (req) => req.params.id,
  getEntityName: (req, responseData) => {
    // Use response data if available, otherwise return a placeholder
    return responseData?.message?.subject ? 
      `Message: ${responseData.message.subject} (from ${responseData.message.name || 'Unknown'})` : 
      `Message #${req.params.id}`;
  },
  getOldValues: async (req) => {
    const connection = await pool.getConnection();
    try {
      const [messages] = await connection.query('SELECT status, admin_response FROM messages WHERE id = ?', [req.params.id]);
      return messages.length > 0 ? { 
        status: messages[0].status, 
        has_response: !!messages[0].admin_response 
      } : null;
    } finally {
      connection.release();
    }
  },
  getNewValues: (req) => ({ 
    status: 'Replied',
    admin_response: req.body.response,
    responded_by: req.user.id
  })
}), async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    const { response } = req.body;
    const adminId = req.user.id;
    
    if (!response || response.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Response message is required'
      });
    }
    
    connection = await pool.getConnection();
    
    const [result] = await connection.query(
      `UPDATE messages 
       SET status = 'Replied', admin_response = ?, responded_at = NOW(), responded_by = ?
       WHERE id = ?`,
      [response.trim(), adminId, id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Response added successfully'
    });
    
  } catch (error) {
    console.error('Error adding response:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add response'
    });
  } finally {
    if (connection) connection.release();
  }
});

// Delete message
router.delete('/messages/:id', auditLogger('DELETE_MESSAGE', 'message', {
  getEntityId: (req) => req.params.id,
  getEntityName: (req, responseData) => {
    // Use response data if available, otherwise return a placeholder
    return responseData?.message?.subject ? 
      `Message: ${responseData.message.subject} (from ${responseData.message.name || 'Unknown'})` : 
      `Message #${req.params.id}`;
  },
  getOldValues: async (req) => {
    const connection = await pool.getConnection();
    try {
      const [messages] = await connection.query('SELECT * FROM messages WHERE id = ?', [req.params.id]);
      return messages.length > 0 ? messages[0] : null;
    } finally {
      connection.release();
    }
  }
}), async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    
    connection = await pool.getConnection();
    
    const [result] = await connection.query(
      'DELETE FROM messages WHERE id = ?',
      [id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Message deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete message'
    });
  } finally {
    if (connection) connection.release();
  }
});

// Get message statistics
router.get('/messages/stats/overview', async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    
    const [stats] = await connection.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'New' THEN 1 ELSE 0 END) as new,
        SUM(CASE WHEN status = 'Read' THEN 1 ELSE 0 END) as read_count,
        SUM(CASE WHEN status = 'Replied' THEN 1 ELSE 0 END) as replied
      FROM messages
    `);
    
    res.json({
      success: true,
      stats: stats[0]
    });
    
  } catch (error) {
    console.error('Error fetching message stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch message statistics'
    });
  } finally {
    if (connection) connection.release();
  }
});

module.exports = router;
