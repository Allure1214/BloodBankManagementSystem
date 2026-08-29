const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const campaignRoutes = require('./routes/campaigns');
const dashboardRoutes = require('./routes/dashboard');
const messagesRoutes = require('./routes/messages');  
const authMiddleware = require('./middleware/auth');
require('dotenv').config();

const requiredProductionEnv = [
  'DB_HOST',
  'DB_USER',
  'DB_PASSWORD',
  'DB_NAME',
  'JWT_SECRET',
  'CORS_ORIGINS'
];

if (process.env.NODE_ENV === 'production') {
  for (const key of requiredProductionEnv) {
    if (!process.env[key]) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  }
}

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be configured with at least 32 characters');
}

const app = express();
const allowedOrigins = new Set(
  (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:3000')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean)
);

// Middleware
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) return callback(null, true);
    return callback(new Error('Origin not allowed by CORS'));
  },
  credentials: true
}));
app.use(express.json({ limit: '100kb' }));

const bloodBankRoutes = require('./routes/bloodBank');
app.use('/api/blood-banks', bloodBankRoutes);

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend server is running' });
});

// Auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/auth', authLimiter, require('./routes/auth'));
app.use('/api/campaigns', campaignRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/user', authMiddleware, require('./routes/user'));
app.use('/api/admin', require('./routes/Admin/Admin_Dashboard'));
app.use('/api/admin/users', require('./routes/Admin/Admin_Users'));
app.use('/api/admin', require('./routes/Admin/Admin_Inventory'));
app.use('/api/admin/campaigns', require('./routes/Admin/Admin_Campaigns'));
app.use('/api/admin/donations', require('./routes/Admin/Admin_Donations'));
app.use('/api/appointment', require('./routes/Admin/Admin_Appointments'));
app.use('/api/admin/notifications', require('./routes/Admin/Admin_Notifications'));
app.use('/api/admin/permission', require('./routes/Admin/Admin_Permission'));
app.use('/api/admin', require('./routes/Admin/Admin_Messages'));
app.use('/api/admin/audit-logs', require('./routes/Admin/Admin_AuditLogs'));
app.use('/api/chatbot', require('./routes/chatbot'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  
  // Handle specific OpenAI errors
  if (err.name === 'OpenAIError') {
    return res.status(500).json({
      error: 'AI Service Error',
      message: process.env.NODE_ENV === 'development' ? err.message : 'Service temporarily unavailable'
    });
  }

  // Handle other errors
  res.status(err.status || 500).json({
    error: 'Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});
