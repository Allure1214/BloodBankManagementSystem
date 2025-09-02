import React, { useState, useEffect } from 'react';
import { Search, Check, X, Eye, Calendar, MapPin, Clock, CalendarHeart, Filter, CheckCircle, AlertCircle, ChevronDown, ChevronUp, Plus, Edit, Trash2 } from 'lucide-react';
import AdminLayout from '../../components/layout/AdminDashboardLayout';

const AppointmentManagement = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/appointment', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setAppointments(data.data);
      } else {
        setError('Failed to fetch appointments');
      }
    } catch (error) {
      setError('Failed to fetch appointments');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (appointmentId, newStatus) => {
    try {
      setActionLoading(true);
      const token = sessionStorage.getItem('token');
      console.log('Sending request with data:', { appointmentId, newStatus });
  
      const response = await fetch(`http://localhost:5000/api/appointment/${appointmentId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          status: newStatus,
          action: newStatus
        })
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Server response:', errorData);
        setError(errorData.message || 'Failed to update appointment status');
        return;
      }
  
      const data = await response.json();
      console.log('Success response:', data);
      await fetchAppointments();
      setShowDetailsModal(false);
      setSuccessMessage(`Appointment ${newStatus} successfully!`);
      setTimeout(() => setSuccessMessage(''), 3000);
      
    } catch (error) {
      console.error('Status update error:', error);
      setError('Failed to update appointment status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteDonation = async (appointmentId) => {
    try {
      setIsSubmitting(true);
      // Check if donation is already completed
      const appointment = appointments.find(a => a.id === appointmentId);
      if (appointment?.donation_completed) {
        setError('This donation has already been marked as complete');
        return;
      }
  
      const token = sessionStorage.getItem('token');
      const completionDate = new Date().toISOString().split('T')[0];
      const nextEligibleDate = new Date();
      nextEligibleDate.setMonth(nextEligibleDate.getMonth() + 3);
  
      const response = await fetch(`http://localhost:5000/api/appointment/${appointmentId}/complete-donation`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          donation_completed: true,
          donation_completed_date: completionDate,
          next_eligible_date: nextEligibleDate.toISOString().split('T')[0]
        })
      });
  
      if (!response.ok) {
        throw new Error('Failed to complete donation');
      }
  
      await fetchAppointments();
      setShowDetailsModal(false);
      setSuccessMessage('Donation marked as completed successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setError('Failed to mark donation as complete');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper functions for Phase 1 improvements
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedStatus('all');
  };

  const hasActiveFilters = () => {
    return searchTerm !== '' || selectedStatus !== 'all';
  };

  const getStatusIcon = (status) => {
    switch(status.toLowerCase()) {
      case 'confirmed':
        return <CheckCircle className="h-4 w-4" />;
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'cancelled':
        return <X className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const AppointmentDetailsModal = ({ appointment, onClose }) => {
    const [formErrors, setFormErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const validateForm = () => {
      const errors = {};
      // Add validation logic if needed
      setFormErrors(errors);
      return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (action) => {
      if (!validateForm()) return;
      
      setIsSubmitting(true);
      try {
        if (action === 'complete') {
          await handleCompleteDonation(appointment.id);
        } else {
          await handleStatusChange(appointment.id, action);
        }
      } catch (error) {
        setError('Failed to update appointment');
      } finally {
        setIsSubmitting(false);
      }
    };
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] shadow-2xl overflow-hidden flex flex-col">
          {/* Fixed Header */}
          <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-red-50 to-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <CalendarHeart className="h-5 w-5 text-red-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Appointment Details</h2>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Close modal"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Success Message */}
            {successMessage && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center">
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                <span className="text-green-800 text-sm">{successMessage}</span>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center">
                <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                <span className="text-red-800 text-sm">{error}</span>
              </div>
            )}

            <div className="space-y-6">
              {/* Donor Information Card */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <div className="p-1 bg-blue-100 rounded-lg mr-2">
                    <Calendar className="h-4 w-4 text-blue-600" />
                  </div>
                  Donor Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <p className="text-sm text-gray-900 bg-white p-2 rounded-lg border">{appointment.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <p className="text-sm text-gray-900 bg-white p-2 rounded-lg border">{appointment.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <p className="text-sm text-gray-900 bg-white p-2 rounded-lg border">{appointment.phone}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Blood Type</label>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 border border-red-200">
                      {appointment.blood_type}
                    </span>
                  </div>
                </div>
              </div>

              {/* Campaign Details Card */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <div className="p-1 bg-green-100 rounded-lg mr-2">
                    <MapPin className="h-4 w-4 text-green-600" />
                  </div>
                  Campaign Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                    <p className="text-sm text-gray-900 bg-white p-2 rounded-lg border flex items-center">
                      <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                      {appointment.campaign_location}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <p className="text-sm text-gray-900 bg-white p-2 rounded-lg border flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                      {new Date(appointment.session_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Time</label>
                    <p className="text-sm text-gray-900 bg-white p-2 rounded-lg border flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-gray-500" />
                      {appointment.preferred_time}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusStyle(appointment.status)}`}>
                      {getStatusIcon(appointment.status)}
                      <span className="ml-1">{appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Management Section */}
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-xl border border-yellow-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <div className="p-1 bg-yellow-100 rounded-lg mr-2">
                    <CheckCircle className="h-4 w-4 text-yellow-600" />
                  </div>
                  Status Management
                </h3>
                
                <div className="space-y-4">
                  {/* Show Pending Actions */}
                  {appointment.status === 'pending' && !appointment.donation_completed && (
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() => handleSubmit('confirmed')}
                        disabled={isSubmitting || actionLoading}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                      >
                        {actionLoading ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        ) : (
                          <Check className="h-4 w-4 mr-2" />
                        )}
                        Confirm Appointment
                      </button>
                      <button
                        onClick={() => handleSubmit('cancelled')}
                        disabled={isSubmitting || actionLoading}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                      >
                        {actionLoading ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        ) : (
                          <X className="h-4 w-4 mr-2" />
                        )}
                        Cancel Appointment
                      </button>
                    </div>
                  )}

                  {/* Show Complete Donation option */}
                  {appointment.status === 'confirmed' && !appointment.donation_completed && (
                    <div className="bg-white p-4 rounded-lg border border-green-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">Ready to complete donation?</p>
                          <p className="text-sm text-gray-600">Mark this appointment as completed</p>
                        </div>
                        <button
                          onClick={() => handleSubmit('complete')}
                          disabled={isSubmitting || actionLoading}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                        >
                          {isSubmitting ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          ) : (
                            <CheckCircle className="h-4 w-4 mr-2" />
                          )}
                          Complete Donation
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Show completed status */}
                  {appointment.donation_completed && (
                    <div className="bg-white p-4 rounded-lg border border-green-200">
                      <div className="flex items-center text-green-600 mb-2">
                        <CheckCircle className="h-5 w-5 mr-2" />
                        <span className="font-medium">Donation Completed</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Completed on:</span>
                          <p className="font-medium">{new Date(appointment.donation_completed_date).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Next eligible date:</span>
                          <p className="font-medium">{new Date(appointment.next_eligible_date).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Show cancelled status */}
                  {appointment.status === 'cancelled' && !appointment.donation_completed && (
                    <div className="bg-white p-4 rounded-lg border border-red-200">
                      <div className="flex items-center text-red-600">
                        <X className="h-5 w-5 mr-2" />
                        <span className="font-medium">Appointment Cancelled</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Fixed Footer */}
          <div className="flex-shrink-0 px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex justify-end space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
};  

  // Filter appointments
  const filteredAppointments = appointments.filter(appointment => {
    const matchesSearch = 
      appointment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.campaign_location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || appointment.status === selectedStatus;
    
    return matchesSearch && matchesStatus;
  });

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredAppointments.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredAppointments.length / itemsPerPage);

  const getStatusStyle = (status) => {
    switch(status.toLowerCase()) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200 transition-colors';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200 transition-colors';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200 transition-colors';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200 transition-colors';
    }
  };

  const getUrgencyIndicator = (appointment) => {
    if (appointment.status === 'pending' && !appointment.donation_completed) {
      const appointmentDate = new Date(appointment.session_date);
      const today = new Date();
      const daysUntilAppointment = Math.ceil((appointmentDate - today) / (1000 * 60 * 60 * 24));
      
      if (daysUntilAppointment < 0) {
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200 ml-2">
            <AlertCircle className="h-3 w-3 mr-1" />
            Overdue
          </span>
        );
      } else if (daysUntilAppointment <= 1) {
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200 ml-2">
            <Clock className="h-3 w-3 mr-1" />
            Today
          </span>
        );
      } else if (daysUntilAppointment <= 3) {
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200 ml-2">
            <Clock className="h-3 w-3 mr-1" />
            Soon
          </span>
        );
      }
    }
    return null;
  };

  const getCompletionStatus = (appointment) => {
    if (appointment.donation_completed) {
      return (
        <div className="flex items-center text-green-600">
          <CheckCircle className="h-4 w-4 mr-1" />
          <span className="text-xs font-medium">Completed</span>
        </div>
      );
    }
    return null;
  };

  // Skeleton Loading Components
  const SkeletonRow = () => (
    <tr className="animate-pulse">
      <td className="px-6 py-4">
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-32"></div>
          <div className="h-3 bg-gray-200 rounded w-48"></div>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="h-4 bg-gray-200 rounded w-24"></div>
      </td>
      <td className="px-6 py-4">
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-20"></div>
          <div className="h-3 bg-gray-200 rounded w-16"></div>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="h-6 bg-gray-200 rounded-full w-12"></div>
      </td>
      <td className="px-6 py-4">
        <div className="h-6 bg-gray-200 rounded-full w-20"></div>
      </td>
      <td className="px-6 py-4">
        <div className="flex space-x-2">
          <div className="h-8 w-8 bg-gray-200 rounded"></div>
          <div className="h-8 w-8 bg-gray-200 rounded"></div>
        </div>
      </td>
    </tr>
  );

  const SkeletonCard = () => (
    <div className="p-4 border-b border-gray-200 animate-pulse">
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-32"></div>
            <div className="h-3 bg-gray-200 rounded w-48"></div>
          </div>
          <div className="h-8 w-8 bg-gray-200 rounded"></div>
        </div>
        <div className="h-4 bg-gray-200 rounded w-24"></div>
        <div className="h-4 bg-gray-200 rounded w-32"></div>
        <div className="flex items-center justify-between">
          <div className="h-6 bg-gray-200 rounded-full w-12"></div>
          <div className="h-6 bg-gray-200 rounded-full w-20"></div>
        </div>
      </div>
    </div>
  );

  return (
    <AdminLayout>
      {/* Enhanced Header Section */}
      <div className="p-8 border-b border-gray-200 bg-gradient-to-r from-red-50 via-white to-red-50">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center space-x-4 mb-4 sm:mb-0">
            <div className="p-3 bg-gradient-to-br from-red-100 to-red-200 rounded-xl shadow-sm">
              <CalendarHeart className="h-8 w-8 text-red-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Appointment Management</h1>
              <p className="text-gray-600 mt-1">Manage blood donation appointments and schedules</p>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Search and Filter Section */}
      <div className="bg-gradient-to-r from-gray-50 to-white p-6 rounded-xl border border-gray-200 shadow-sm mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search appointments by name, email, or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
              aria-label="Search appointments"
              role="searchbox"
              aria-describedby="search-help"
            />
            <div id="search-help" className="sr-only">
              Search appointments by donor name, email address, or campaign location
            </div>
          </div>

          {/* Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors min-w-[150px]"
                aria-label="Filter appointments by status"
                aria-describedby="status-filter-help"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <div id="status-filter-help" className="sr-only">
                Filter appointments by their current status: pending, confirmed, or cancelled
              </div>
            </div>

            {/* Clear Filters Button */}
            {hasActiveFilters() && (
              <button
                onClick={clearFilters}
                className="px-4 py-3 text-gray-600 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors flex items-center focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                aria-label="Clear all active filters"
              >
                <X className="h-4 w-4 mr-2" />
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Filter Chips */}
        {(searchTerm || selectedStatus !== 'all') && (
          <div className="mt-4 flex flex-wrap gap-2">
            {searchTerm && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 border border-blue-200">
                Search: "{searchTerm}"
                <button
                  onClick={() => setSearchTerm('')}
                  className="ml-2 hover:bg-blue-200 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {selectedStatus !== 'all' && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800 border border-green-200">
                Status: {selectedStatus}
                <button
                  onClick={() => setSelectedStatus('all')}
                  className="ml-2 hover:bg-green-200 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Enhanced Table Section */}
      <div className="overflow-hidden rounded-2xl bg-white border border-gray-200 shadow-lg">
        {loading ? (
          <>
            {/* Desktop Skeleton */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-gray-50 to-white">
                  <tr>
                    {["Donor", "Campaign", "Date & Time", "Blood Type", "Status", "Actions"].map((header) => (
                      <th key={header} className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <SkeletonRow key={index} />
                  ))}
                </tbody>
              </table>
            </div>
            {/* Mobile Skeleton */}
            <div className="lg:hidden">
              {Array.from({ length: 5 }).map((_, index) => (
                <SkeletonCard key={index} />
              ))}
            </div>
          </>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200" role="table" aria-label="Appointments table">
                <thead className="bg-gradient-to-r from-gray-50 to-white">
                  <tr>
                    {["Donor", "Campaign", "Date & Time", "Blood Type", "Status", "Actions"].map((header) => (
                      <th key={header} className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider" role="columnheader" scope="col">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {currentItems.map((appointment, index) => (
                    <tr key={appointment.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors`} role="row">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-base font-semibold text-gray-900">{appointment.name}</span>
                          <span className="text-sm text-gray-600">{appointment.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">{appointment.campaign_location}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-900 flex items-center">
                            <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                            {new Date(appointment.session_date).toLocaleDateString()}
                          </span>
                          <span className="text-sm text-gray-600 flex items-center">
                            <Clock className="h-4 w-4 text-gray-400 mr-2" />
                            {appointment.preferred_time}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 border border-red-200">
                          {appointment.blood_type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          <div className="flex items-center">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusStyle(appointment.status)}`}>
                              {getStatusIcon(appointment.status)}
                              <span className="ml-1">{appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}</span>
                            </span>
                            {getUrgencyIndicator(appointment)}
                          </div>
                          {getCompletionStatus(appointment)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setSelectedAppointment(appointment);
                              setShowDetailsModal(true);
                            }}
                            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                            aria-label={`View details for appointment with ${appointment.name}`}
                          >
                            <Eye className="h-5 w-5" />
                          </button>
                          {appointment.status === 'pending' && !appointment.donation_completed && (
                            <>
                              <button
                                onClick={() => handleStatusChange(appointment.id, 'confirmed')}
                                disabled={actionLoading}
                                className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                                aria-label={`Confirm appointment for ${appointment.name}`}
                              >
                                <Check className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => handleStatusChange(appointment.id, 'cancelled')}
                                disabled={actionLoading}
                                className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                                aria-label={`Cancel appointment for ${appointment.name}`}
                              >
                                <X className="h-5 w-5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card Layout */}
            <div className="lg:hidden">
              {currentItems.map((appointment, index) => (
                <div key={appointment.id} className={`p-4 border-b border-gray-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors`}>
                  <div className="flex flex-col space-y-3">
                    {/* Donor Info */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-base font-semibold text-gray-900">{appointment.name}</h3>
                        <p className="text-sm text-gray-600">{appointment.email}</p>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedAppointment(appointment);
                          setShowDetailsModal(true);
                        }}
                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        aria-label={`View details for appointment with ${appointment.name}`}
                      >
                        <Eye className="h-5 w-5" />
                      </button>
                    </div>

                    {/* Campaign & Date */}
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-2" />
                      <span className="flex-1">{appointment.campaign_location}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span>{new Date(appointment.session_date).toLocaleDateString()}</span>
                      <Clock className="h-4 w-4 ml-4 mr-2" />
                      <span>{appointment.preferred_time}</span>
                    </div>

                    {/* Blood Type & Status */}
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 border border-red-200">
                        {appointment.blood_type}
                      </span>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusStyle(appointment.status)}`}>
                          {getStatusIcon(appointment.status)}
                          <span className="ml-1">{appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}</span>
                        </span>
                        {getUrgencyIndicator(appointment)}
                      </div>
                    </div>

                    {/* Completion Status */}
                    {getCompletionStatus(appointment)}

                    {/* Action Buttons */}
                    {appointment.status === 'pending' && !appointment.donation_completed && (
                      <div className="flex space-x-2 pt-2">
                        <button
                          onClick={() => handleStatusChange(appointment.id, 'confirmed')}
                          disabled={actionLoading}
                          className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                          aria-label={`Confirm appointment for ${appointment.name}`}
                        >
                          <Check className="h-4 w-4 mr-2" />
                          Confirm
                        </button>
                        <button
                          onClick={() => handleStatusChange(appointment.id, 'cancelled')}
                          disabled={actionLoading}
                          className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                          aria-label={`Cancel appointment for ${appointment.name}`}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Empty State */}
        {!loading && currentItems.length === 0 && (
          <div className="text-center py-12">
            <CalendarHeart className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No appointments found</h3>
            <p className="text-gray-600 mb-4">
              {hasActiveFilters() 
                ? "Try adjusting your search criteria or clear filters to see all appointments."
                : "No appointments have been scheduled yet."
              }
            </p>
            {hasActiveFilters() && (
              <button
                onClick={clearFilters}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}

        {/* Enhanced Pagination */}
        <div className="mt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between border-t border-gray-200 pt-6 pb-6 px-6">
          <span className="text-sm text-gray-700 mb-4 sm:mb-0">
            Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredAppointments.length)} of {filteredAppointments.length} results
          </span>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-gray-300 rounded-xl text-sm disabled:opacity-50 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              aria-label="Go to previous page"
              aria-disabled={currentPage === 1}
            >
              Previous
            </button>
            {Array.from({ length: totalPages }).map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentPage(index + 1)}
                className={`px-4 py-2 border rounded-xl text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 ${
                  currentPage === index + 1 
                    ? 'bg-red-600 text-white border-red-600' 
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
                aria-label={`Go to page ${index + 1}`}
                aria-current={currentPage === index + 1 ? 'page' : undefined}
              >
                {index + 1}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border border-gray-300 rounded-xl text-sm disabled:opacity-50 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              aria-label="Go to next page"
              aria-disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Keep existing modals */}
      {showDetailsModal && selectedAppointment && (
        <AppointmentDetailsModal
          appointment={selectedAppointment}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedAppointment(null);
          }}
        />
      )}

      {/* Enhanced Error Toast */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg shadow-lg max-w-sm">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span className="flex-1">{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-2 hover:bg-red-200 rounded-full p-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {successMessage && (
        <div className="fixed bottom-4 right-4 bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded-lg shadow-lg max-w-sm">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 mr-2" />
            <span className="flex-1">{successMessage}</span>
            <button
              onClick={() => setSuccessMessage('')}
              className="ml-2 hover:bg-green-200 rounded-full p-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AppointmentManagement;