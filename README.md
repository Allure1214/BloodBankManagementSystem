# Blood Bank Management System 🩸

A comprehensive web-based Blood Bank Management System built with React and Node.js that helps connect blood donors with blood banks and manages blood donation campaigns.

**Version**: 1.0.2  
**Status**: Production Ready ✅

## Features 🌟

### For Users
- **User Registration & Authentication** 
  - Secure login/signup system
  - Password reset functionality
  - Role-based access control (Admin/User)

- **Blood Donation Management**
  - View upcoming donation campaigns
  - Schedule donation appointments
  - Track donation history
  - Receive notifications for donation opportunities

- **Blood Bank Directory**
  - Search blood banks by location
  - View real-time blood inventory
  - Check blood availability by type
  - Get directions to blood banks

### For Administrators
- **Dashboard Analytics**
  - Real-time blood inventory tracking
  - Donation statistics and trends
  - User activity monitoring
  - Interactive charts and visualizations

- **Campaign Management**
  - Create and manage donation campaigns
  - Track campaign performance
  - Manage appointment schedules
  - Interactive campaign maps

- **Inventory Management**
  - Track blood units by type
  - Monitor expiration dates
  - Manage blood bank locations
  - Automated inventory alerts

- **Advanced Features**
  - **Audit Trail System** - Complete activity logging and tracking
  - **Permission Management** - Granular role-based access control
  - **Messaging System** - Internal communication platform
  - **Notification Management** - Bulk notifications and alerts
  - **Advanced Reporting** - PDF and Excel export capabilities
  - **User Management** - Comprehensive user administration
  - **Email Integration** - Automated email notifications

## Tech Stack 💻

### Frontend
- React.js (v18.3.1)
- TailwindCSS
- React Query (@tanstack/react-query)
- React Router
- Lucide Icons
- Recharts
- React Leaflet (Interactive Maps)
- Google Maps API
- React Hook Form
- Yup (Validation)
- Headless UI
- Heroicons

### Backend
- Node.js
- Express.js
- MySQL (mysql2)
- JWT Authentication
- Bcrypt
- Nodemailer (Email notifications)
- OpenAI API (AI features)
- Express Rate Limiting
- CORS

### Additional Libraries
- jsPDF & jsPDF AutoTable (PDF generation)
- XLSX (Excel export)
- Leaflet (Interactive maps)

## Prerequisites 📋

Before running this project, make sure you have:

- Node.js (v16 or higher)
- MySQL (v8.0 or higher)
- npm or yarn package manager
- Google Maps API key (for map features)
- Email service credentials (for notifications)

## Installation 🚀

1. Clone the repository
```bash
git clone https://github.com/your-username/blood-bank-management.git
cd blood-bank-management
```

2. Install frontend dependencies
```bash
npm install
```

3. Install backend dependencies
```bash
cd backend
npm install
```

4. Set up environment variables
- Create `.env` in the root directory for frontend:
```env
VITE_API_URL=http://localhost:5000
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```
- Create `.env` in the backend directory:
```env
PORT=5000
DB_HOST=localhost
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=blood_bank_db
JWT_SECRET=your_jwt_secret
EMAIL_HOST=your_email_host
EMAIL_PORT=587
EMAIL_USER=your_email_user
EMAIL_PASS=your_email_password
OPENAI_API_KEY=your_openai_api_key
```

5. Initialize the database
```bash
cd backend
npm run init-db
```

6. Start the development servers
```bash
# In the root directory (frontend)
npm run dev

# In the backend directory
npm run dev
```

## Project Structure 📁

```
blood-bank-management/          
│   ├── src/                    # React frontend
│   │   ├── components/         # Reusable UI components
│   │   │   ├── auth/          # Authentication components
│   │   │   ├── common/        # Common UI components
│   │   │   ├── layout/        # Layout components
│   │   │   └── modules/       # Feature-specific modules
│   │   ├── pages/             # Page components
│   │   │   ├── admin/         # Admin dashboard pages
│   │   │   ├── user/          # User-facing pages
│   │   │   └── common/        # Shared pages
│   │   ├── context/           # React context providers
│   │   ├── api/               # API client configuration
│   │   ├── utils/             # Utility functions
│   │   └── styles/            # Global styles
│   ├── public/                # Static assets
│   ├── dist/                  # Production build
│   └── package.json           # Frontend dependencies
└── backend/                   # Node.js backend
    ├── config/                # Database configuration
    ├── routes/                # API routes
    │   ├── Admin/            # Admin-specific routes
    │   └── *.js              # General routes
    ├── middleware/            # Custom middleware
    │   ├── auth.js           # Authentication
    │   ├── auditLogger.js    # Audit trail logging
    │   ├── checkPermission.js # Permission checking
    │   └── errorHandler.js   # Error handling
    ├── scripts/               # Database scripts
    │   └── initDB.js         # Database initialization
    ├── server.js              # Main server file
    └── package.json           # Backend dependencies
```

## Screenshots & Demo 📸

### User Interface
- **Homepage**: Modern landing page with service overview
- **Blood Availability**: Real-time blood inventory search
- **Campaign Maps**: Interactive maps showing donation locations
- **User Dashboard**: Personal donation history and appointments

### Admin Interface
- **Admin Dashboard**: Comprehensive analytics and statistics
- **Inventory Management**: Blood stock tracking with expiration alerts
- **Campaign Management**: Create and manage donation campaigns
- **Audit Trail**: Complete activity logging and monitoring
- **Permission Management**: Granular role-based access control

### Key Features
- 📊 **Interactive Charts**: Real-time data visualization
- 🗺️ **Interactive Maps**: Location-based services
- 📱 **Responsive Design**: Mobile-friendly interface
- 🔐 **Secure Authentication**: JWT-based security
- 📧 **Email Notifications**: Automated communication
- 📄 **Export Capabilities**: PDF and Excel reports

## API Documentation 📚

The API documentation is available at:
- Development: `http://localhost:5000/api-docs`
- Production: `https://your-api-domain.com/api-docs`

## Contributing 🤝

1. Fork the repository
2. Create a new branch (`git checkout -b feature/improvement`)
3. Make your changes
4. Commit your changes (`git commit -am 'Add new feature'`)
5. Push to the branch (`git push origin feature/improvement`)
6. Create a Pull Request

## License 📄

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support 💬

For support, contact us at cyx.yongxian01@gmail.com or open an issue in the GitHub repository.

## Acknowledgements 🙏

- [React](https://reactjs.org/)
- [Node.js](https://nodejs.org/)
- [MySQL](https://www.mysql.com/)
- [Express](https://expressjs.com/)
- [TailwindCSS](https://tailwindcss.com/)
