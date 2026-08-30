// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../config/database');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middleware/auth');
const pool = require('../config/database');
const { sendResetOtpEmail } = require('../utils/mailer');

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

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const requestPasswordReset = async (req, res) => {
  let connection;
  let userId;

  try {
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email address is required' });
    }

    connection = await pool.getConnection();
    const [users] = await connection.query(
      'SELECT id, email, status, role FROM users WHERE email = ?',
      [email]
    );
    const user = users[0];

    // Do not disclose whether an eligible account exists.
    if (!user || user.role !== 'user' || user.status === 'inactive') {
      return res.status(200).json({
        success: true,
        message: 'If this email is registered, an OTP has been sent.'
      });
    }

    const otp = generateOTP();
    const hashedOtp = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    userId = user.id;

    await connection.query(
      'UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?',
      [hashedOtp, expiresAt, userId]
    );
    await sendResetOtpEmail(user.email, otp);

    return res.status(200).json({ success: true, message: 'OTP sent to your email successfully.' });
  } catch (error) {
    // A token whose email failed to send should not remain usable.
    if (connection && userId) {
      try {
        await connection.query(
          'UPDATE users SET reset_token = NULL, reset_token_expires = NULL WHERE id = ?',
          [userId]
        );
      } catch (cleanupError) {
        console.error('Failed to clear undelivered reset OTP:', cleanupError);
      }
    }
    console.error('Forgot password error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to send OTP email. Please try again later.'
    });
  } finally {
    if (connection) connection.release();
  }
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

router.post('/forgot-password', requestPasswordReset);
// Backward-compatible endpoint used by the existing reset-password page.
router.post('/send-otp', requestPasswordReset);

// Verify OTP endpoint
router.post('/verify-otp', async (req, res) => {
  let connection;
  try {
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const otp = req.body.otp == null ? '' : String(req.body.otp);
    if (!email || !/^\d{6}$/.test(otp)) {
      return res.status(400).json({ success: false, message: 'A valid email and 6-digit OTP are required' });
    }

    connection = await pool.getConnection();
    const [users] = await connection.query(
      'SELECT reset_token, reset_token_expires FROM users WHERE email = ?',
      [email]
    );
    const user = users[0];
    if (!user || !user.reset_token || !user.reset_token_expires) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP request' });
    }
    if (Date.now() > new Date(user.reset_token_expires).getTime()) {
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
    }
    if (!(await bcrypt.compare(otp, user.reset_token))) {
      return res.status(400).json({ success: false, message: 'Invalid OTP code' });
    }

    return res.json({ success: true, message: 'OTP verified successfully' });
  } catch (error) {
    console.error('OTP verification error:', error);
    return res.status(500).json({ success: false, message: 'Failed to verify OTP' });
  } finally {
    if (connection) connection.release();
  }
});

// Reset password endpoint
router.post('/reset-password', async (req, res) => {
  let connection;
  try {
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const otp = req.body.otp == null ? '' : String(req.body.otp);
    const { newPassword } = req.body;

    if (!email || !/^\d{6}$/.test(otp) || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email, OTP, and new password are required'
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

    const [users] = await connection.query(
      'SELECT id, reset_token, reset_token_expires FROM users WHERE email = ?',
      [email]
    );
    const user = users[0];
    if (!user || !user.reset_token || !user.reset_token_expires) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP request' });
    }
    if (Date.now() > new Date(user.reset_token_expires).getTime()) {
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
    }
    if (!(await bcrypt.compare(otp, user.reset_token))) {
      return res.status(400).json({ success: false, message: 'Invalid OTP code' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Consume the OTP when the password changes.
    await connection.query(
      'UPDATE users SET password = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?',
      [hashedPassword, user.id]
    );

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

    connection = await pool.getConnection();
    
    // Update query to check status
    const [users] = await connection.query(
        `SELECT u.*, up.blood_type, up.date_of_birth, up.gender, up.area 
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

    // Check if user is inactive
    if (user.status === 'inactive') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact the administrator.'
      });
    }

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate token if user is active and password is valid
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
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        bloodType: user.blood_type,
        dateOfBirth: user.date_of_birth,
        gender: user.gender,
        area: user.area
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
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
      { expiresIn: '168h' }
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
