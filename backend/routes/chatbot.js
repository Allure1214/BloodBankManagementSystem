// backend/routes/chatbot.js
const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const authMiddleware = require('../middleware/auth');

// Knowledge base for common donor inquiries
const knowledgeBase = {
  eligibility: {
    keywords: ['eligible', 'eligibility', 'qualify', 'can i donate', 'requirements', 'age', 'weight', 'health'],
    responses: [
      "To donate blood, you must be at least 17 years old (16 with parental consent), weigh at least 110 pounds, and be in good health. You should not have any cold, flu, or other illness symptoms.",
      "Common eligibility requirements include: being 17+ years old, weighing 110+ pounds, feeling well and healthy, not having donated in the last 56 days, and not having certain medical conditions or recent travel to high-risk areas.",
      "You can check your eligibility by visiting our eligibility checker or speaking with our staff. Some conditions like diabetes, high blood pressure, or heart disease may require medical clearance."
    ]
  },
  appointment: {
    keywords: ['appointment', 'schedule', 'book', 'reserve', 'when', 'time', 'available'],
    responses: [
      "You can schedule an appointment by visiting our campaigns page or calling us directly. We have multiple time slots available throughout the week.",
      "To book an appointment, you can use our online booking system or contact us at our main number. We recommend booking in advance to secure your preferred time slot.",
      "Appointments are available Monday through Saturday. You can schedule up to 2 weeks in advance through our website or by calling us."
    ]
  },
  location: {
    keywords: ['location', 'where', 'address', 'find', 'nearby', 'blood bank', 'center'],
    responses: [
      "You can find our blood bank locations using our Blood Bank Directory. We have multiple locations throughout the region for your convenience.",
      "Our main blood bank is located in the city center, and we have mobile units that visit different areas regularly. Check our directory for the nearest location to you.",
      "You can use our interactive map to find the closest blood bank to your location. We also provide driving directions and contact information for each location."
    ]
  },
  preparation: {
    keywords: ['prepare', 'before', 'what to do', 'eat', 'drink', 'bring', 'id'],
    responses: [
      "Before donating, make sure to eat a healthy meal and drink plenty of water. Bring a valid photo ID and any medications you're currently taking.",
      "Preparation tips: eat iron-rich foods, drink extra water, get a good night's sleep, and bring a list of medications. Avoid alcohol 24 hours before donation.",
      "On donation day: eat a healthy breakfast, drink plenty of fluids, bring photo ID, and wear comfortable clothing with sleeves that can be rolled up."
    ]
  },
  after_donation: {
    keywords: ['after', 'recovery', 'rest', 'when can i donate again', 'next time'],
    responses: [
      "After donating, rest for 10-15 minutes, drink extra fluids, avoid heavy lifting for 24 hours, and eat iron-rich foods. You can donate again in 56 days.",
      "Post-donation care: keep the bandage on for 4 hours, avoid alcohol for 24 hours, drink extra fluids, and avoid strenuous exercise for the rest of the day.",
      "You can donate blood every 56 days (8 weeks). Your body needs this time to replenish the blood you donated."
    ]
  },
  blood_types: {
    keywords: ['blood type', 'compatible', 'universal', 'o negative', 'ab positive'],
    responses: [
      "Blood types are A+, A-, B+, B-, AB+, AB-, O+, and O-. O- is the universal donor, while AB+ is the universal recipient.",
      "Your blood type determines who you can donate to and receive from. O- blood can be given to anyone, while AB+ can receive from any blood type.",
      "We test your blood type during your first donation. Knowing your blood type helps us match you with patients who need your specific type."
    ]
  },
  safety: {
    keywords: ['safe', 'sterile', 'clean', 'infection', 'disease', 'hiv', 'hepatitis'],
    responses: [
      "Blood donation is very safe. We use sterile, single-use equipment for each donation and follow strict safety protocols to prevent any risk of infection.",
      "All equipment is sterile and disposable. We screen all donors for infectious diseases and test all donated blood before it's used.",
      "Safety is our top priority. We follow FDA guidelines and use only sterile, single-use equipment. All donated blood is tested for infectious diseases."
    ]
  },
  general: {
    keywords: ['help', 'information', 'question', 'donate', 'blood'],
    responses: [
      "I'm here to help with your blood donation questions! You can ask me about eligibility, appointments, locations, preparation, or any other donation-related topics.",
      "Welcome to our blood donation assistant! I can help you with information about donating blood, scheduling appointments, finding locations, and more.",
      "How can I help you today? I can provide information about blood donation, help you find locations, or answer questions about the donation process."
    ]
  }
};

// Intent recognition function
function recognizeIntent(message) {
  const lowerMessage = message.toLowerCase();
  
  // Check each category for keyword matches
  for (const [category, data] of Object.entries(knowledgeBase)) {
    const hasKeyword = data.keywords.some(keyword => lowerMessage.includes(keyword));
    if (hasKeyword) {
      return category;
    }
  }
  
  return 'general';
}

// Get appropriate response
function getResponse(intent, userMessage = '') {
  const responses = knowledgeBase[intent]?.responses || knowledgeBase.general.responses;
  
  // For appointment-related queries, provide more specific help
  if (intent === 'appointment' && userMessage.toLowerCase().includes('urgent')) {
    return "For urgent blood needs, please call our emergency line immediately. We can arrange for emergency donations and direct you to the nearest available location.";
  }
  
  // For location queries, provide map link
  if (intent === 'location') {
    return responses[Math.floor(Math.random() * responses.length)] + " You can also use our interactive map at /directory to find the nearest location.";
  }
  
  // Return random response from the category
  return responses[Math.floor(Math.random() * responses.length)];
}

// Store chat history
async function storeChatHistory(userId, message, response, intent) {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.query(
      `INSERT INTO chatbot_conversations (user_id, user_message, bot_response, intent, created_at) 
       VALUES (?, ?, ?, ?, NOW())`,
      [userId, message, response, intent]
    );
  } catch (error) {
    console.error('Error storing chat history:', error);
  } finally {
    if (connection) connection.release();
  }
}

// Get user's donation history for personalized responses
async function getUserDonationInfo(userId) {
  let connection;
  try {
    connection = await pool.getConnection();
    const [donations] = await connection.query(
      `SELECT COUNT(*) as donation_count, MAX(donation_date) as last_donation 
       FROM donations WHERE donor_id = ?`,
      [userId]
    );
    return donations[0] || { donation_count: 0, last_donation: null };
  } catch (error) {
    console.error('Error getting user donation info:', error);
    return { donation_count: 0, last_donation: null };
  } finally {
    if (connection) connection.release();
  }
}

// Chat endpoint - works for both authenticated and non-authenticated users
router.post('/chat', async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.user?.id || null; // Optional user ID
    
    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Message cannot be empty'
      });
    }
    
    // Recognize intent
    const intent = recognizeIntent(message);
    
    // Get base response
    let response = getResponse(intent, message);
    
    // Personalize response based on user's donation history (only if logged in)
    let userInfo = { donation_count: 0, last_donation: null };
    if (userId) {
      userInfo = await getUserDonationInfo(userId);
      
      if (intent === 'appointment' && userInfo.donation_count > 0) {
        const lastDonation = new Date(userInfo.last_donation);
        const daysSinceLastDonation = Math.floor((new Date() - lastDonation) / (1000 * 60 * 60 * 24));
        
        if (daysSinceLastDonation < 56) {
          response = `Thank you for your previous donations! You've donated ${userInfo.donation_count} times. You can donate again in ${56 - daysSinceLastDonation} days. In the meantime, you can help by encouraging others to donate!`;
        } else {
          response = `Great to see you again! You've donated ${userInfo.donation_count} times. You're eligible to donate again. Would you like me to help you find an appointment?`;
        }
      }
      
      // Store conversation only if user is logged in
      await storeChatHistory(userId, message, response, intent);
    } else {
      // For non-authenticated users, add a note about benefits of logging in
      if (intent === 'appointment') {
        response += "\n\n💡 Tip: Create an account to easily schedule appointments and track your donation history!";
      }
    }
    
    res.json({
      success: true,
      response: response,
      intent: intent,
      userInfo: {
        donationCount: userInfo.donation_count,
        lastDonation: userInfo.last_donation
      }
    });
    
  } catch (error) {
    console.error('Chatbot error:', error);
    res.status(500).json({
      success: false,
      message: 'Sorry, I encountered an error. Please try again.'
    });
  }
});

// Get chat history
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20, offset = 0 } = req.query;
    
    let connection;
    try {
      connection = await pool.getConnection();
      const [conversations] = await connection.query(
        `SELECT user_message, bot_response, intent, created_at 
         FROM chatbot_conversations 
         WHERE user_id = ? 
         ORDER BY created_at DESC 
         LIMIT ? OFFSET ?`,
        [userId, parseInt(limit), parseInt(offset)]
      );
      
      res.json({
        success: true,
        conversations: conversations.reverse() // Return in chronological order
      });
    } finally {
      if (connection) connection.release();
    }
    
  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch chat history'
    });
  }
});

// Get quick actions/suggestions - works for both authenticated and non-authenticated users
router.get('/suggestions', async (req, res) => {
  try {
    const userId = req.user?.id || null;
    const userInfo = userId ? await getUserDonationInfo(userId) : { donation_count: 0, last_donation: null };
    
    const suggestions = [
      { text: "Am I eligible to donate blood?", intent: "eligibility" },
      { text: "How do I schedule an appointment?", intent: "appointment" },
      { text: "Where is the nearest blood bank?", intent: "location" },
      { text: "What should I do before donating?", intent: "preparation" }
    ];
    
    // Add personalized suggestions based on user history
    if (userInfo.donation_count === 0) {
      suggestions.unshift({ text: "I'm new to blood donation. What should I know?", intent: "general" });
    } else if (userInfo.donation_count > 0) {
      const lastDonation = new Date(userInfo.last_donation);
      const daysSinceLastDonation = Math.floor((new Date() - lastDonation) / (1000 * 60 * 60 * 24));
      
      if (daysSinceLastDonation >= 56) {
        suggestions.unshift({ text: "I'm ready to donate again. Find me an appointment.", intent: "appointment" });
      } else {
        suggestions.unshift({ text: "When can I donate again?", intent: "after_donation" });
      }
    }
    
    res.json({
      success: true,
      suggestions: suggestions.slice(0, 6) // Limit to 6 suggestions
    });
    
  } catch (error) {
    console.error('Error fetching suggestions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch suggestions'
    });
  }
});

// Admin endpoint to get chatbot analytics
router.get('/analytics', authMiddleware, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Admin only'
      });
    }
    
    let connection;
    try {
      connection = await pool.getConnection();
      
      // Get conversation statistics
      const [stats] = await connection.query(`
        SELECT 
          COUNT(*) as total_conversations,
          COUNT(DISTINCT user_id) as unique_users,
          DATE(created_at) as date,
          intent,
          COUNT(*) as count
        FROM chatbot_conversations 
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        GROUP BY DATE(created_at), intent
        ORDER BY date DESC
      `);
      
      // Get most common intents
      const [intents] = await connection.query(`
        SELECT intent, COUNT(*) as count
        FROM chatbot_conversations 
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        GROUP BY intent
        ORDER BY count DESC
      `);
      
      res.json({
        success: true,
        data: {
          stats,
          intents,
          totalConversations: stats.reduce((sum, stat) => sum + stat.count, 0),
          uniqueUsers: new Set(stats.map(stat => stat.user_id)).size
        }
      });
    } finally {
      if (connection) connection.release();
    }
    
  } catch (error) {
    console.error('Error fetching chatbot analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics'
    });
  }
});

module.exports = router;
