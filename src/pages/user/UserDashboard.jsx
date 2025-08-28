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
  Dna,
  TrendingUp,
  TrendingDown,
  Plus,
  Heart
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
  const [tabTransition, setTabTransition] = useState(false);

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

  const handleTabChange = (tabId) => {
    setTabTransition(true);
    setTimeout(() => {
      setActiveTab(tabId);
      setTabTransition(false);
    }, 150);
  };

  // Enhanced Stats Card with better visual design
  const StatsCard = ({ icon: Icon, label, value, trend, subtitle, color = "red" }) => {
    const colorClasses = {
      red: "text-red-600 bg-red-50",
      blue: "text-blue-600 bg-blue-50",
      green: "text-green-600 bg-green-50",
      purple: "text-purple-600 bg-purple-50"
    };

    return (
      <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className={`w-12 h-12 ${colorClasses[color]} rounded-xl flex items-center justify-center`}>
            <Icon className="h-6 w-6" />
          </div>
          {trend && (
            <div className={`flex items-center text-sm ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend > 0 ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
              {Math.abs(trend)}%
            </div>
          )}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
        </div>
      </div>
    );
  };

  // Skeleton Loading Component
  const SkeletonLoader = () => (
    <div className="space-y-8 animate-pulse">
      {/* Stats Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-20"></div>
              <div className="h-8 bg-gray-200 rounded w-24"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs Skeleton */}
      <div className="border-b border-gray-200">
        <div className="flex space-x-8">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-12 w-24 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="bg-white rounded-xl p-8">
        <div className="space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    </div>
  );

  // Enhanced Empty State Component
  const EmptyState = ({ icon: Icon, title, description, action, actionLabel }) => (
    <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-100">
      <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
        <Icon className="h-10 w-10 text-gray-400" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-3">{title}</h3>
      <p className="text-gray-500 mb-6 max-w-md mx-auto">{description}</p>
      {action && actionLabel && (
        <button
          onClick={action}
          className="inline-flex items-center px-6 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors duration-200"
        >
          <Plus className="h-5 w-5 mr-2" />
          {actionLabel}
        </button>
      )}
    </div>
  );

  const renderProfile = () => (
    <div className={`transition-opacity duration-300 ${tabTransition ? 'opacity-0' : 'opacity-100'}`}>
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
        <div className="bg-gradient-to-r from-red-500 via-red-600 to-red-700 px-6 py-10 relative overflow-hidden">
          <div className="absolute inset-0 bg-black opacity-10"></div>
          <div className="relative flex items-center space-x-6">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg">
              <UserIcon className="h-12 w-12 text-red-600" />
            </div>
            <div className="text-white">
              <h3 className="text-3xl font-bold mb-2">{user?.name}</h3>
              <p className="text-red-100 text-lg">Donor ID: {user?.id}</p>
              <div className="flex items-center mt-2">
                <Heart className="h-5 w-5 text-red-200 mr-2" />
                <span className="text-red-100">Lifesaving Hero</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center">
                  <Mail className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Email</p>
                  <p className="font-semibold text-gray-900">{user?.email}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center">
                  <Phone className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Phone</p>
                  <p className="font-semibold text-gray-900">{formatPhoneNumber(user?.phone)}</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center">
                  <CalendarIcon className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Date of Birth</p>
                  <p className="font-semibold text-gray-900">
                    {userProfile?.date_of_birth ? 
                      new Date(userProfile.date_of_birth).toLocaleDateString() : 
                      'Not specified'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center">
                  <Dna className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Gender</p>
                  <p className="font-semibold text-gray-900">
                    {capitalizeFirstLetter(userProfile?.gender)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Enhanced Donation History
  const renderDonationHistory = () => (
    <div className={`transition-opacity duration-300 ${tabTransition ? 'opacity-0' : 'opacity-100'}`}>
      <div className="space-y-6">
        {/* Enhanced Controls */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <h3 className="text-lg font-semibold text-gray-900">Donation Records</h3>
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-600">Show</span>
              <select
                value={donationsPerPage}
                onChange={(e) => {
                  setDonationsPerPage(Number(e.target.value));
                  setDonationsPage(1);
                }}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
              </select>
              <span className="text-sm text-gray-600">entries</span>
            </div>
          </div>
        </div>

        {donations.length === 0 ? (
          <EmptyState
            icon={Activity}
            title="No Donations Yet"
            description="Start your journey as a blood donor today. Your first donation could save up to 3 lives!"
            action={() => window.location.href = '/donate'}
            actionLabel="Schedule Donation"
          />
        ) : (
          <div className="grid gap-4">
            {getPaginatedData(donations, donationsPage, donationsPerPage).map((donation) => (
              <div key={donation.id} className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 hover:border-gray-200">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                        <Droplet className="h-5 w-5 text-red-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Donation #{donation.id}</h4>
                        <p className="text-sm text-gray-600">{donation.quantity_ml}ml donated</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span>Blood Type: <span className="font-medium">{donation.blood_type}</span></span>
                      <span>•</span>
                      <span>{new Date(donation.donation_date).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium
                      ${donation.status === 'Completed' ? 'bg-green-100 text-green-800 border border-green-200' : 
                        donation.status === 'Pending' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' : 
                        'bg-red-100 text-red-800 border border-red-200'}`}>
                      {donation.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Enhanced Pagination */}
        {donations.length > 0 && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <p className="text-sm text-gray-600">
                Showing {((donationsPage - 1) * donationsPerPage) + 1} to {Math.min(donationsPage * donationsPerPage, donations.length)} of {donations.length} entries
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setDonationsPage(prev => Math.max(prev - 1, 1))}
                  disabled={donationsPage === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm transition-all duration-200
                    disabled:opacity-50 disabled:cursor-not-allowed
                    hover:bg-gray-50 hover:border-gray-400 active:bg-gray-100"
                >
                  Previous
                </button>
                {Array.from({ length: Math.ceil(donations.length / donationsPerPage) }).map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setDonationsPage(idx + 1)}
                    className={`px-4 py-2 border rounded-lg text-sm transition-all duration-200
                      ${donationsPage === idx + 1 
                        ? 'bg-red-600 text-white border-red-600 shadow-md' 
                        : 'border-gray-300 hover:bg-gray-50 hover:border-gray-400 active:bg-gray-100'}`}
                  >
                    {idx + 1}
                  </button>
                ))}
                <button
                  onClick={() => setDonationsPage(prev => 
                    Math.min(prev + 1, Math.ceil(donations.length / donationsPerPage))
                  )}
                  disabled={donationsPage === Math.ceil(donations.length / donationsPerPage)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm transition-all duration-200
                    disabled:opacity-50 disabled:cursor-not-allowed
                    hover:bg-gray-50 hover:border-gray-400 active:bg-gray-100"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
  
  const renderNotifications = () => (
    <div className={`transition-opacity duration-300 ${tabTransition ? 'opacity-0' : 'opacity-100'}`}>
      <div className="space-y-6">
        {/* Enhanced Controls */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            {/* Enhanced Filter Buttons */}
            <div className="flex flex-wrap gap-3">
              {[
                { type: 'all', label: 'All', icon: Bell, color: 'gray' },
                { type: 'info', label: 'Info', icon: Info, color: 'blue' },
                { type: 'success', label: 'Success', icon: CheckCircle, color: 'green' },
                { type: 'alert', label: 'Alert', icon: AlertCircle, color: 'red' }
              ].map(({ type, label, icon: Icon, color }) => {
                const colorClasses = {
                  gray: 'bg-gray-100 text-gray-600 hover:bg-gray-200',
                  blue: 'bg-blue-100 text-blue-600 hover:bg-blue-200',
                  green: 'bg-green-100 text-green-600 hover:bg-green-200',
                  red: 'bg-red-100 text-red-600 hover:bg-red-200'
                };
                
                return (
                  <button
                    key={type}
                    onClick={() => setActiveFilter(type)}
                    className={`inline-flex items-center px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                      ${activeFilter === type
                        ? 'bg-red-600 text-white shadow-md scale-105'
                        : `${colorClasses[color]} hover:scale-105`
                      }`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {label} ({getFilterCount(type)})
                  </button>
                );
              })}
            </div>
      
            {/* Enhanced Actions */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsMarkAllModalOpen(true)}
                className="text-sm text-gray-600 hover:text-red-600 transition-colors duration-200 font-medium"
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
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                </select>
                <span className="text-sm text-gray-600">entries</span>
              </div>
            </div>
          </div>
        </div>
    
        {notifications.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="No Notifications"
            description="You're all caught up! Check back later for updates about your donations and campaigns."
          />
        ) : (
          <>
            <div className="space-y-4">
              {getPaginatedData(filterNotifications(notifications), notificationsPage, notificationsPerPage)
                .map((notification) => (
                  <div 
                    key={notification.id}
                    className={`bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-all duration-200 cursor-pointer
                      ${!notification.is_read ? 'border-l-4 border-red-500 bg-red-50' : 'hover:border-gray-200'}`}
                    onClick={() => !notification.is_read && markNotificationAsRead(notification.id)}
                  >
                    <NotificationDisplay notification={notification} />
                  </div>
                ))}
            </div>
    
            {/* Enhanced Pagination */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <p className="text-sm text-gray-600">
                  Showing {((notificationsPage - 1) * notificationsPerPage) + 1} to{' '}
                  {Math.min(notificationsPage * notificationsPerPage, filterNotifications(notifications).length)} of{' '}
                  {filterNotifications(notifications).length} entries
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setNotificationsPage(prev => Math.max(prev - 1, 1))}
                    disabled={notificationsPage === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm transition-all duration-200
                      disabled:opacity-50 disabled:cursor-not-allowed
                      hover:bg-gray-50 hover:border-gray-400 active:bg-gray-100"
                  >
                    Previous
                  </button>
                  {Array.from({ 
                    length: Math.ceil(filterNotifications(notifications).length / notificationsPerPage) 
                  }).map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setNotificationsPage(idx + 1)}
                      className={`px-4 py-2 border rounded-lg text-sm transition-all duration-200
                        ${notificationsPage === idx + 1 
                          ? 'bg-red-600 text-white border-red-600 shadow-md' 
                          : 'border-gray-300 hover:bg-gray-50 hover:border-gray-400 active:bg-gray-100'
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
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm transition-all duration-200
                      disabled:opacity-50 disabled:cursor-not-allowed
                      hover:bg-gray-50 hover:border-gray-400 active:bg-gray-100"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
    
        {/* Enhanced Mark All as Read Confirmation Modal */}
        {isMarkAllModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-red-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Mark All as Read
                </h3>
                <p className="text-gray-600 mb-8">
                  Are you sure you want to mark all notifications as read? This action cannot be undone.
                </p>
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={() => setIsMarkAllModalOpen(false)}
                    className="px-6 py-3 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={markAllNotificationsAsRead}
                    className="px-6 py-3 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors duration-200 shadow-md"
                  >
                    Confirm
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <DashboardLayout>
        <SkeletonLoader />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Enhanced Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard 
            icon={Droplet} 
            label="Blood Type" 
            value={userProfile?.blood_type || "Not specified"}
            color="red"
          />
          <StatsCard 
            icon={Activity} 
            label="Total Donations" 
            value={donations.length}
            color="blue"
          />
          <StatsCard 
            icon={Calendar} 
            label="Last Donation" 
            value={getLastDonationDate()}
            color="green"
          />
          <StatsCard 
            icon={Clock} 
            label="Next Eligible Date" 
            value={calculateNextEligibleDate()}
            color="purple"
          />
        </div>

        {/* Enhanced Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="border-b border-gray-200 px-6">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'profile', label: 'Profile', icon: UserIcon },
                { id: 'notifications', label: 'Notifications', icon: Bell, badge: notifications.filter(n => !n.is_read).length },
                { id: 'history', label: 'Donation History', icon: Activity }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex items-center py-6 px-1 border-b-2 font-medium text-sm transition-all duration-200
                    ${activeTab === tab.id
                      ? 'border-red-500 text-red-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                  <tab.icon className="h-5 w-5 mr-2" />
                  {tab.label}
                  {tab.badge > 0 && (
                    <span className="ml-2 bg-red-100 text-red-600 text-xs font-semibold px-2.5 py-0.5 rounded-full animate-pulse">
                      {tab.badge}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Enhanced Content */}
          <div className="p-6">
            {activeTab === 'profile' && renderProfile()}
            {activeTab === 'notifications' && renderNotifications()}
            {activeTab === 'history' && renderDonationHistory()}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default UserDashboard;