const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const campaignRoutes = require('./routes/campaigns');
const dashboardRoutes = require('./routes/dashboard');
const messagesRoutes = require('./routes/messages');  
const authMiddleware = require('./middleware/auth');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({
  origin: 'http://localhost:3000', // Your frontend URL
  credentials: true
}));
app.use(express.json());

const bloodBankRoutes = require('./routes/bloodBank');
app.use('/api/blood-banks', bloodBankRoutes);

// Database connection
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
}).promise();

// Test database connection
db.connect()
  .then(() => console.log('Database connected successfully'))
  .catch(err => console.error('Database connection error:', err));

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend server is running' });
});

// Auth routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/campaigns', campaignRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/user', authMiddleware, require('./routes/user'));
console.log('JWT_SECRET status:', process.env.JWT_SECRET ? 'Set' : 'Not set');
app.use('/api/admin', require('./routes/Admin/Admin_Dashboard'));
app.use('/api/admin/users', require('./routes/Admin/Admin_Users'));
app.use('/api/admin', require('./routes/Admin/Admin_Inventory'));
app.use('/api/admin/campaigns', require('./routes/Admin/Admin_Campaigns'));
app.use('/api/admin/donations', require('./routes/Admin/Admin_Donations'));
app.use('/api/appointment', require('./routes/Admin/Admin_Appointments'));
app.use('/api/admin/notifications', require('./routes/Admin/Admin_Notifications'));
app.use('/api/admin/permission', require('./routes/Admin/Admin_Permission'));
app.use('/api/admin', require('./routes/Admin/Admin_Messages'));

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

