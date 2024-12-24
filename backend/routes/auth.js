// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../config/database');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middleware/auth');
const pool = require('../config/database');
const sessionManager = require('../middleware/sessionManager');

const validatePassword = (password) => {
    const errors = [];
    
    // Check length
    if (password.length < 8 || password.length > 20) {
        errors.push('Password must be between 8 and 20 characters');
    }

    // Check for alphabets
    if (!/[a-zA-Z]/.test(password)) {
        errors.push('Password must contain at least one letter');
    }

    // Check for numbers
    if (!/\d/.test(password)) {
        errors.push('Password must contain at least one number');
    }

    return errors;
};

const otpStore = new Map();

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Verify email endpoint
router.post('/verify-email', async (req, res) => {
  let connection;
  try {
    let { email } = req.body;

    if (typeof email === 'string') {
      email = email.trim();
    }

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    connection = await pool.getConnection();

    // Check if user exists
    const [users] = await connection.query(
      'SELECT id, status, role FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email address'
      });
    }

    if (users[0].status === 'inactive') {
      return res.status(403).json({
        success: false,
        message: 'Account is inactive. Please contact support.'
      });
    }

    res.json({
      success: true,
      message: 'Email verified successfully'
    });

  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying email'
    });
  } finally {
    if (connection) connection.release();
  }
});

// Send OTP endpoint
router.post('/send-otp', async (req, res) => {
  let connection;
  try {
    const { email } = req.body;

    connection = await pool.getConnection();

    // Verify user exists, is active, and has user role
    const [users] = await connection.query(
      'SELECT id, status, role FROM users WHERE email = ? AND role = ?',
      [email, 'user']
    );

    if (users.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Password reset is only available for user accounts, not admin accounts'
      });
    }

    if (users[0].status === 'inactive') {
      return res.status(403).json({
        success: false,
        message: 'Account is inactive. Please contact support.'
      });
    }

    // Generate and store OTP
    const otp = generateOTP();
    otpStore.set(email, {
      otp,
      timestamp: Date.now(),
      attempts: 0
    });

    // In production, send OTP via email
    console.log(`OTP for ${email}: ${otp}`);

    res.json({
      success: true,
      message: 'OTP sent successfully'
    });

  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send OTP'
    });
  } finally {
    if (connection) connection.release();
  }
});

// Verify OTP endpoint
router.post('/verify-otp', (req, res) => {
  const { email, otp } = req.body;

  const storedData = otpStore.get(email);
  
  if (!storedData) {
    return res.status(400).json({
      success: false,
      message: 'OTP expired or not found. Please request a new one.'
    });
  }

  // Check if OTP is expired (15 minutes)
  if (Date.now() - storedData.timestamp > 15 * 60 * 1000) {
    otpStore.delete(email);
    return res.status(400).json({
      success: false,
      message: 'OTP has expired. Please request a new one.'
    });
  }

  // Check maximum attempts (3)
  if (storedData.attempts >= 3) {
    otpStore.delete(email);
    return res.status(400).json({
      success: false,
      message: 'Too many failed attempts. Please request a new OTP.'
    });
  }

  // Verify OTP
  if (storedData.otp !== otp) {
    storedData.attempts++;
    otpStore.set(email, storedData);
    
    return res.status(400).json({
      success: false,
      message: 'Invalid OTP'
    });
  }

  // OTP verified successfully
  res.json({
    success: true,
    message: 'OTP verified successfully'
  });
});

// Reset password endpoint
router.post('/reset-password', async (req, res) => {
  let connection;
  try {
    const { email, newPassword, otp } = req.body;

    // Verify OTP again as final security check
    const storedData = otpStore.get(email);
    if (!storedData || storedData.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token. Please restart the password reset process.'
      });
    }

    // Password validation
    if (!newPassword || newPassword.length < 8 || newPassword.length > 20) {
      return res.status(400).json({
        success: false,
        message: 'Password must be between 8 and 20 characters'
      });
    }

    if (!/[a-z]/.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message: 'Password must contain at least one lowercase letter'
      });
    }

    if (!/[A-Z]/.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message: 'Password must contain at least one uppercase letter'
      });
    }

    if (!/\d/.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message: 'Password must contain at least one number'
      });
    }

    connection = await pool.getConnection();

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password in database
    await connection.query(
      'UPDATE users SET password = ? WHERE email = ?',
      [hashedPassword, email]
    );

    // Clear OTP after successful password reset
    otpStore.delete(email);

    res.json({
      success: true,
      message: 'Password reset successfully'
    });

  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset password'
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

router.post('/register', async (req, res) => {
    let connection;
    try {
        const { password } = req.body;

        // Validate password
        const passwordErrors = validatePassword(password);
        if (passwordErrors.length > 0) {
            return res.status(400).json({
                message: 'Password validation failed',
                errors: passwordErrors
            });
        }

        
    } catch (error) {
        console.error('Password Validation failed:', error);
    }

    try {
        // Log the received data
        console.log('Registration request body:', req.body);

        const { name, email, phone, password, bloodType, dateOfBirth, gender, area } = req.body;

        // Validate required fields
        if (!name || !email || !password || !bloodType || !dateOfBirth || !gender || !area) {
            return res.status(400).json({
              message: 'Missing required fields',
              receivedData: req.body
            });
        }

        try {
            // Get connection from pool
            connection = await db.getConnection();
            console.log('Database connection established');

            // Check if user exists
            const [existingUsers] = await connection.query(
                'SELECT * FROM users WHERE email = ?',
                [email]
            );

            if (existingUsers.length > 0) {
                return res.status(400).json({ message: 'Email already registered' });
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);
            console.log('Password hashed successfully');

            // Start transaction
            await connection.beginTransaction();
            console.log('Transaction started');

            // Insert user
            const [userResult] = await connection.query(
                'INSERT INTO users (name, email, phone, password) VALUES (?, ?, ?, ?)',
                [name, email, phone || null, hashedPassword]
            );
            console.log('User inserted:', userResult.insertId);

            // Insert profile
            await connection.query(
                'INSERT INTO user_profiles (user_id, blood_type, date_of_birth, gender, area) VALUES (?, ?, ?, ?, ?)',
                [userResult.insertId, bloodType, dateOfBirth, gender, area]
            );
            console.log('Profile inserted');

            // Commit transaction
            await connection.commit();
            console.log('Transaction committed');

            // Return success
            res.status(201).json({
                message: 'User registered successfully',
                userId: userResult.insertId
            });
        } catch (error) {
            // Log specific error
            console.error('Database operation failed:', error);
            
            // Rollback if transaction started
            if (connection) {
                try {
                    await connection.rollback();
                    console.log('Transaction rolled back');
                } catch (rollbackError) {
                    console.error('Rollback failed:', rollbackError);
                  }
              }
            throw error;
        } finally {
            // Release connection
            if (connection) {
                try {
                    connection.release();
                    console.log('Connection released');
                } catch (releaseError) {
                    console.error('Error releasing connection:', releaseError);
                }
            }
        }
    } catch (error) {
        console.error('Registration failed:', error);
        res.status(500).json({
            message: 'Error registering user',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

router.post('/login', async (req, res) => {
  let connection;
  try {
      const { email, password } = req.body;
      const deviceInfo = {
          userAgent: req.headers['user-agent'],
          platform: req.headers['sec-ch-ua-platform'],
          mobile: req.headers['sec-ch-ua-mobile']
      };
      const ipAddress = req.ip;

      connection = await pool.getConnection();
      
      const [users] = await connection.query(
          `SELECT u.*, up.blood_type, up.date_of_birth, up.gender 
           FROM users u 
           LEFT JOIN user_profiles up ON u.id = up.user_id 
           WHERE u.email = ?`,
          [email]
      );

      if (users.length === 0) {
          return res.status(401).json({
              success: false,
              message: 'Invalid email or password'
          });
      }

      const user = users[0];
      const validPassword = await bcrypt.compare(password, user.password);

      if (!validPassword) {
          return res.status(401).json({
              success: false,
              message: 'Invalid email or password'
          });
      }

      // Check for existing active session
      const [existingSessions] = await connection.query(
          `SELECT * FROM user_sessions 
           WHERE user_id = ? AND last_active > DATE_SUB(NOW(), INTERVAL 24 HOUR)`,
          [user.id]
      );

      if (existingSessions.length > 0) {
          // Optionally notify the user that they're already logged in elsewhere
          return res.status(400).json({
              success: false,
              message: 'You are already logged in on another device or browser. Please log out first.',
              code: 'ACTIVE_SESSION_EXISTS'
          });
      }

      // Create new session
      const sessionId = await sessionManager.createSession(
          user.id,
          JSON.stringify(deviceInfo),
          ipAddress
      );

      // Generate token with session ID
      const token = jwt.sign(
          { 
              userId: user.id,
              role: user.role,
              sessionId: sessionId
          },
          process.env.JWT_SECRET,
          { expiresIn: '24h' }
      );

      // Remove sensitive data
      delete user.password;

      res.json({
          success: true,
          token,
          sessionId,
          user: {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
              bloodType: user.blood_type,
              dateOfBirth: user.date_of_birth,
              gender: user.gender
          }
      });

  } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
          success: false,
          message: 'Login failed'
      });
  } finally {
      if (connection) connection.release();
  }
});

router.get('/me', authMiddleware, async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();

    const [users] = await connection.query(
      `SELECT u.id, u.name, u.email, u.role, u.phone,
              up.blood_type, up.date_of_birth, up.gender
       FROM users u
       LEFT JOIN user_profiles up ON u.id = up.user_id
       WHERE u.id = ?`,
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user: users[0]
    });

  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user data'
    });
  } finally {
    if (connection) connection.release();
  }
});

router.post('/login', async (req, res) => {
  let connection;
  try {
    const { email, password } = req.body;

    connection = await pool.getConnection();
    
    const [users] = await connection.query(
      `SELECT u.*, up.blood_type, up.date_of_birth, up.gender 
       FROM users u 
       LEFT JOIN user_profiles up ON u.id = up.user_id 
       WHERE u.email = ?`,
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const user = users[0];
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate token
    const token = jwt.sign(
      { 
        userId: user.id,
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Remove sensitive data
    delete user.password;

    res.json({
      success: true,
      token, // Send raw token
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        bloodType: user.blood_type,
        dateOfBirth: user.date_of_birth,
        gender: user.gender
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  } finally {
    if (connection) connection.release();
  }
});

router.get('/me', authMiddleware, async (req, res) => {
    let connection;
    try {
      connection = await pool.getConnection();
  
      const [users] = await connection.query(
        `SELECT u.id, u.name, u.email, u.role, u.phone, 
        up.blood_type, up.date_of_birth, up.gender
        FROM users u
        LEFT JOIN user_profiles up ON u.id = up.user_id
        WHERE u.id = ?`,
        [req.user.id]
      );
  
      if (users.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
  
      res.json({
        success: true,
        user: users[0]
      });
  
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch user data'
      });
    } finally {
      if (connection) connection.release();
    }
});

// Removed duplicate /verify-email route definition

module.exports = router;
