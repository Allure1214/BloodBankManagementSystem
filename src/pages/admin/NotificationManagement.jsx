import React, { useState, useEffect } from 'react';
import { Bell, Send, Filter, X, AlertCircle, CheckCircle, Info, Eye, RefreshCw, Plus, Edit, Trash2 } from 'lucide-react';
import AdminLayout from '../../components/layout/AdminDashboardLayout';
import NotificationList from './NotificationList';

    const NotificationManagement = () => {
    const [filters, setFilters] = useState({
        bloodType: '',
        area: '',
    });
    const [notification, setNotification] = useState({
        title: '',
        message: '',
        type: 'info'
    });
    const [loading, setLoading] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [response, setResponse] = useState({ message: '', type: '' });
    const [recipientCount, setRecipientCount] = useState(0);
    const [hasRecipients, setHasRecipients] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [activeTab, setActiveTab] = useState('push');
    const [successDetails, setSuccessDetails] = useState({
    recipientCount: 0,
    message: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formErrors, setFormErrors] = useState({});
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [isCheckingRecipients, setIsCheckingRecipients] = useState(false);

    const checkRecipients = async () => {
        setIsCheckingRecipients(true);
        try {
            const response = await fetch('http://localhost:5000/api/admin/notifications/check-recipients', {
                method: 'POST',
                headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${sessionStorage.getItem('token')}`
                },
                body: JSON.stringify({ filters }),
            });
        
            const data = await response.json();
            setRecipientCount(data.recipientCount);
            setHasRecipients(data.recipientCount > 0);
            } catch (error) {
            console.error('Error checking recipients:', error);
            setErrorMessage('Failed to check recipients');
            } finally {
            setIsCheckingRecipients(false);
        }
    };

    // Check recipients when filters change
    useEffect(() => {
        checkRecipients();
    }, [filters.bloodType, filters.area]);

    const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    const AREAS = [
      "Johor Bahru", "Muar", "Batu Pahat", "Kluang", "Pontian", 
      "Segamat", "Kota Tinggi", "Mersing", "Kulai", "Tangkak"
    ];

    // Helper functions for Phase 1 improvements
    const clearAllFilters = () => {
        setFilters({ bloodType: '', area: '' });
        setFormErrors({});
        setErrorMessage('');
    };

    const hasActiveFilters = () => {
        return filters.bloodType !== '' || filters.area !== '';
    };

    const validateForm = () => {
        const errors = {};
        if (!notification.title.trim()) {
            errors.title = 'Title is required';
        } else if (notification.title.length > 100) {
            errors.title = 'Title must be less than 100 characters';
        }
        if (!notification.message.trim()) {
            errors.message = 'Message is required';
        } else if (notification.message.length > 500) {
            errors.message = 'Message must be less than 500 characters';
        }
        if (!hasRecipients) {
            errors.recipients = 'No recipients found with current filters';
        }
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'alert': return <AlertCircle className="w-4 h-4" />;
            case 'success': return <CheckCircle className="w-4 h-4" />;
            case 'info': return <Info className="w-4 h-4" />;
            default: return <Bell className="w-4 h-4" />;
        }
    };

    const getTypeColor = (type) => {
        switch (type) {
            case 'alert': return 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200 transition-colors';
            case 'success': return 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200 transition-colors';
            case 'info': return 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200 transition-colors';
            default: return 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200 transition-colors';
        }
    };

    const getPriorityLevel = (type, title, message) => {
        const urgentKeywords = ['urgent', 'emergency', 'critical', 'immediate', 'asap'];
        const titleLower = title.toLowerCase();
        const messageLower = message.toLowerCase();
        
        if (type === 'alert' || urgentKeywords.some(keyword => 
            titleLower.includes(keyword) || messageLower.includes(keyword)
        )) {
            return 'high';
        } else if (type === 'success') {
            return 'low';
        }
        return 'medium';
    };

    const getPriorityIndicator = (priority) => {
        switch (priority) {
            case 'high':
                return (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200 ml-2">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        High Priority
                    </span>
                );
            case 'medium':
                return (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200 ml-2">
                        <Info className="h-3 w-3 mr-1" />
                        Medium Priority
                    </span>
                );
            case 'low':
                return (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200 ml-2">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Low Priority
                    </span>
                );
            default:
                return null;
        }
    };

    const notificationTemplates = [
        {
            id: 'blood-request',
            name: 'Blood Request',
            type: 'alert',
            title: 'Urgent Blood Donation Needed',
            message: 'We urgently need blood donations for {bloodType} blood type. Please visit our nearest blood bank if you can help.',
            description: 'Template for urgent blood donation requests'
        },
        {
            id: 'campaign-announcement',
            name: 'Campaign Announcement',
            type: 'info',
            title: 'New Blood Donation Campaign',
            message: 'Join our upcoming blood donation campaign in {area}. Your contribution can save lives!',
            description: 'Template for campaign announcements'
        },
        {
            id: 'thank-you',
            name: 'Thank You Message',
            type: 'success',
            title: 'Thank You for Your Donation',
            message: 'Thank you for your recent blood donation. Your contribution has helped save lives in our community.',
            description: 'Template for thanking donors'
        },
        {
            id: 'reminder',
            name: 'Donation Reminder',
            type: 'info',
            title: 'Blood Donation Reminder',
            message: 'It\'s been a while since your last donation. Consider donating again to help those in need.',
            description: 'Template for donation reminders'
        }
    ];

    const applyTemplate = (template) => {
        let title = template.title;
        let message = template.message;
        
        // Replace placeholders with current filter values
        if (filters.bloodType) {
            title = title.replace('{bloodType}', filters.bloodType);
            message = message.replace('{bloodType}', filters.bloodType);
        }
        if (filters.area) {
            title = title.replace('{area}', filters.area);
            message = message.replace('{area}', filters.area);
        }
        
        setNotification({
            title,
            message,
            type: template.type
        });
    };

    // Skeleton Loading Components
    const SkeletonFilterSection = () => (
        <div className="bg-gradient-to-r from-gray-50 to-white p-6 rounded-xl border border-gray-200 shadow-sm animate-pulse">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
                <div className="flex items-center">
                    <div className="p-2 bg-gray-200 rounded-lg mr-3">
                        <div className="h-5 w-5 bg-gray-300 rounded"></div>
                    </div>
                    <div className="h-6 w-32 bg-gray-300 rounded"></div>
                </div>
                <div className="h-8 w-24 bg-gray-300 rounded-full"></div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-3">
                    <div className="h-4 w-20 bg-gray-300 rounded"></div>
                    <div className="grid grid-cols-3 gap-2">
                        {Array.from({ length: 9 }).map((_, i) => (
                            <div key={i} className="h-8 bg-gray-300 rounded-xl"></div>
                        ))}
                    </div>
                </div>
                <div className="space-y-3">
                    <div className="h-4 w-12 bg-gray-300 rounded"></div>
                    <div className="h-12 bg-gray-300 rounded-xl"></div>
                </div>
            </div>
        </div>
    );

    const SkeletonContentSection = () => (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200 shadow-sm animate-pulse">
            <div className="flex items-center mb-6 pb-4 border-b border-blue-200">
                <div className="p-2 bg-gray-200 rounded-lg mr-3">
                    <div className="h-5 w-5 bg-gray-300 rounded"></div>
                </div>
                <div className="h-6 w-40 bg-gray-300 rounded"></div>
            </div>
            <div className="space-y-6">
                <div>
                    <div className="h-4 w-24 bg-gray-300 rounded mb-3"></div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="p-4 bg-gray-200 rounded-xl">
                                <div className="flex items-start space-x-3">
                                    <div className="h-8 w-8 bg-gray-300 rounded-lg"></div>
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 w-24 bg-gray-300 rounded"></div>
                                        <div className="h-3 w-32 bg-gray-300 rounded"></div>
                                        <div className="h-3 w-16 bg-gray-300 rounded"></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );

    const FilterSection = ({ filters, setFilters, recipientCount }) => {
       
      
        return (
          <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center">
                <Filter className="h-5 w-5 text-red-500 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900">Target Audience</h2>
              </div>
              <div className="bg-gray-100 px-4 py-2 rounded-full">
                <span className="text-sm font-medium text-gray-600">
                  {recipientCount} potential recipient{recipientCount !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
      
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Blood Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Blood Type
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setFilters(prev => ({ ...prev, bloodType: '' }))}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all
                      ${!filters.bloodType 
                        ? 'bg-red-100 text-red-700 ring-2 ring-red-500 ring-offset-2'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                  >
                    All
                  </button>
                  {BLOOD_TYPES.map(type => (
                    <button
                      key={type}
                      onClick={() => setFilters(prev => ({ ...prev, bloodType: type }))}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all
                        ${filters.bloodType === type
                          ? 'bg-red-100 text-red-700 ring-2 ring-red-500 ring-offset-2'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
      
              {/* Area Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Area
                </label>
                <select
                  value={filters.area}
                  onChange={(e) => setFilters(prev => ({ ...prev, area: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                >
                  <option value="">All Areas</option>
                  {AREAS.map(area => (
                    <option key={area} value={area}>{area}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        );
      };

    const handleSendNotification = async () => {
        setIsSubmitting(true);
        setFormErrors({});
        setErrorMessage('');
        
        try {
            const response = await fetch('http://localhost:5000/api/admin/notifications/send', {
                method: 'POST',
                headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${sessionStorage.getItem('token')}`
                },
                body: JSON.stringify({
                ...notification,
                filters
                }),
            });
        
            const data = await response.json();
            
            if (data.success) {
                setSuccessDetails({
                recipientCount: data.recipientCount,
                message: data.message
                });
                setShowSuccessModal(true);
                setSuccessMessage('Notification sent successfully!');
                // Clear form
                setNotification({ title: '', message: '', type: 'info' });
                setFilters({ bloodType: '', area: '' });
            } else {
                throw new Error(data.message || 'Failed to send notification');
            }
            } catch (error) {
            setErrorMessage(error.message);
            setFormErrors({ general: error.message });
            } finally {
            setIsSubmitting(false);
            }
    };

        const SuccessModal = () => (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
                    <div className="p-8 text-center">
                    {/* Success Icon */}
                        <div className="mx-auto h-16 w-16 rounded-full bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center mb-6 shadow-lg">
                            <CheckCircle className="h-10 w-10 text-green-600" />
                    </div>
            
                    {/* Title */}
                        <h3 className="text-2xl font-bold text-gray-900 mb-3">
                            Notification Sent Successfully!
                    </h3>
            
                    {/* Details */}
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200 mb-6">
                            <p className="text-lg font-semibold text-green-800 mb-2">
                                {successDetails.recipientCount} recipient{successDetails.recipientCount !== 1 ? 's' : ''} notified
                            </p>
                            <p className="text-sm text-green-600">
                                Your notification has been successfully delivered to all target users.
                            </p>
                        </div>
            
                    {/* Close Button */}
                    <button
                        onClick={() => setShowSuccessModal(false)}
                            className="w-full inline-flex justify-center items-center px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors font-medium"
                    >
                            <CheckCircle className="h-5 w-5 mr-2" />
                        Close
                    </button>
                    </div>
                </div>
            </div>
        );

    return (
        <AdminLayout>
            <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            {/* Enhanced Header */}
            <div className="mb-8">
                <div className="p-8 border-b border-gray-200 bg-gradient-to-r from-red-50 via-white to-red-50">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center space-x-4 mb-4 sm:mb-0">
                            <div className="p-3 bg-gradient-to-br from-red-100 to-red-200 rounded-xl shadow-sm">
                                <Bell className="h-8 w-8 text-red-600" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">Notification Management</h1>
                                <p className="text-gray-600 mt-1">Send targeted notifications to users based on blood type and location</p>
                            </div>
                        </div>
                </div>
                </div>
            </div>

            {/* Enhanced Tab Navigation */}
            <div className="mb-8">
                <nav className="flex space-x-8 bg-white rounded-xl p-2 shadow-sm border border-gray-200">
                <button
                    onClick={() => setActiveTab('push')}
                        className={`flex items-center px-6 py-3 rounded-lg transition-all duration-200 ${
                    activeTab === 'push'
                                ? 'bg-red-600 text-white shadow-md'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                >
                    <Send className="h-5 w-5 mr-2" />
                        <span className="font-medium">Send Notification</span>
                </button>
                <button
                    onClick={() => setActiveTab('list')}
                        className={`flex items-center px-6 py-3 rounded-lg transition-all duration-200 ${
                    activeTab === 'list'
                                ? 'bg-red-600 text-white shadow-md'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                >
                    <Bell className="h-5 w-5 mr-2" />
                        <span className="font-medium">Notification History</span>
                </button>
                </nav>
            </div>

            {/* Content based on active tab */}
            {activeTab === 'push' ? (
            <div className="space-y-6">
            {/* Enhanced Filter Section */}
            <div className="bg-gradient-to-r from-gray-50 to-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
                <div className="flex items-center">
                        <div className="p-2 bg-red-100 rounded-lg mr-3">
                            <Filter className="h-5 w-5 text-red-600" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">Target Audience</h2>
                </div>
                                        <div className="flex items-center space-x-3">
                        <div className={`px-4 py-2 rounded-full border transition-colors ${
                            isCheckingRecipients
                                ? 'bg-gray-100 text-gray-600 border-gray-200'
                                : recipientCount > 0 
                                    ? 'bg-green-100 text-green-800 border-green-200' 
                                    : 'bg-red-100 text-red-800 border-red-200'
                        }`}>
                            {isCheckingRecipients ? (
                                <div className="flex items-center">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                                    <span className="text-sm font-medium">Checking...</span>
                                </div>
                            ) : (
                                <span className="text-sm font-medium">
                                    {recipientCount} potential recipient{recipientCount !== 1 ? 's' : ''}
                                </span>
                            )}
                        </div>
                        {hasActiveFilters() && (
                            <button
                                onClick={clearAllFilters}
                                className="px-3 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
                                aria-label="Clear all filters"
                            >
                                <X className="h-4 w-4 mr-1" />
                                Clear Filters
                            </button>
                        )}
                </div>
                </div>

                {/* Enhanced Filters Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Enhanced Blood Type Filter */}
                <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">Blood Type</label>
                                        <div className="grid grid-cols-3 sm:flex sm:flex-wrap gap-2">
                        <button
                            onClick={() => setFilters(prev => ({ ...prev, bloodType: '' }))}
                            className={`px-3 py-2 rounded-xl text-sm font-medium transition-all border focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 ${
                                !filters.bloodType 
                                    ? 'bg-red-100 text-red-700 border-red-300 ring-2 ring-red-500 ring-offset-2'
                                    : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                            }`}
                            aria-label="Select all blood types"
                            aria-pressed={!filters.bloodType}
                        >
                            <span className="hidden sm:inline">All Types</span>
                            <span className="sm:hidden">All</span>
                        </button>
                        {BLOOD_TYPES.map(type => (
                            <button
                                key={type}
                                onClick={() => setFilters(prev => ({ ...prev, bloodType: type }))}
                                className={`px-3 py-2 rounded-xl text-sm font-medium transition-all border focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 ${
                                    filters.bloodType === type
                                        ? 'bg-red-100 text-red-700 border-red-300 ring-2 ring-red-500 ring-offset-2'
                                        : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                                }`}
                                aria-label={`Select ${type} blood type`}
                                aria-pressed={filters.bloodType === type}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Enhanced Area Filter */}
                <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">Area</label>
                                        <select
                        value={filters.area}
                        onChange={(e) => setFilters(prev => ({ ...prev, area: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                        aria-label="Select area for notification targeting"
                    >
                    <option value="">All Areas</option>
                    {AREAS.map(area => (
                        <option key={area} value={area}>{area}</option>
                    ))}
                    </select>
                </div>
                </div>

                {/* Filter Chips */}
                {hasActiveFilters() && (
                    <div className="mt-4 flex flex-wrap gap-2">
                        {filters.bloodType && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 border border-blue-200">
                                Blood Type: {filters.bloodType}
                                <button
                                    onClick={() => setFilters(prev => ({ ...prev, bloodType: '' }))}
                                    className="ml-2 hover:bg-blue-200 rounded-full p-0.5"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </span>
                        )}
                        {filters.area && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800 border border-green-200">
                                Area: {filters.area}
                                <button
                                    onClick={() => setFilters(prev => ({ ...prev, area: '' }))}
                                    className="ml-2 hover:bg-green-200 rounded-full p-0.5"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* Enhanced Notification Content Section */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200 shadow-sm">
                <div className="flex items-center mb-6 pb-4 border-b border-blue-200">
                    <div className="p-2 bg-blue-100 rounded-lg mr-3">
                        <Bell className="h-5 w-5 text-blue-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">Notification Content</h2>
                </div>

                                <div className="space-y-6">
                    {/* Notification Templates */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">Quick Templates</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {notificationTemplates.map((template) => (
                                <button
                                    key={template.id}
                                    onClick={() => applyTemplate(template)}
                                    className="p-4 rounded-xl border-2 border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50 transition-all text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                    aria-label={`Apply ${template.name} template`}
                                >
                                    <div className="flex items-start space-x-3">
                                        <div className={`p-2 rounded-lg ${getTypeColor(template.type).split(' ')[0]} ${getTypeColor(template.type).split(' ')[1]}`}>
                                            {getTypeIcon(template.type)}
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-medium text-gray-900 mb-1">{template.name}</div>
                                            <div className="text-sm text-gray-500 mb-2">{template.description}</div>
                                            <div className="text-xs text-gray-400">
                                                Type: {template.type.charAt(0).toUpperCase() + template.type.slice(1)}
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Enhanced Type Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">Notification Type</label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {[
                                { value: 'info', label: 'Information', icon: Info, description: 'General information' },
                                { value: 'alert', label: 'Alert', icon: AlertCircle, description: 'Important notice' },
                                { value: 'success', label: 'Success', icon: CheckCircle, description: 'Positive update' }
                            ].map(({ value, label, icon: Icon, description }) => (
                                <button
                                    key={value}
                                    onClick={() => setNotification(prev => ({ ...prev, type: value }))}
                                    className={`p-4 rounded-xl border-2 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                                        notification.type === value
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'border-gray-200 bg-white hover:border-gray-300'
                                    }`}
                                    aria-label={`Select ${label} notification type`}
                                    aria-pressed={notification.type === value}
                                >
                                    <div className="flex items-center space-x-3">
                                        <Icon className={`h-5 w-5 ${
                                            notification.type === value ? 'text-blue-600' : 'text-gray-400'
                                        }`} />
                                        <div className="text-left">
                                            <div className={`font-medium ${
                                                notification.type === value ? 'text-blue-900' : 'text-gray-900'
                                            }`}>
                                                {label}
                                            </div>
                                            <div className="text-sm text-gray-500">{description}</div>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                </div>

                    {/* Enhanced Title Input */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                        <div className="relative">
                                                <input
                                type="text"
                                value={notification.title}
                                onChange={(e) => setNotification(prev => ({ ...prev, title: e.target.value }))}
                                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                                    formErrors.title ? 'border-red-300 bg-red-50' : 'border-gray-300'
                                }`}
                                placeholder="Enter notification title"
                                maxLength={100}
                                aria-label="Notification title"
                                aria-describedby="title-help"
                            />
                            <div className="absolute right-3 top-3 text-sm text-gray-400">
                                {notification.title.length}/100
                            </div>
                        </div>
                                                {formErrors.title && (
                            <p className="mt-1 text-sm text-red-600">{formErrors.title}</p>
                        )}
                        <div id="title-help" className="sr-only">
                            Enter a title for your notification (maximum 100 characters)
                        </div>
                    </div>

                    {/* Enhanced Message Input */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                        <div className="relative">
                                                <textarea
                                value={notification.message}
                                onChange={(e) => setNotification(prev => ({ ...prev, message: e.target.value }))}
                                rows={4}
                                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none ${
                                    formErrors.message ? 'border-red-300 bg-red-50' : 'border-gray-300'
                                }`}
                                placeholder="Enter notification message"
                                maxLength={500}
                                aria-label="Notification message"
                                aria-describedby="message-help"
                            />
                            <div className="absolute right-3 bottom-3 text-sm text-gray-400">
                                {notification.message.length}/500
                            </div>
                        </div>
                        {formErrors.message && (
                            <p className="mt-1 text-sm text-red-600">{formErrors.message}</p>
                        )}
                        <div id="message-help" className="sr-only">
                            Enter the message content for your notification (maximum 500 characters)
                        </div>
                    </div>

                    {/* Recipients Validation */}
                    {formErrors.recipients && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                            <div className="flex items-center">
                                <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                                <p className="text-sm text-red-600">{formErrors.recipients}</p>
                            </div>
                </div>
                    )}
                </div>
            </div>

            {/* Enhanced Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4">
                <button
                onClick={() => setShowPreview(true)}
                    className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center"
                >
                    <Eye className="h-4 w-4 mr-2" />
                    Preview Notification
                </button>
                <button
                    onClick={() => {
                        if (validateForm()) {
                            handleSendNotification();
                        }
                    }}
                    disabled={isSubmitting || !notification.title || !notification.message || !hasRecipients}
                    className={`px-6 py-3 rounded-xl transition-colors flex items-center justify-center ${
                        isSubmitting || !notification.title || !notification.message || !hasRecipients
                            ? 'bg-gray-400 text-white cursor-not-allowed'
                            : 'bg-red-600 text-white hover:bg-red-700'
                    }`}
                >
                    {isSubmitting ? (
                        <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Sending...
                        </>
                    ) : (
                        <>
                <Send className="h-4 w-4 mr-2" />
                            {hasRecipients ? 'Send Notification' : 'No Recipients Available'}
                        </>
                    )}
                </button>
            </div>
            </div>
        ) : (
            <NotificationList />
        )}

            {/* Enhanced Preview Modal */}
            {showPreview && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] shadow-2xl overflow-hidden flex flex-col">
                        {/* Fixed Header */}
                        <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <Eye className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <h2 className="text-xl font-bold text-gray-900">Preview Notification</h2>
                                </div>
                    <button
                        onClick={() => setShowPreview(false)}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                    aria-label="Close modal"
                    >
                                    <X className="h-5 w-5 text-gray-500" />
                    </button>
                            </div>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto p-6">
                            <div className="space-y-6">
                                {/* Notification Preview Card */}
                                <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-xl border border-gray-200">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                                        <div className="p-1 bg-gray-100 rounded-lg mr-2">
                                            <Bell className="h-4 w-4 text-gray-600" />
                                        </div>
                                        Notification Preview
                                    </h3>
                                    <div className="bg-white p-4 rounded-lg border">
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getTypeColor(notification.type)}`}>
                                                {getTypeIcon(notification.type)}
                                                <span className="ml-1">{notification.type.charAt(0).toUpperCase() + notification.type.slice(1)}</span>
                                            </span>
                                            {getPriorityIndicator(getPriorityLevel(notification.type, notification.title, notification.message))}
                                        </div>
                                        <h4 className="font-semibold text-gray-900 text-lg mb-2">{notification.title || 'No title'}</h4>
                                        <p className="text-gray-600 whitespace-pre-wrap">{notification.message || 'No message'}</p>
                                    </div>
                    </div>

                                {/* Target Audience Card */}
                                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                                        <div className="p-1 bg-green-100 rounded-lg mr-2">
                                            <Filter className="h-4 w-4 text-green-600" />
                                        </div>
                                        Target Audience
                                    </h3>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-600">Blood Type:</span>
                                            <span className="text-sm font-medium text-gray-900">{filters.bloodType || 'All blood types'}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-600">Area:</span>
                                            <span className="text-sm font-medium text-gray-900">{filters.area || 'All areas'}</span>
                                        </div>
                                        <div className="flex justify-between items-center pt-2 border-t border-green-200">
                                            <span className="text-sm font-medium text-gray-900">Total Recipients:</span>
                                            <span className={`text-sm font-bold ${
                                                recipientCount > 0 ? 'text-green-600' : 'text-red-600'
                                            }`}>
                                                {recipientCount} user{recipientCount !== 1 ? 's' : ''}
                        </span>
                    </div>
                                    </div>
                                </div>
                            </div>
                    </div>

                        {/* Fixed Footer */}
                        <div className="flex-shrink-0 px-6 py-4 border-t border-gray-200 bg-gray-50">
                            <div className="flex justify-end space-x-3">
                                <button
                                    onClick={() => setShowPreview(false)}
                                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                                >
                                    Close
                                </button>
                                <button
                                    onClick={() => {
                                        setShowPreview(false);
                                        if (validateForm()) {
                                            handleSendNotification();
                                        }
                                    }}
                                    disabled={isSubmitting || !notification.title || !notification.message || !hasRecipients}
                                    className={`px-4 py-2 rounded-lg transition-colors ${
                                        isSubmitting || !notification.title || !notification.message || !hasRecipients
                                            ? 'bg-gray-400 text-white cursor-not-allowed'
                                            : 'bg-red-600 text-white hover:bg-red-700'
                                    }`}
                                >
                                    {isSubmitting ? 'Sending...' : 'Send Now'}
                                </button>
                            </div>
                        </div>
                </div>
                </div>
            )}

            {/* Success Modal */}
            {showSuccessModal && <SuccessModal />}

            {/* Enhanced Error Toast */}
            {errorMessage && (
                <div className="fixed bottom-4 right-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg shadow-lg max-w-sm">
                    <div className="flex items-center">
                        <AlertCircle className="h-5 w-5 mr-2" />
                        <span className="flex-1">{errorMessage}</span>
                        <button
                            onClick={() => setErrorMessage('')}
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
            </div>
        </AdminLayout>
        );
};

export default NotificationManagement;