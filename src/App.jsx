// src/App.jsx
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

//User Side
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import Home from './pages/user/Home.jsx';  
import BloodInventory from './pages/user/BloodDonationDashboard.jsx';
import Campaign from './pages/user/UpcomingCampaignMap';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, AdminRoute, SuperAdminRoute } from './components/auth/ProtectedRoute';
import Login from './pages/user/Login';
import UserDashboard from './pages/user/UserDashboard.jsx';
import Register from './pages/user/Register';
import BackToTop from './components/common/BackToTop';  
import ResetPassword from './pages/user/ResetPassword';
import BloodAvailability from './pages/user/BloodAvailability';
import BloodBankDirectory from './pages/user/BloodBankDirectory';
import SpecifyAvailable from './pages/user/SpecifyAvaiability';
import AboutUs from './pages/user/AboutUs';
import ContactUs from './pages/user/ContactUs';
import FAQs from './pages/user/FAQs';
import TermsOfService from './pages/user/TermOfService';
import PrivacyPolicy from './pages/user/PrivacyPolicy';
import DonationHistory from './pages/user/DonationHistory';
import Settings from './pages/user/Settings';
import './styles/index.css';
import Appointments from './pages/user/Appointment';
import ScrollToTop from './components/common/ScrollToTop';

//Admin Side
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import AdminDashboardLayout from './components/layout/AdminDashboardLayout';
import UserManagement from './pages/admin/UsersManagement';
import BloodInventoryManagement from './pages/admin/BloodInventoryManagement';
import BloodBanksManagement from './pages/admin/BloodBanksManagment';
import CampaignManagement from './pages/admin/CampaignManagement';
import DonationManagement from './pages/admin/DonationManagement';
import AppointmentManagement from './pages/admin/AppointmentManagement';
import NotificationManagement from './pages/admin/NotificationManagement';
import SettingsPage from './pages/admin/PermissionSetting.jsx';
import Reports from './pages/admin/Reports';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
      staleTime: 30000,
    },
  },
});

const Layout = ({ children }) => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <div className="min-h-full w-full flex flex-col">
      {!isAdminRoute && <Navbar />}
      <main className="flex-1 flex flex-col w-full">
        {children}
      </main>
      {!isAdminRoute && (
        <>
          <BackToTop />
          <Footer />
        </>
      )}
    </div>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
        <ScrollToTop /> 
          <div className="min-h-full w-full flex flex-col">
          <Layout>
            <main className="flex-1 flex flex-col w-full">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/dashboard" element={<BloodInventory />} />
                <Route path="/about" element={<AboutUs />} />
                <Route path="/FAQs" element={<FAQs />} />
                <Route path="/contact" element={<ContactUs />} />
                <Route path="/campaigns" element={<Campaign />} />
                <Route path="/login" element={<Login />} />
                <Route path="/specifyavailability" element={<SpecifyAvailable />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/bloodavailability" element={<BloodAvailability />} />
                <Route path="/directory" element={<BloodBankDirectory />} />
                <Route path="/terms" element={<TermsOfService />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/user/donations" element={<ProtectedRoute> <DonationHistory /></ProtectedRoute>} />
                <Route path="/user/appointments" element={<ProtectedRoute> <Appointments /></ProtectedRoute>} />
                <Route path="/user/settings" element={<ProtectedRoute> <Settings /></ProtectedRoute>} />
                <Route path="/user/dashboard" element={<ProtectedRoute> <UserDashboard /></ProtectedRoute>} />
                <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
                <Route path="/admin/users" element={<SuperAdminRoute><UserManagement /></SuperAdminRoute>} />
                <Route path="/admin/inventory" element={<AdminRoute requiredPermission="can_manage_inventory"><BloodInventoryManagement /></AdminRoute>} />
                <Route path="/admin/settings" element={<SuperAdminRoute><AdminDashboardLayout><SettingsPage /></AdminDashboardLayout></SuperAdminRoute>} />
                <Route path="/admin/campaigns" element={<AdminRoute requiredPermission="can_manage_campaigns"><CampaignManagement /></AdminRoute>} />
                <Route path="/admin/blood-banks" element={<AdminRoute requiredPermission="can_manage_blood_banks"><BloodBanksManagement /></AdminRoute>} />
                <Route path="/admin/donations" element={<AdminRoute requiredPermission="can_manage_donations"><DonationManagement /></AdminRoute>} />
                <Route path="/admin/appointments" element={<AdminRoute requiredPermission="can_manage_appointments"><AppointmentManagement /></AdminRoute>} />
                <Route path="/admin/notifications" element={<AdminRoute><NotificationManagement /></AdminRoute>} />
                <Route path="/admin/reports" element={<AdminRoute requiredPermission="can_manage_reports"><Reports /></AdminRoute>} />
                <Route path="/register" element={<Register />} />
              </Routes>
            </main>
            </Layout>
          </div>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;