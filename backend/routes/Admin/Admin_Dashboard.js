// backend/routes/admin/dashboard.js
const express = require('express');
const router = express.Router();
const pool = require('../../config/database');
const authMiddleware = require('../../middleware/auth');

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

// Get dashboard statistics
router.get('/dashboard', async (req, res) => {
  let connection;
  try {
    const { timeframe = 'month' } = req.query;
    connection = await pool.getConnection();

    // Define time period for queries
    let dateFilter;
    switch(timeframe) {
      case 'week':
        dateFilter = 'DATE_SUB(CURDATE(), INTERVAL 7 DAY)';
        break;
      case 'year':
        dateFilter = 'DATE_SUB(CURDATE(), INTERVAL 1 YEAR)';
        break;
      default: // month
        dateFilter = 'DATE_SUB(CURDATE(), INTERVAL 1 MONTH)';
    }

    // Donation Trends query based on timeframe
    const getDonationTrendsQuery = (timeframe) => {
      switch(timeframe) {
        case 'week':
          return `
            SELECT 
              DATE_FORMAT(d.date, '%a') as month,
              COALESCE(COUNT(donations.id), 0) as donations
            FROM (
              SELECT CURDATE() - INTERVAL (a.a) DAY as date
              FROM (
                SELECT 0 as a UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 
                UNION SELECT 4 UNION SELECT 5 UNION SELECT 6
              ) as a
            ) as d
            LEFT JOIN donations ON 
              DATE(donations.donation_date) = d.date AND
              donations.status = 'Completed'
            GROUP BY d.date
            ORDER BY d.date`;

            case 'year':
              return `
                SELECT 
                  YEAR(d.month_date) as month,
                  COALESCE(COUNT(donations.id), 0) as donations
                FROM (
                  SELECT DATE_SUB(CURDATE(), INTERVAL n YEAR) as month_date
                  FROM (
                    SELECT 0 as n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4
                  ) years
                ) d
                LEFT JOIN donations ON 
                  YEAR(donations.donation_date) = YEAR(d.month_date) AND
                  donations.status = 'Completed'
                GROUP BY YEAR(d.month_date)
                ORDER BY YEAR(d.month_date) ASC`;

        default: // month
          return `
            SELECT 
              DATE_FORMAT(d.month_date, '%b %Y') as month,
              COALESCE(COUNT(donations.id), 0) as donations
            FROM (
              SELECT DATE_SUB(CURDATE(), INTERVAL n MONTH) as month_date
              FROM (
                SELECT 0 as n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 
                UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 
                UNION SELECT 8 UNION SELECT 9 UNION SELECT 10 UNION SELECT 11
              ) months
            ) d
            LEFT JOIN donations ON 
              YEAR(donations.donation_date) = YEAR(d.month_date) AND 
              MONTH(donations.donation_date) = MONTH(d.month_date) AND
              donations.status = 'Completed'
            WHERE d.month_date >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
            GROUP BY d.month_date
            ORDER BY d.month_date ASC`;
      }
    };

    const getPreviousPeriodQuery = (timeframe) => {
      let currentPeriod, previousPeriod;
      
      switch(timeframe) {
        case 'week':
          currentPeriod = 'BETWEEN DATE_SUB(CURDATE(), INTERVAL 7 DAY) AND CURDATE()';
          previousPeriod = 'BETWEEN DATE_SUB(CURDATE(), INTERVAL 14 DAY) AND DATE_SUB(CURDATE(), INTERVAL 7 DAY)';
          break;
        case 'year':
          currentPeriod = 'BETWEEN DATE_SUB(CURDATE(), INTERVAL 1 YEAR) AND CURDATE()';
          previousPeriod = 'BETWEEN DATE_SUB(CURDATE(), INTERVAL 2 YEAR) AND DATE_SUB(CURDATE(), INTERVAL 1 YEAR)';
          break;
        default: // month
          return `
            SELECT 
              /* Previous month users */
              (SELECT COUNT(*) 
                FROM users 
                WHERE YEAR(created_at) = YEAR(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))
                AND MONTH(created_at) = MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))
                AND role = 'user') as prev_users,
              
              /* Previous month donations */
              (SELECT COUNT(*) 
                FROM donations 
                WHERE YEAR(donation_date) = YEAR(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))
                AND MONTH(donation_date) = MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))
                AND status = 'Completed') as prev_donations,
              
              /* Current month users */
              (SELECT COUNT(*) 
                FROM users 
                WHERE YEAR(created_at) = YEAR(CURDATE())
                AND MONTH(created_at) = MONTH(CURDATE())
                AND role = 'user') as current_users,
              
              /* Current month donations */
              (SELECT COUNT(*) 
                FROM donations 
                WHERE YEAR(donation_date) = YEAR(CURDATE())
                AND MONTH(donation_date) = MONTH(CURDATE())
                AND status = 'Completed') as current_donations
          `;
      }
    
      return `
        SELECT 
          (SELECT COUNT(*) FROM users WHERE created_at ${previousPeriod} AND role = 'user') as prev_users,
          (SELECT COUNT(*) FROM donations WHERE donation_date ${previousPeriod} AND status = 'Completed') as prev_donations,
          (SELECT COUNT(*) FROM users WHERE created_at ${currentPeriod} AND role = 'user') as current_users,
          (SELECT COUNT(*) FROM donations WHERE donation_date ${currentPeriod} AND status = 'Completed') as current_donations
      `;
    };

    // Run queries in parallel for better performance
    const [
      totalUsersResult,
      totalDonationsResult,
      bloodBanksResult,
      activeCampaignsResult,
      totalCampaignsResult,
      donationTrendsResult,
      bloodTypeDistributionResult,
      recentActivitiesResult,
      pendingAppointmentsResult,
      usersResult
    ] = await Promise.all([
      // Total Users
      connection.query(
        `SELECT COUNT(*) as total FROM users WHERE role = 'user'`
      ),

      // Total Donations
      connection.query(
        `SELECT COUNT(*) as total FROM donations WHERE status = 'Completed'`
      ),

      // Blood Banks
      connection.query(
        'SELECT COUNT(*) as total FROM blood_banks'
      ),

      // Active Campaigns
      connection.query(
        `SELECT COUNT(DISTINCT c.id) as total 
        FROM campaigns c 
        JOIN campaign_sessions cs ON c.id = cs.campaign_id 
        WHERE cs.date >= CURDATE() AND cs.status = 'scheduled'`
      ),

      // Total Campaigns (all campaigns in system)
      connection.query(
        `SELECT COUNT(*) as total FROM campaigns`
      ),

      // Donation Trends
      connection.query(getDonationTrendsQuery(timeframe)),

      // Blood Type Distribution from Current Inventory
      connection.query(
        `SELECT DISTINCT
          bi.blood_type as name,
          SUM(bi.units_available) as value
        FROM blood_inventory bi
        GROUP BY bi.blood_type
        ORDER BY CASE bi.blood_type
            WHEN 'O-' THEN 1
            WHEN 'O+' THEN 2
            WHEN 'AB-' THEN 3
            WHEN 'AB+' THEN 4
            WHEN 'B-' THEN 5
            WHEN 'B+' THEN 6
            WHEN 'A-' THEN 7
            WHEN 'A+' THEN 8
        END`
      ),

      // Recent Activities (Combining Donations and Campaign Reservations)
      connection.query(
        `SELECT 'donation' as type,
                d.id,
                CONCAT('Blood donation by ', u.name) as description,
                u.name as user,
                d.donation_date as date,
                d.status
        FROM donations d
        JOIN users u ON d.donor_id = u.id
        WHERE d.donation_date >= ${dateFilter}
        UNION ALL
        SELECT 'appointment' as type,
                cr.id,
                CONCAT('Appointment scheduled by ', u.name) as description,
                u.name as user,
                cr.created_at as date,
                cr.status
        FROM campaign_reservations cr
        JOIN users u ON cr.user_id = u.id
        WHERE cr.created_at >= ${dateFilter}
        ORDER BY date DESC`
      ),

      // Pending Appointments
      connection.query(
        `SELECT 
          cr.id,
          u.name as donorName,
          up.blood_type as bloodType,
          cr.session_date as date,
          cr.preferred_time as time,
          c.location as campaign_location
         FROM campaign_reservations cr
         JOIN users u ON cr.user_id = u.id
         JOIN user_profiles up ON u.id = up.user_id
         JOIN campaigns c ON cr.campaign_id = c.id
         WHERE cr.status = 'pending'
         ORDER BY cr.session_date, cr.preferred_time
         `
      ),

      // All Users for Growth Trends (only regular users, not admins)
      connection.query(
        `SELECT 
          id,
          name,
          email,
          role,
          status,
          created_at
         FROM users 
         WHERE role = 'user'
         ORDER BY created_at ASC`
      )
    ]);

    const [periodStats] = await connection.query(getPreviousPeriodQuery(timeframe));

    const calculateGrowth = (current, previous) => {
      // If there's no previous data, we can't calculate growth
      if (previous === 0) {
        // If current is also 0, return 0% growth
        if (current === 0) return 0;
        // If we went from 0 to something, return 100%
        return 100;
      }
      
      // Calculate percentage change
      const percentageChange = ((current - previous) / previous) * 100;
      
      // Cap the maximum percentage at ±100%
      if (percentageChange > 100) return 100;
      if (percentageChange < -100) return -100;
      
      return Math.round(percentageChange);
    };

    const currentStats = {
      users: totalUsersResult[0][0].total,
      donations: totalDonationsResult[0][0].total,
      bloodBanks: bloodBanksResult[0][0].total,
      activeCampaigns: activeCampaignsResult[0][0].total
    };

    const growth = {
      userGrowth: calculateGrowth(
        periodStats[0].current_users,
        periodStats[0].prev_users
      ),
      donationGrowth: calculateGrowth(
        periodStats[0].current_donations,
        periodStats[0].prev_donations
      )
    };

    res.json({
      success: true,
      data: {
        totalUsers: currentStats.users,
        totalDonations: currentStats.donations,
        totalBloodBanks: currentStats.bloodBanks,
        activeCampaigns: currentStats.activeCampaigns,
        totalCampaigns: totalCampaignsResult[0][0].total,
        userGrowth: growth.userGrowth,
        donationGrowth: growth.donationGrowth,
        donationTrends: donationTrendsResult[0],
        bloodTypeDistribution: bloodTypeDistributionResult[0],
        recentActivities: recentActivitiesResult[0],
        pendingAppointments: pendingAppointmentsResult[0],
        users: usersResult[0]
      }
    });

  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

module.exports = router;