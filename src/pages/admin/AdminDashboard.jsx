import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Building2,
  Calendar,
  Clock,
  Droplet,
  Check,
  X,
  Activity
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import AdminLayout from '../../components/layout/AdminDashboardLayout';

const TimeframeSelector = ({ value, onChange }) => (
  <div className="inline-flex rounded-lg border border-gray-200 bg-white shadow-sm">
    {['week', 'month', 'year'].map((period) => (
      <button
        key={period}
        onClick={() => onChange(period)}
        className={`px-4 py-2 text-sm font-medium first:rounded-l-lg last:rounded-r-lg
          transition-all duration-200
          ${value === period 
            ? 'bg-red-600 text-white shadow-inner' 
            : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
          }`}
      >
        {period.charAt(0).toUpperCase() + period.slice(1)}
      </button>
    ))}
  </div>
);

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDonations: 0,
    totalBloodBanks: 0,
    activeCampaigns: 0,
    userGrowth: 0,
    donationGrowth: 0,
    donationTrends: [],
    bloodTypeDistribution: [],
    recentActivities: [],
    pendingAppointments: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeframe, setTimeframe] = useState('month');
  const [appointmentsPerPage, setAppointmentsPerPage] = useState(5);
  const [activitiesPerPage, setActivitiesPerPage] = useState(5);
  const [appointmentsPage, setAppointmentsPage] = useState(1);
  const [activitiesPage, setActivitiesPage] = useState(1);
  const [activityType, setActivityType] = useState('appointments');

  const DonationTrendsChart = ({ data, timeframe }) => {
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  
    useEffect(() => {
      const handleResize = () => setWindowWidth(window.innerWidth);
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }, []);
  
    const getXAxisConfig = () => {
      const isMobile = windowWidth < 768;
      const config = {
        dataKey: "month",
        interval: isMobile ? 1 : 0,
        angle: isMobile ? 45 : 0,
        textAnchor: isMobile ? 'start' : 'middle',
        height: isMobile ? 60 : 30,
        tickFormatter: (value) => {
          if (!value) return '';
          
          switch(timeframe) {
            case 'week':
              return String(value).substring(0, 3);
            case 'year':
              return String(value);
            default:
              return typeof value === 'string' 
                ? value.split(' ')[0].substring(0, 3)
                : value;
          }
        }
      };
      return config;
    };
  
    return (
      <ResponsiveContainer width="100%" height={300}>
        <LineChart 
          data={data}
          margin={{ 
            top: 5, 
            right: 30, 
            left: 20, 
            bottom: windowWidth < 768 ? 60 : 20 
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis {...getXAxisConfig()} />
          <YAxis 
            allowDecimals={false}
            domain={[0, 'auto']}
            tickCount={7}
          />
          <Tooltip 
            formatter={(value) => [`${value} donations`, 'Donations']}
            labelFormatter={(label) => {
              if (!label) return '';
              switch(timeframe) {
                case 'week':
                  return `${label}`;
                case 'year':
                  return `Year ${label}`;
                default:
                  return String(label);
              }
            }}
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="donations"
            stroke="#ef4444"
            strokeWidth={2}
            dot={{ fill: '#ef4444', strokeWidth: 2 }}
            activeDot={{ r: 6 }}
            name="Donations"
          />
        </LineChart>
      </ResponsiveContainer>
    );
  };

  const StatCard = ({ icon: Icon, title, value, change, timeframe, bgColor, iconColor }) => (
  <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 p-6 relative overflow-hidden group border border-gray-100">
    {/* Enhanced background gradient */}
    <div className={`absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-300`}>
      <div className={`w-full h-full ${bgColor} transform rotate-12 translate-x-1/2 translate-y-1/2`} />
    </div>
    
    {/* Content */}
    <div className="flex items-center relative z-10">
      <div className={`p-3 ${bgColor} bg-opacity-10 rounded-xl group-hover:scale-110 transition-transform duration-300`}>
        <Icon className={`h-6 w-6 ${iconColor}`} />
      </div>
      <div className="ml-4">
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <h3 className="text-2xl font-bold text-gray-900">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </h3>
      </div>
    </div>
    
    {/* Enhanced growth indicator */}
    {change !== undefined && (
      <div className="mt-4 flex items-center text-sm">
        {change === 0 ? (
          <span className="text-gray-500 flex items-center">
            <span className="w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
            No change during current {timeframe}
          </span>
        ) : (
          <span 
            className={`inline-flex items-center font-medium ${
              change > 0 ? 'text-green-600' : 'text-red-600'
            }`}
          >
            <span className={`w-2 h-2 rounded-full mr-2 ${
              change > 0 ? 'bg-green-500' : 'bg-red-500'
            }`}></span>
            {change > 0 ? '+' : ''}{change}%
            <span className="ml-1 text-gray-400 font-normal">from last {timeframe}</span>
          </span>
        )}
      </div>
    )}
  </div>
);

  const getPaginatedData = (data, page, perPage) => {
    const startIndex = (page - 1) * perPage;
    return data.slice(startIndex, startIndex + perPage);
  };
  
  const PaginationControls = ({ currentPage, totalItems, itemsPerPage, setPage }) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    
    const handlePageChange = (newPage) => {
      if (newPage >= 1 && newPage <= totalPages) {
        setPage(newPage);
      }
    };
  
    return totalPages > 1 ? (
      <div className="flex justify-end items-center space-x-2 mt-4">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 hover:border-gray-400 transition-colors duration-200"
        >
          Previous
        </button>
        
        {[...Array(totalPages)].map((_, index) => (
          <button
            key={index + 1}
            onClick={() => handlePageChange(index + 1)}
            className={`px-3 py-2 border rounded-lg text-sm font-medium transition-all duration-200
              ${currentPage === index + 1 
                ? 'bg-red-600 text-white border-red-600 shadow-sm' 
                : 'border-gray-300 hover:bg-gray-50 hover:border-gray-400'}`}
          >
            {index + 1}
          </button>
        ))}
        
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 hover:border-gray-400 transition-colors duration-200"
        >
          Next
        </button>
      </div>
    ) : null;
  };

  const BLOOD_COLORS = {
    'A+': '#ef4444',
    'A-': '#f97316',
    'B+': '#84cc16',
    'B-': '#06b6d4',
    'AB+': '#6366f1',
    'AB-': '#a855f7',
    'O+': '#ec4899',
    'O-': '#f43f5e'
  };

  useEffect(() => {
    fetchDashboardData();
  }, [timeframe]);

  const fetchDashboardData = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/admin/dashboard?timeframe=${timeframe}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setStats(data.data);
      } else {
        setError(data.message);
      }
    } catch (error) {
      console.error('Dashboard fetch error:', error);
      setError('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleAppointmentAction = async (appointmentId, action) => {
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/admin/appointments/${appointmentId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          status: action === 'confirm' ? 'confirmed' : 'cancelled'
        })
      });
  
      if (response.ok) {
        fetchDashboardData();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to update appointment status');
      }
    } catch (error) {
      console.error(`Failed to ${action} appointment:`, error);
      setError('Failed to update appointment status');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Quick Actions Navigation Functions
  const handleQuickAction = (action) => {
    // Add a small delay for better UX feedback
    const button = event.target.closest('button');
    if (button) {
      button.classList.add('scale-95');
      setTimeout(() => button.classList.remove('scale-95'), 150);
    }

    switch (action) {
      case 'users':
        navigate('/admin/users');
        break;
      case 'inventory':
        navigate('/admin/inventory');
        break;
      case 'campaigns':
        navigate('/admin/campaigns');
        break;
      case 'reports':
        navigate('/admin/reports');
        break;
      default:
        break;
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-96">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-gray-100"></div>
            <div className="w-16 h-16 rounded-full border-t-4 border-red-600 animate-spin absolute top-0 left-0"></div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {/* Time Range Selector */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <TimeframeSelector value={timeframe} onChange={setTimeframe} />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={Users}
          title="Total Users"
          value={stats.totalUsers}
          change={stats.userGrowth}
          timeframe={timeframe}
          bgColor="bg-blue-50"
          iconColor="text-blue-600"
        />
        <StatCard
          icon={Droplet}
          title="Total Donations"
          value={stats.totalDonations}
          change={stats.donationGrowth}
          timeframe={timeframe}
          bgColor="bg-red-50"
          iconColor="text-red-600"
        />
        <StatCard
          icon={Building2}
          title="Blood Banks"
          value={stats.totalBloodBanks}
          bgColor="bg-green-50"
          iconColor="text-green-600"
        />
        <StatCard
          icon={Calendar}
          title="Active Campaigns"
          value={stats.activeCampaigns}
          bgColor="bg-purple-50"
          iconColor="text-purple-600"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-lg transition-all duration-300 border border-gray-100">
          <h2 className="text-lg font-semibold mb-4 text-gray-900">Donation Trends</h2>
          <DonationTrendsChart 
            data={stats.donationTrends}
            timeframe={timeframe}
          />
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-lg transition-all duration-300 border border-gray-100">
          <h2 className="text-lg font-semibold mb-4 text-gray-900">Blood Type Distribution</h2>
          <div className="flex flex-col">
            <div className="h-[300px] w-full">
              {stats.bloodTypeDistribution && stats.bloodTypeDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.bloodTypeDistribution.map(item => ({
                        ...item,
                        value: parseInt(item.value) // Convert string to number
                      }))}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                    >
                      {stats.bloodTypeDistribution.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={BLOOD_COLORS[entry.name]} 
                        />
                      ))}
                    </Pie>
                    <Legend 
                      verticalAlign="middle" 
                      align="right"
                      layout="vertical"
                    />
                    <Tooltip formatter={(value) => `${value} units`} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500">No Blood Inventory Data Available</p>
                </div>
              )}
            </div>
          
          {/* Total Units List */}
          {stats.bloodTypeDistribution && stats.bloodTypeDistribution.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm mb-4">Total Units by Blood Type</h3>
              <div className="grid grid-cols-4 gap-4">
                {stats.bloodTypeDistribution.map((blood) => (
                  <div key={blood.name} className="flex items-center space-x-2">
                    <div 
                      className="w-2 h-2 rounded-full" 
                      style={{ backgroundColor: BLOOD_COLORS[blood.name] }}
                    />
                    <div className="text-sm">
                      <span className="text-gray-600">{blood.name}: </span>
                      <span>{blood.value} Units</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          </div>
        </div>
      </div>

      {/* Pending Appointments and Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Pending Appointments */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300 border border-gray-100">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Pending Appointments</h2>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Show</span>
              <select
                value={appointmentsPerPage}
                onChange={(e) => {
                  setAppointmentsPerPage(Number(e.target.value));
                  setAppointmentsPage(1);
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
          <div className="p-6">
            {stats.pendingAppointments?.length > 0 ? (
              <div className="space-y-4">
                {getPaginatedData(stats.pendingAppointments, appointmentsPage, appointmentsPerPage)
                  .map((appointment) => (
                  <div key={appointment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200 border border-transparent hover:border-gray-200">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{appointment.donorName}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        <span className="inline-flex items-center">
                          <Droplet className="w-4 h-4 mr-1 text-red-500" />
                          {appointment.bloodType}
                        </span>
                        <span className="mx-2">•</span>
                        <span className="inline-flex items-center">
                          <Calendar className="w-4 h-4 mr-1 text-blue-500" />
                          {formatDate(appointment.date)}
                        </span>
                        <span className="mx-2">•</span>
                        <span className="inline-flex items-center">
                          <Clock className="w-4 h-4 mr-1 text-green-500" />
                          {appointment.time}
                        </span>
                      </p>
                      <p className="text-xs text-gray-500 mt-1 flex items-center">
                        <Building2 className="w-3 h-3 mr-1" />
                        {appointment.campaign_location}
                      </p>
                    </div>
                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => handleAppointmentAction(appointment.id, 'confirm')}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-full transition-colors duration-200 hover:scale-110"
                        title="Confirm Appointment"
                      >
                        <Check className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleAppointmentAction(appointment.id, 'cancel')}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors duration-200 hover:scale-110"
                        title="Cancel Appointment"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ))}
                <div className="mt-4 text-sm text-gray-500">
                  Showing {((appointmentsPage - 1) * appointmentsPerPage) + 1} to {Math.min(appointmentsPage * appointmentsPerPage, stats.pendingAppointments.length)} of {stats.pendingAppointments.length} appointments
                </div>
                <PaginationControls
                  currentPage={appointmentsPage}
                  totalItems={stats.pendingAppointments.length}
                  itemsPerPage={appointmentsPerPage}
                  setPage={setAppointmentsPage}
                />
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 text-gray-300">
                  <Calendar className="w-full h-full" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Pending Appointments</h3>
                <p className="text-gray-500">All appointments have been processed. Great job!</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300 border border-gray-100">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Recent Activities</h2>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Show</span>
              <select
                value={activitiesPerPage}
                onChange={(e) => {
                  setActivitiesPerPage(Number(e.target.value));
                  setActivitiesPage(1);
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

          {/* Activity Type Tabs */}
          <div className="border-b border-gray-200">
            <div className="flex space-x-8 px-6">
              <button
                onClick={() => {
                  setActivityType('appointments');
                  setActivitiesPage(1); // Reset to page 1
                }}
                className={`flex items-center py-4 border-b-2 font-medium text-sm
                  ${activityType === 'appointments' 
                    ? 'border-red-500 text-red-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
              >
                <Calendar className="w-5 h-5 mr-2" />
                Appointments
              </button>
              <button
                onClick={() => {
                  setActivityType('donations');
                  setActivitiesPage(1); // Reset to page 1
                }}
                className={`flex items-center py-4 border-b-2 font-medium text-sm
                  ${activityType === 'donations' 
                    ? 'border-red-500 text-red-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
              >
                <Droplet className="w-5 h-5 mr-2" />
                Donations
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* Show activities based on selected type */}
            {activityType === 'appointments' ? (
              <div className="space-y-4">
                {getPaginatedData(
                  stats.recentActivities.filter(activity => activity.type === 'appointment'),
                  activitiesPage,
                  activitiesPerPage
                ).map((activity, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200 border border-transparent hover:border-gray-200">
                    <div className="flex-1">
                      <p className="text-sm text-gray-900 font-medium">{activity.description}</p>
                      <p className="text-xs text-gray-500 mt-1 flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        {formatDate(activity.date)}
                      </p>
                    </div>
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ml-4
                      ${activity.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                        activity.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        activity.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-red-800'}`}
                    >
                      {activity.status.charAt(0).toUpperCase() + activity.status.slice(1)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {getPaginatedData(
                  stats.recentActivities.filter(activity => activity.type === 'donation'),
                  activitiesPage,
                  activitiesPerPage
                ).map((activity, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200 border border-transparent hover:border-gray-200">
                    <div className="flex-1">
                      <p className="text-sm text-gray-900 font-medium">{activity.description}</p>
                      <p className="text-xs text-gray-500 mt-1 flex items-center">
                        <Droplet className="w-3 h-3 mr-1" />
                        {formatDate(activity.date)}
                      </p>
                    </div>
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ml-4
                      ${activity.status === 'Completed' ? 'bg-green-100 text-green-800' :
                        activity.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'}`}
                    >
                      {activity.status.charAt(0).toUpperCase() + activity.status.slice(1)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination Information and Controls */}
            {stats.recentActivities.filter(activity => 
              activityType === 'appointments' ? activity.type === 'appointment' : activity.type === 'donation'
            ).length > 0 ? (
              <>
                <div className="mt-4 text-sm text-gray-500">
                  Showing {((activitiesPage - 1) * activitiesPerPage) + 1} to {
                    Math.min(
                      activitiesPage * activitiesPerPage,
                      stats.recentActivities.filter(activity => 
                        activityType === 'appointments' ? activity.type === 'appointment' : activity.type === 'donation'
                      ).length
                    )
                  } of {
                    stats.recentActivities.filter(activity => 
                      activityType === 'appointments' ? activity.type === 'appointment' : activity.type === 'donation'
                    ).length
                  } activities
                </div>
                <PaginationControls
                  currentPage={activitiesPage}
                  totalItems={stats.recentActivities.filter(activity => 
                    activityType === 'appointments' ? activity.type === 'appointment' : activity.type === 'donation'
                  ).length}
                  itemsPerPage={activitiesPerPage}
                  setPage={setActivitiesPage}
                />
              </>
            ) : (
              <p className="text-center text-gray-500">
                No {activityType === 'appointments' ? 'appointment' : 'donation'} activities
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm p-6 mt-6 border border-gray-100">
        <h2 className="text-lg font-semibold mb-4 text-gray-900">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button 
            onClick={() => handleQuickAction('users')}
            className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:border-red-300 hover:bg-red-50 transition-all duration-200 group cursor-pointer active:scale-95"
          >
            <Users className="w-8 h-8 text-red-600 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium text-gray-700 group-hover:text-red-700 transition-colors">Manage Users</span>
          </button>
          <button 
            onClick={() => handleQuickAction('inventory')}
            className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 group cursor-pointer active:scale-95"
          >
            <Droplet className="w-8 h-8 text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700 transition-colors">View Inventory</span>
          </button>
          <button 
            onClick={() => handleQuickAction('campaigns')}
            className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-all duration-200 group cursor-pointer active:scale-95"
          >
            <Calendar className="w-8 h-8 text-green-600 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium text-gray-700 group-hover:text-green-700 transition-colors">Create Campaign</span>
          </button>
          <button 
            onClick={() => handleQuickAction('reports')}
            className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-all duration-200 group cursor-pointer active:scale-95"
          >
            <Activity className="w-8 h-8 text-purple-600 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium text-gray-700 group-hover:text-purple-700 transition-colors">View Reports</span>
          </button>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;