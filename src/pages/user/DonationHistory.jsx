import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Activity, MapPin, BarChart2, User, TrendingUp, Droplet, Heart, Plus } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import DashboardLayout from '../../components/layout/DashboardLayout';
import apiClient from '../../api/client';

const DonationHistory = () => {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [entriesPerPage, setEntriesPerPage] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);
  const [chartData, setChartData] = useState([]);

  const getPaginatedData = (data, page, perPage) => {
    const startIndex = (page - 1) * perPage;
    return data.slice(startIndex, startIndex + perPage);
  };

  useEffect(() => {
    fetchDonationHistory();
  }, []);

  useEffect(() => {
    if (donations.length > 0) {
      processChartData();
    }
  }, [donations]);

  const processChartData = () => {
    const monthlyData = donations.reduce((acc, donation) => {
      const month = new Date(donation.donation_date).toLocaleString('default', { month: 'short' });
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {});

    const chartData = Object.entries(monthlyData).map(([month, count]) => ({
      month,
      donations: count
    }));

    setChartData(chartData);
  };

  const fetchDonationHistory = async () => {
    try {
      const response = await apiClient.get('/user/donations');
      
      if (response.data.success) {
        const sortedDonations = response.data.data.sort((a, b) => 
          new Date(b.donation_date) - new Date(a.donation_date)
        );
        setDonations(sortedDonations);
      } else {
        setError('Failed to fetch donation history');
      }
    } catch (error) {
      console.error('Error fetching donations:', error);
      setError('Failed to load donation history');
    } finally {
      setLoading(false);
    }
  };

  const totalDonations = donations.length;
  const totalVolume = donations.reduce((sum, donation) => sum + donation.quantity_ml, 0);
  const completedDonations = donations.filter(d => d.status === 'Completed').length;

  // Enhanced Stats Card Component
  const StatsCard = ({ icon: Icon, label, value, description, color = "red" }) => {
    const colorClasses = {
      red: "text-red-600 bg-red-50",
      green: "text-green-600 bg-green-50",
      blue: "text-blue-600 bg-blue-50",
      purple: "text-purple-600 bg-purple-50"
    };

    return (
      <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-gray-200">
        <div className="flex items-start space-x-4">
          <div className={`w-12 h-12 ${colorClasses[color]} rounded-xl flex items-center justify-center flex-shrink-0`}>
            <Icon className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
            <p className="text-sm font-semibold text-gray-900 mb-1">{label}</p>
            <p className="text-xs text-gray-500">{description}</p>
          </div>
        </div>
      </div>
    );
  };

  // Skeleton Loading Component
  const SkeletonLoader = () => (
    <div className="space-y-8 animate-pulse">
      {/* Stats Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
              <div className="flex-1 space-y-2">
                <div className="h-8 bg-gray-200 rounded w-20"></div>
                <div className="h-4 bg-gray-200 rounded w-32"></div>
                <div className="h-3 bg-gray-200 rounded w-24"></div>
              </div>
            </div>
          </div>
        ))}
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

  // Enhanced Error State Component
  const ErrorState = ({ message }) => (
    <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-100">
      <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
        <Activity className="h-10 w-10 text-red-600" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-3">Something went wrong</h3>
      <p className="text-gray-500 mb-6">{message}</p>
      <button
        onClick={fetchDonationHistory}
        className="inline-flex items-center px-6 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors duration-200"
      >
        <Activity className="h-5 w-5 mr-2" />
        Try Again
      </button>
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
        {/* Enhanced Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatsCard 
            icon={Activity} 
            label="Total Donations" 
            value={totalDonations}
            description="All-time donation count"
            color="red"
          />
          <StatsCard 
            icon={TrendingUp} 
            label="Volume Donated" 
            value={`${totalVolume} ml`}
            description="Total blood volume donated"
            color="green"
          />
          <StatsCard 
            icon={BarChart2} 
            label="Success Rate" 
            value={`${totalDonations ? Math.round((completedDonations / totalDonations) * 100) : 0}%`}
            description="Completed donations ratio"
            color="blue"
          />
        </div>

        {/* Enhanced Donation History List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Enhanced Header */}
          <div className="px-6 py-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-1">Donation Records</h2>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-600">Show</span>
                <select
                  value={entriesPerPage}
                  onChange={(e) => {
                    setEntriesPerPage(Number(e.target.value));
                    setCurrentPage(1);
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

          {/* Content */}
          <div className="p-6">
            {error ? (
              <ErrorState message={error} />
            ) : donations.length === 0 ? (
              <EmptyState
                icon={Heart}
                title="No Donation Records Found"
                description="Start your donation journey today! Your first donation could save up to 3 lives."
                action={() => window.location.href = '/donate'}
                actionLabel="Schedule Donation"
              />
            ) : (
              <div className="space-y-4">
                {getPaginatedData(donations, currentPage, entriesPerPage).map((donation) => (
                  <div key={donation.id} className="bg-gray-50 rounded-xl p-6 transition-all duration-200 hover:bg-gray-100 border border-gray-200 hover:border-gray-300">
                    <div className="space-y-4">
                      {/* Header with Status */}
                      <div className="flex justify-between items-start">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                            <Droplet className="h-5 w-5 text-red-600" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              Donation #{donation.id}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {new Date(donation.donation_date).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </p>
                          </div>
                        </div>
                        <span className={`px-4 py-2 rounded-full text-sm font-medium border
                          ${donation.status === 'Completed' 
                            ? 'bg-green-100 text-green-800 border-green-200'
                            : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                          }`}>
                          {donation.status}
                        </span>
                      </div>

                      {/* Donation Details Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-200">
                          <Calendar className="h-5 w-5 text-gray-500" />
                          <div>
                            <p className="text-xs text-gray-500 font-medium">Date</p>
                            <p className="text-sm font-semibold text-gray-900">
                              {new Date(donation.donation_date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-200">
                          <Clock className="h-5 w-5 text-gray-500" />
                          <div>
                            <p className="text-xs text-gray-500 font-medium">Volume</p>
                            <p className="text-sm font-semibold text-gray-900">{donation.quantity_ml} ml</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-200">
                          <Activity className="h-5 w-5 text-gray-500" />
                          <div>
                            <p className="text-xs text-gray-500 font-medium">Blood Type</p>
                            <p className="text-sm font-semibold text-gray-900">{donation.blood_type}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-200">
                          <MapPin className="h-5 w-5 text-gray-500" />
                          <div>
                            <p className="text-xs text-gray-500 font-medium">Location</p>
                            <p className="text-sm font-semibold text-gray-900">{donation.blood_bank_name}</p>
                          </div>
                        </div>
                      </div>

                      {/* Health Screening Notes */}
                      {donation.health_screening_notes && (
                        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                          <div className="flex items-start space-x-3">
                            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <Activity className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-blue-900 mb-1">Health Screening Notes</p>
                              <p className="text-sm text-blue-800">{donation.health_screening_notes}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Enhanced Pagination */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <p className="text-sm text-gray-600">
                      Showing {((currentPage - 1) * entriesPerPage) + 1} to {Math.min(currentPage * entriesPerPage, donations.length)} of {donations.length} entries
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 text-sm border border-gray-300 rounded-lg transition-all duration-200
                          disabled:opacity-50 disabled:cursor-not-allowed
                          hover:bg-gray-50 hover:border-gray-400 active:bg-gray-100"
                      >
                        Previous
                      </button>
                      {Array.from({ length: Math.ceil(donations.length / entriesPerPage) }).map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentPage(idx + 1)}
                          className={`px-4 py-2 text-sm border rounded-lg transition-all duration-200
                            ${currentPage === idx + 1 
                              ? 'bg-red-600 text-white border-red-600 shadow-md' 
                              : 'border-gray-300 hover:bg-gray-50 hover:border-gray-400 active:bg-gray-100'
                            }`}
                        >
                          {idx + 1}
                        </button>
                      ))}
                      <button
                        onClick={() => setCurrentPage(Math.min(currentPage + 1, Math.ceil(donations.length / entriesPerPage)))}
                        disabled={currentPage === Math.ceil(donations.length / entriesPerPage)}
                        className="px-4 py-2 text-sm border border-gray-300 rounded-lg transition-all duration-200
                          disabled:opacity-50 disabled:cursor-not-allowed
                          hover:bg-gray-50 hover:border-gray-400 active:bg-gray-100"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DonationHistory;