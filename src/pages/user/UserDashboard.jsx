import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { 
  User as UserIcon, 
  Mail, 
  Phone, 
  Calendar, 
  Activity, 
  Droplet, 
  Clock,
  Bell,
  Info,
  AlertCircle,
  CheckCircle,
  Calendar as CalendarIcon,
  Dna
} from 'lucide-react';
import NotificationDisplay from '../../components/common/NotificationDisplay';

const formatPhoneNumber = (phone) => {
  if (!phone) return 'Not specified';
  
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Format as 000-000 0000
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return `${match[1]}-${match[2]} ${match[3]}`;
  }
  return phone;
};

const capitalizeFirstLetter = (string) => {
  if (!string) return 'Not specified';
  return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
};

// Helper function to get token from either storage location
const getAuthToken = () => {
  return sessionStorage.getItem('token') || localStorage.getItem('token');
};

const UserDashboard = () => {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState(null);
  const [donations, setDonations] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');
  const [error, setError] = useState('');
  const [notificationsPerPage, setNotificationsPerPage] = useState(5);
  const [notificationsPage, setNotificationsPage] = useState(1);
  const [donationsPerPage, setDonationsPerPage] = useState(5);
  const [donationsPage, setDonationsPage] = useState(1);
  const [completedReservations, setCompletedReservations] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [isMarkAllModalOpen, setIsMarkAllModalOpen] = useState(false);

  const filterNotifications = (notifications) => {
    if (activeFilter === 'all') return notifications;
    return notifications.filter(notification => 
      notification.type.toLowerCase() === activeFilter.toLowerCase()
    );
  };
  
  const getFilterCount = (type) => {
    if (type === 'all') return notifications.length;
    return notifications.filter(n => n.type.toLowerCase() === type.toLowerCase()).length;
  };

  const markNotificationAsRead = async (notificationId) => {
    try {
      const token = getAuthToken();
      const response = await fetch(`http://localhost:5000/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
  
      if (response.ok) {
        // Update notifications in state
        setNotifications(notifications.map(notification =>
          notification.id === notificationId
            ? { ...notification, is_read: true }
            : notification
        ));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };
  
  const markAllNotificationsAsRead = async () => {
    try {
      const token = getAuthToken();
      const response = await fetch('http://localhost:5000/api/notifications/read-all', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
  
      if (response.ok) {
        // Update all notifications in state
        setNotifications(notifications.map(notification => ({
          ...notification,
          is_read: true
        })));
        setIsMarkAllModalOpen(false);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };
  

  // Add this helper function
  const getPaginatedData = (data, page, perPage) => {
    const startIndex = (page - 1) * perPage;
    return data.slice(startIndex, startIndex + perPage);
  };

  useEffect(() => { 
    fetchUserData();
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const token = getAuthToken();
      const response = await fetch('http://localhost:5000/api/notifications', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setNotifications(data.data);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const fetchUserData = async () => {
    try {
      const token = getAuthToken();
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
  
      // Add campaign reservations fetch
      const [profileResponse, donationsResponse, notificationsResponse, reservationsResponse] = await Promise.all([
        fetch('http://localhost:5000/api/user/profile', { headers }),
        fetch('http://localhost:5000/api/user/donations', { headers }),
        fetch('http://localhost:5000/api/notifications', { headers }),
        fetch('http://localhost:5000/api/user/reservation', { headers })
      ]);
  
      // Process all responses
      const profileData = await profileResponse.json();
      const donationsData = await donationsResponse.json();
      const notificationsData = await notificationsResponse.json();
      const reservationsData = await reservationsResponse.json();
  
      if (profileData.success) {
        setUserProfile(profileData.data);
      }
  
      if (donationsData.success) {
        setDonations(donationsData.data || []);
      }
  
      if (notificationsData.success) {
        setNotifications(notificationsData.data || []);
      }
  
      if (reservationsData.success) {
        // Filter for completed donations only
        const completed = reservationsData.data.filter(r => 
          r.donation_completed && r.donation_completed_date);
        setCompletedReservations(completed);
      }
  
    } catch (error) {
      console.error('Error fetching user data:', error);
      setError('Failed to load user data');
    } finally {
      setLoading(false);
    }
  };
  
  const calculateNextEligibleDate = () => {
    // Get completed reservations with next eligible date
    const nextEligibleReservation = completedReservations
      .filter(r => r.next_eligible_date)
      .sort((a, b) => new Date(b.next_eligible_date) - new Date(a.next_eligible_date))[0];

    if (!nextEligibleReservation) return 'Eligible now';
    
    const nextEligible = new Date(nextEligibleReservation.next_eligible_date);
    
    if (nextEligible < new Date()) {
      return 'Eligible now';
    }
    
    return nextEligible.toLocaleDateString();
  };

  const getLastDonationDate = () => {
    if (!donations.length && !completedReservations.length) return 'No donations yet';
    
    const dates = [];
    
    // Add donation dates
    donations.forEach(d => {
      if (d.donation_date) {
        dates.push(new Date(d.donation_date));
      }
    });
  
    // Add completed reservation dates
    completedReservations.forEach(r => {
      if (r.donation_completed && r.donation_completed_date) {
        dates.push(new Date(r.donation_completed_date));
      }
    });
  
    if (dates.length === 0) return 'No donations yet';
    
    // Get the most recent date
    const mostRecentDate = new Date(Math.max(...dates));
    return mostRecentDate.toLocaleDateString();
  };

  const stats = [
    {
      icon: <Droplet className="h-6 w-6 text-red-600" />,
      label: 'Blood Type',
      value: userProfile?.blood_type || 'Not specified'
    },
    {
      icon: <Activity className="h-6 w-6 text-red-600" />,
      label: 'Total Donations',
      value: donations.length
    },
    {
      icon: <Calendar className="h-6 w-6 text-red-600" />,
      label: 'Last Donation',
      value: getLastDonationDate()
    },
    {
      icon: <Clock className="h-6 w-6 text-red-600" />,
      label: 'Next Eligible Date',
      value: calculateNextEligibleDate()
    }
  ];

  const StatsCard = ({ icon: Icon, label, value }) => (
    <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center">
          <Icon className="h-6 w-6 text-red-600" />
        </div>
      </div>
    </div>
  );

  const renderProfile = () => (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-8">
        <div className="flex items-center space-x-4">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center">
            <UserIcon className="h-10 w-10 text-red-600" />
          </div>
          <div className="text-white">
            <h3 className="text-2xl font-bold">{user?.name}</h3>
            <p className="text-red-100">Donor ID: {user?.id}</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                <Mail className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium text-gray-900">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                <Phone className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-medium text-gray-900">{formatPhoneNumber(user?.phone)}</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                <CalendarIcon className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Date of Birth</p>
                <p className="font-medium text-gray-900">
                  {userProfile?.date_of_birth ? 
                    new Date(userProfile.date_of_birth).toLocaleDateString() : 
                    'Not specified'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                <Dna className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Gender</p>
                <p className="font-medium text-gray-900">
                  {capitalizeFirstLetter(userProfile?.gender)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Enhanced Donation History
  const renderDonationHistory = () => (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex justify-end">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Show</span>
          <select
            value={donationsPerPage}
            onChange={(e) => {
              setDonationsPerPage(Number(e.target.value));
              setDonationsPage(1);
            }}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-red-500 focus:border-red-500"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
          </select>
          <span className="text-sm text-gray-600">entries</span>
        </div>
      </div>

      {donations.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center shadow-sm">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Activity className="h-8 w-8 text-red-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Donations Yet</h3>
          <p className="text-gray-500">Start your journey as a blood donor today.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {getPaginatedData(donations, donationsPage, donationsPerPage).map((donation) => (
            <div key={donation.id} className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <Droplet className="h-5 w-5 text-red-600" />
                    <h4 className="font-medium text-gray-900">Donation #{donation.id}</h4>
                  </div>
                  <p className="text-sm text-gray-600">{donation.quantity_ml}ml donated</p>
                  <p className="text-sm text-gray-600">Blood Type: {donation.blood_type}</p>
                </div>
                <div className="text-right">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
                    ${donation.status === 'Completed' ? 'bg-green-100 text-green-800' : 
                      donation.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-red-100 text-red-800'}`}>
                    {donation.status}
                  </span>
                  <p className="text-sm text-gray-500 mt-2">
                    {new Date(donation.donation_date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {donations.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6">
          <p className="text-sm text-gray-600">
            Showing {((donationsPage - 1) * donationsPerPage) + 1} to {Math.min(donationsPage * donationsPerPage, donations.length)} of {donations.length} entries
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setDonationsPage(prev => Math.max(prev - 1, 1))}
              disabled={donationsPage === 1}
              className="px-4 py-2 border rounded-lg text-sm transition-colors
                disabled:opacity-50 disabled:cursor-not-allowed
                hover:bg-gray-50"
            >
              Previous
            </button>
            {Array.from({ length: Math.ceil(donations.length / donationsPerPage) }).map((_, idx) => (
              <button
                key={idx}
                onClick={() => setDonationsPage(idx + 1)}
                className={`px-4 py-2 border rounded-lg text-sm transition-colors
                  ${donationsPage === idx + 1 
                    ? 'bg-red-600 text-white border-red-600' 
                    : 'hover:bg-gray-50'}`}
              >
                {idx + 1}
              </button>
            ))}
            <button
              onClick={() => setDonationsPage(prev => 
                Math.min(prev + 1, Math.ceil(donations.length / donationsPerPage))
              )}
              disabled={donationsPage === Math.ceil(donations.length / donationsPerPage)}
              className="px-4 py-2 border rounded-lg text-sm transition-colors
                disabled:opacity-50 disabled:cursor-not-allowed
                hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
  
  const renderNotifications = () => (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-lg shadow">
        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-2">
          {[
            { type: 'all', label: 'All', icon: Bell },
            { type: 'info', label: 'Info', icon: Info },
            { type: 'success', label: 'Success', icon: CheckCircle },
            { type: 'alert', label: 'Alert', icon: AlertCircle }
          ].map(({ type, label, icon: Icon }) => (
            <button
              key={type}
              onClick={() => setActiveFilter(type)}
              className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition-colors
                ${activeFilter === type
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
            >
              <Icon className="h-4 w-4 mr-1.5" />
              {label} ({getFilterCount(type)})
            </button>
          ))}
        </div>
  
        {/* Actions */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsMarkAllModalOpen(true)}
            className="text-sm text-gray-600 hover:text-red-600"
            disabled={notifications.every(n => n.is_read)}
          >
            Mark all as read
          </button>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Show</span>
            <select
              value={notificationsPerPage}
              onChange={(e) => {
                setNotificationsPerPage(Number(e.target.value));
                setNotificationsPage(1);
              }}
              className="border border-gray-300 rounded px-2 py-1 text-sm"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
            </select>
            <span className="text-sm text-gray-600">entries</span>
          </div>
        </div>
      </div>
  
      {notifications.length === 0 ? (
        <div className="text-center py-8 bg-white rounded-lg shadow">
          <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No notifications yet</p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {getPaginatedData(filterNotifications(notifications), notificationsPage, notificationsPerPage)
              .map((notification) => (
                <div 
                  key={notification.id}
                  className={`bg-white rounded-lg shadow p-4 ${
                    !notification.is_read ? 'border-l-4 border-red-500' : ''
                  }`}
                  onClick={() => !notification.is_read && markNotificationAsRead(notification.id)}
                >
                  <NotificationDisplay notification={notification} />
                </div>
              ))}
          </div>
  
          {/* Pagination info and controls */}
          <div className="mt-4 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-600">
              Showing {((notificationsPage - 1) * notificationsPerPage) + 1} to{' '}
              {Math.min(notificationsPage * notificationsPerPage, filterNotifications(notifications).length)} of{' '}
              {filterNotifications(notifications).length} entries
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setNotificationsPage(prev => Math.max(prev - 1, 1))}
                disabled={notificationsPage === 1}
                className="px-3 py-1 border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              {Array.from({ 
                length: Math.ceil(filterNotifications(notifications).length / notificationsPerPage) 
              }).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setNotificationsPage(idx + 1)}
                  className={`px-3 py-1 border rounded text-sm ${
                    notificationsPage === idx + 1 ? 'bg-red-600 text-white' : 'hover:bg-gray-50'
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
              <button
                onClick={() => setNotificationsPage(prev => 
                  Math.min(prev + 1, Math.ceil(filterNotifications(notifications).length / notificationsPerPage))
                )}
                disabled={notificationsPage === Math.ceil(filterNotifications(notifications).length / notificationsPerPage)}
                className="px-3 py-1 border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
  
      {/* Mark All as Read Confirmation Modal */}
      {isMarkAllModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Mark All as Read
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to mark all notifications as read?
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setIsMarkAllModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={markAllNotificationsAsRead}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: Droplet, label: "Blood Type", value: userProfile?.blood_type || "Not specified" },
            { icon: Activity, label: "Total Donations", value: donations.length },
            { icon: Calendar, label: "Last Donation", value: getLastDonationDate() },
            { icon: Clock, label: "Next Eligible Date", value: calculateNextEligibleDate() }
          ].map((stat, index) => (
            <StatsCard key={index} {...stat} />
          ))}
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'profile', label: 'Profile', icon: UserIcon },
              { id: 'notifications', label: 'Notifications', icon: Bell, badge: notifications.filter(n => !n.is_read).length },
              { id: 'history', label: 'Donation History', icon: Activity }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors
                  ${activeTab === tab.id
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                <tab.icon className="h-5 w-5 mr-2" />
                {tab.label}
                {tab.badge > 0 && (
                  <span className="ml-2 bg-red-100 text-red-600 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div>
          {activeTab === 'profile' && renderProfile()}
          {activeTab === 'notifications' && renderNotifications()}
          {activeTab === 'history' && renderDonationHistory()}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default UserDashboard;