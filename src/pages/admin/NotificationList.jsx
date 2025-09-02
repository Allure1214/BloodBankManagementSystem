import React, { useState, useEffect } from 'react';
import { Filter, Search, X, Eye, Download, CheckCircle, AlertCircle, Info, Bell, Users, Calendar, RefreshCw } from 'lucide-react';

const NotificationList = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [entriesPerPage, setEntriesPerPage] = useState(10);
    const [typeFilter, setTypeFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortBy, setSortBy] = useState('date');
    const [sortOrder, setSortOrder] = useState('desc');
    const [showFilters, setShowFilters] = useState(false);
    const [selectedNotifications, setSelectedNotifications] = useState([]);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedNotification, setSelectedNotification] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

        useEffect(() => {
            fetchNotifications();
        }, []);

        // Helper functions
        const clearAllFilters = () => {
            setTypeFilter('all');
            setSearchTerm('');
            setStatusFilter('all');
            setCurrentPage(1);
        };

        const hasActiveFilters = () => {
            return typeFilter !== 'all' || searchTerm !== '' || statusFilter !== 'all';
        };

        const getTypeIcon = (type) => {
            switch (type) {
                case 'alert': return <AlertCircle className="w-4 h-4" />;
                case 'success': return <CheckCircle className="w-4 h-4" />;
                case 'info': return <Info className="w-4 h-4" />;
                default: return <Bell className="w-4 h-4" />;
            }
        };

        const getStatusIcon = (isRead) => {
            return isRead ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />;
        };

        const getPriorityLevel = (notification) => {
            const title = notification.title.toLowerCase();
            const message = notification.message.toLowerCase();
            const keywords = ['urgent', 'emergency', 'critical', 'immediate', 'asap'];
            
            if (keywords.some(keyword => title.includes(keyword) || message.includes(keyword))) {
                return 'high';
            } else if (notification.type === 'alert') {
                return 'medium';
            } else {
                return 'low';
            }
        };

        const getPriorityIndicator = (notification) => {
            const priority = getPriorityLevel(notification);
            const isRecent = new Date() - new Date(notification.created_at) < 24 * 60 * 60 * 1000; // 24 hours
            
            if (priority === 'high' || (isRecent && !notification.is_read)) {
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-800 rounded-full text-xs font-medium border border-red-200">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                        {priority === 'high' ? 'High Priority' : 'New'}
                    </span>
                );
            } else if (priority === 'medium') {
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium border border-yellow-200">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        Medium
                    </span>
                );
            }
            return null;
        };



        const getFilteredNotifications = () => {
            let filtered = notifications.filter(notification => {
                const matchesType = typeFilter === 'all' || notification.type === typeFilter;
                const matchesStatus = statusFilter === 'all' || 
                    (statusFilter === 'read' && notification.is_read) ||
                    (statusFilter === 'unread' && !notification.is_read);
                const matchesSearch = searchTerm === '' || 
                    notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    notification.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    notification.user_name.toLowerCase().includes(searchTerm.toLowerCase());
                
                return matchesType && matchesStatus && matchesSearch;
            });

            // Sort notifications
            filtered.sort((a, b) => {
                let aValue, bValue;
                switch (sortBy) {
                    case 'title':
                        aValue = a.title.toLowerCase();
                        bValue = b.title.toLowerCase();
                        break;
                    case 'type':
                        aValue = a.type;
                        bValue = b.type;
                        break;
                    case 'date':
                        aValue = new Date(a.created_at);
                        bValue = new Date(b.created_at);
                        break;
                    default:
                        aValue = new Date(a.created_at);
                        bValue = new Date(b.created_at);
                }

                if (sortOrder === 'asc') {
                    return aValue > bValue ? 1 : -1;
                } else {
                    return aValue < bValue ? 1 : -1;
                }
            });

            return filtered;
        };

        const fetchNotifications = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/admin/notifications/all', {
            headers: {
                'Authorization': `Bearer ${sessionStorage.getItem('token')}`
            }
            });
    
            const data = await response.json();
            if (data.success) {
            setNotifications(data.data);
            } else {
            throw new Error(data.message || 'Failed to fetch notifications');
            }
        } catch (error) {
            setError('Failed to load notifications');
            console.error(error);
        } finally {
            setLoading(false);
        }
        };
    
        const getTypeStyle = (type) => {
          switch (type) {
            case 'alert':
              return 'bg-red-100 text-red-800 border-red-200';
            case 'success':
              return 'bg-green-100 text-green-800 border-green-200';
            case 'info':
              return 'bg-blue-100 text-blue-800 border-blue-200';
            default:
              return 'bg-gray-100 text-gray-800 border-gray-200';
          }
        };

        const getStatusStyle = (isRead) => {
            return isRead 
                ? 'bg-green-100 text-green-800 border-green-200' 
                : 'bg-yellow-100 text-yellow-800 border-yellow-200';
        };

        const handleViewNotification = (notification) => {
            setSelectedNotification(notification);
            setShowDetailModal(true);
        };

        const handleBulkAction = async (action) => {
            if (selectedNotifications.length === 0) return;
            
            setIsSubmitting(true);
            try {
                // Implement bulk actions here
                setSuccessMessage(`${action} completed for ${selectedNotifications.length} notifications`);
                setSelectedNotifications([]);
            } catch (error) {
                setErrorMessage(`Failed to ${action} notifications`);
            } finally {
                setIsSubmitting(false);
            }
        };

        const handleExport = () => {
            const csvContent = "data:text/csv;charset=utf-8," + 
                "Type,Title,Message,Recipient,Status,Date\n" +
                getFilteredNotifications().map(n => 
                    `${n.type},${n.title},${n.message},${n.user_name},${n.is_read ? 'Read' : 'Unread'},${new Date(n.created_at).toLocaleString()}`
                ).join("\n");
            
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "notifications.csv");
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            setSuccessMessage('Notifications exported successfully');
        };

        // Calculate statistics
        const totalNotifications = notifications.length;
        const unreadCount = notifications.filter(n => !n.is_read).length;
        const alertCount = notifications.filter(n => n.type === 'alert').length;
        const successCount = notifications.filter(n => n.type === 'success').length;
    
        // Pagination
        const filteredNotifications = getFilteredNotifications();
        const indexOfLastEntry = currentPage * entriesPerPage;
        const indexOfFirstEntry = indexOfLastEntry - entriesPerPage;
        const currentEntries = filteredNotifications.slice(indexOfFirstEntry, indexOfLastEntry);
        const totalPages = Math.ceil(filteredNotifications.length / entriesPerPage);

        // Skeleton Loading Components
        const SkeletonRow = () => (
            <tr className="animate-pulse">
                <td className="px-4 py-3">
                    <div className="h-6 w-20 bg-gray-200 rounded-full"></div>
                </td>
                <td className="px-4 py-3">
                    <div className="h-4 w-32 bg-gray-200 rounded mb-1"></div>
                    <div className="h-3 w-16 bg-gray-200 rounded"></div>
                </td>
                <td className="px-4 py-3">
                    <div className="h-4 w-48 bg-gray-200 rounded"></div>
                </td>
                <td className="px-4 py-3">
                    <div className="h-4 w-24 bg-gray-200 rounded mb-1"></div>
                    <div className="h-3 w-20 bg-gray-200 rounded"></div>
                </td>
                <td className="px-4 py-3">
                    <div className="h-6 w-16 bg-gray-200 rounded-full mb-1"></div>
                    <div className="h-5 w-20 bg-gray-200 rounded-full"></div>
                </td>
                <td className="px-4 py-3">
                    <div className="h-4 w-20 bg-gray-200 rounded"></div>
                </td>
                <td className="px-4 py-3">
                    <div className="h-8 w-8 bg-gray-200 rounded"></div>
                </td>
            </tr>
        );

        const SkeletonCard = () => (
            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm animate-pulse">
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <div className="h-6 w-20 bg-gray-200 rounded-full"></div>
                        <div className="h-5 w-16 bg-gray-200 rounded-full"></div>
                    </div>
                    <div className="h-8 w-8 bg-gray-200 rounded"></div>
                </div>
                <div className="space-y-2">
                    <div className="h-4 w-32 bg-gray-200 rounded"></div>
                    <div className="h-4 w-full bg-gray-200 rounded"></div>
                    <div className="h-3 w-24 bg-gray-200 rounded"></div>
                    <div className="flex items-center gap-2 pt-2">
                        <div className="h-5 w-16 bg-gray-200 rounded-full"></div>
                        <div className="h-5 w-20 bg-gray-200 rounded-full"></div>
                    </div>
                </div>
            </div>
        );

        if (loading) {
            return (
                <div className="space-y-4 p-4">
                    {/* Skeleton Header */}
                    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 animate-pulse">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 bg-gray-200 rounded-lg"></div>
                                <div>
                                    <div className="h-6 w-48 bg-gray-200 rounded mb-1"></div>
                                    <div className="h-4 w-64 bg-gray-200 rounded"></div>
                                </div>
                            </div>
                            <div className="flex items-center gap-6">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="text-center">
                                        <div className="h-8 w-8 bg-gray-200 rounded mb-1"></div>
                                        <div className="h-3 w-12 bg-gray-200 rounded"></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Skeleton Filter */}
                    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 animate-pulse">
                        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                            <div className="flex-1">
                                <div className="h-10 w-full bg-gray-200 rounded-lg"></div>
                            </div>
                            <div className="lg:w-48">
                                <div className="h-10 w-full bg-gray-200 rounded-lg"></div>
                            </div>
                            <div className="flex gap-2">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="h-10 w-20 bg-gray-200 rounded-lg"></div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Skeleton Table */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <div className="h-6 w-32 bg-gray-200 rounded"></div>
                                <div className="flex items-center gap-3">
                                    <div className="flex gap-1">
                                        {[1, 2, 3, 4].map((i) => (
                                            <div key={i} className="h-6 w-16 bg-gray-200 rounded"></div>
                                        ))}
                                    </div>
                                    <div className="h-6 w-20 bg-gray-200 rounded"></div>
                                </div>
                            </div>
                        </div>
                        
                        {/* Desktop Skeleton */}
                        <div className="hidden lg:block">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                                            <th key={i} className="px-4 py-2">
                                                <div className="h-4 w-16 bg-gray-200 rounded"></div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {[1, 2, 3, 4, 5].map((i) => (
                                        <SkeletonRow key={i} />
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Skeleton */}
                        <div className="lg:hidden space-y-3 p-4">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <SkeletonCard key={i} />
                            ))}
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div className="space-y-4 p-4">
                {/* Compact Header */}
                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Bell className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Notification History</h1>
                                <p className="text-gray-600 text-sm">View and manage all system notifications</p>
                            </div>
                        </div>
                        
                        {/* Compact Statistics */}
                        <div className="flex items-center gap-6">
                            <div className="text-center">
                                <p className="text-2xl font-bold text-gray-900">{totalNotifications}</p>
                                <p className="text-xs text-gray-500">Total</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold text-yellow-600">{unreadCount}</p>
                                <p className="text-xs text-gray-500">Unread</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold text-red-600">{alertCount}</p>
                                <p className="text-xs text-gray-500">Alerts</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold text-green-600">{successCount}</p>
                                <p className="text-xs text-gray-500">Success</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Compact Filter Section */}
                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                        {/* Search */}
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search notifications..."
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
                                    aria-label="Search notifications by title, message, or recipient"
                                    aria-describedby="search-help"
                                />
                                <div id="search-help" className="sr-only">
                                    Search through notification titles, messages, and recipient names
                                </div>
                            </div>
                        </div>

                        {/* Status Filter */}
                        <div className="lg:w-48">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
                                aria-label="Filter notifications by read status"
                            >
                                <option value="all">All Status</option>
                                <option value="read">Read</option>
                                <option value="unread">Unread</option>
                            </select>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                            <button
                                onClick={clearAllFilters}
                                disabled={!hasActiveFilters()}
                                className="px-3 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                aria-label="Clear all active filters"
                                aria-disabled={!hasActiveFilters()}
                            >
                                Clear
                            </button>
                            <button
                                onClick={handleExport}
                                className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all flex items-center gap-1 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                                aria-label="Export notifications to CSV file"
                            >
                                <Download className="w-4 h-4" />
                                Export
                            </button>
                            <button
                                onClick={fetchNotifications}
                                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all flex items-center gap-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                aria-label="Refresh notification list"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Refresh
                            </button>
                        </div>
                    </div>

                    {/* Filter Chips */}
                    {(typeFilter !== 'all' || searchTerm || statusFilter !== 'all') && (
                        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-200">
                            {typeFilter !== 'all' && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                                    Type: {typeFilter}
                                    <button onClick={() => setTypeFilter('all')} className="hover:bg-blue-200 rounded-full p-0.5">
                                        <X className="w-3 h-3" />
                                    </button>
                                </span>
                            )}
                            {searchTerm && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">
                                    Search: "{searchTerm}"
                                    <button onClick={() => setSearchTerm('')} className="hover:bg-gray-200 rounded-full p-0.5">
                                        <X className="w-3 h-3" />
                                    </button>
                                </span>
                            )}
                            {statusFilter !== 'all' && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                                    Status: {statusFilter}
                                    <button onClick={() => setStatusFilter('all')} className="hover:bg-green-200 rounded-full p-0.5">
                                        <X className="w-3 h-3" />
                                    </button>
                                </span>
                            )}
                        </div>
                    )}
                </div>

                {/* Compact Table Section */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    {/* Table Header */}
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <h3 className="text-lg font-semibold text-gray-800">Notifications</h3>
                            <div className="flex items-center gap-3">
                                {/* Type Filter Pills */}
                                <div className="flex flex-wrap gap-1">
                                    {[
                                        { value: 'all', label: 'All Types', color: 'bg-gray-100 text-gray-700' },
                                        { value: 'info', label: 'Information', color: 'bg-blue-50 text-blue-700' },
                                        { value: 'alert', label: 'Alert', color: 'bg-red-50 text-red-700' },
                                        { value: 'success', label: 'Success', color: 'bg-green-50 text-green-700' }
                                    ].map(({ value, label, color }) => (
                                        <button
                                            key={value}
                                            onClick={() => setTypeFilter(value)}
                                            className={`px-2 py-1 rounded-md text-xs font-medium transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                                typeFilter === value 
                                                    ? 'ring-2 ring-blue-500 ring-offset-1 shadow-sm' 
                                                    : ''
                                            } ${color}`}
                                            aria-label={`Filter by ${label.toLowerCase()}`}
                                            aria-pressed={typeFilter === value}
                                        >
                                            {label}
                                            <span className="ml-1 px-1 py-0.5 bg-white rounded-full text-xs">
                                                {notifications.filter(n => value === 'all' ? true : n.type === value).length}
                                            </span>
                                        </button>
                                    ))}
                                </div>

                                {/* Entries per page */}
                                <div className="flex items-center gap-1">
                                    <span className="text-xs text-gray-600">Show</span>
                                    <select
                                        value={entriesPerPage}
                                        onChange={(e) => setEntriesPerPage(Number(e.target.value))}
                                        className="border border-gray-300 rounded-md px-2 py-1 text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        aria-label="Number of entries to display per page"
                                    >
                                        <option value={10}>10</option>
                                        <option value={25}>25</option>
                                        <option value={50}>50</option>
                                    </select>
                                    <span className="text-xs text-gray-600">entries</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Desktop Table */}
                    <div className="hidden lg:block overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Type
                                    </th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Title
                                    </th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Message
                                    </th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Recipient
                                    </th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Date
                                    </th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {currentEntries.map((notification, index) => (
                                    <tr key={notification.id} className={`hover:bg-blue-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getTypeStyle(notification.type)}`}>
                                                {getTypeIcon(notification.type)}
                                                {notification.type.charAt(0).toUpperCase() + notification.type.slice(1)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="space-y-1">
                                                <div className="text-sm font-medium text-gray-900">{notification.title}</div>
                                                {getPriorityIndicator(notification)}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="text-sm text-gray-500 max-w-xs truncate">{notification.message}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="space-y-1">
                                                <div className="text-sm font-medium text-gray-900">{notification.user_name}</div>
                                                <div className="text-xs text-gray-500">
                                                    {notification.blood_type} • {notification.area || 'No area'}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusStyle(notification.is_read)}`}>
                                                {getStatusIcon(notification.is_read)}
                                                {notification.is_read ? 'Read' : 'Unread'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-gray-500">
                                            {new Date(notification.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-3">
                                            <button
                                                onClick={() => handleViewNotification(notification)}
                                                className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-md transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                title="View Details"
                                                aria-label={`View details for notification: ${notification.title}`}
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Card Layout */}
                    <div className="lg:hidden space-y-3 p-4">
                        {currentEntries.map((notification) => (
                            <div key={notification.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getTypeStyle(notification.type)}`}>
                                            {getTypeIcon(notification.type)}
                                            {notification.type.charAt(0).toUpperCase() + notification.type.slice(1)}
                                        </span>
                                        {getPriorityIndicator(notification)}
                                    </div>
                                    <button
                                        onClick={() => handleViewNotification(notification)}
                                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        title="View Details"
                                        aria-label={`View details for notification: ${notification.title}`}
                                    >
                                        <Eye className="w-4 h-4" />
                                    </button>
                                </div>
                                
                                <div className="space-y-2">
                                    <h3 className="font-medium text-gray-900 text-sm">{notification.title}</h3>
                                    <p className="text-sm text-gray-600 line-clamp-2">{notification.message}</p>
                                    
                                    <div className="flex items-center justify-between text-xs text-gray-500">
                                        <span>{notification.user_name} • {notification.blood_type}</span>
                                        <span>{new Date(notification.created_at).toLocaleDateString()}</span>
                                    </div>
                                    
                                    <div className="flex items-center gap-2 pt-2">
                                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusStyle(notification.is_read)}`}>
                                            {getStatusIcon(notification.is_read)}
                                            {notification.is_read ? 'Read' : 'Unread'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Compact Pagination */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-t border-gray-200 pt-3 pb-3 px-4">
                        <div className="flex items-center gap-4 mb-2 sm:mb-0">
                            <span className="text-xs text-gray-700">
                                Showing {indexOfFirstEntry + 1} to {Math.min(indexOfLastEntry, filteredNotifications.length)} of {filteredNotifications.length} entries
                            </span>
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1.5 border border-gray-300 rounded-md text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
                                aria-label="Previous page"
                                aria-disabled={currentPage === 1}
                            >
                                Previous
                            </button>
                            {[...Array(totalPages)].map((_, index) => (
                                <button
                                    key={index + 1}
                                    onClick={() => setCurrentPage(index + 1)}
                                    className={`px-3 py-1.5 border rounded-md text-xs font-medium transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                        currentPage === index + 1 
                                            ? 'bg-blue-600 text-white border-blue-600' 
                                            : 'border-gray-300 text-gray-700 hover:bg-gray-50'
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
                                className="px-3 py-1.5 border border-gray-300 rounded-md text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
                                aria-label="Next page"
                                aria-disabled={currentPage === totalPages}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>

                {/* Notification Detail Modal */}
                {showDetailModal && selectedNotification && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] shadow-2xl overflow-hidden flex flex-col">
                            {/* Modal Header */}
                            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        {getTypeIcon(selectedNotification.type)}
                                        <h3 className="text-lg font-semibold text-gray-900">Notification Details</h3>
                                    </div>
                                    <button
                                        onClick={() => setShowDetailModal(false)}
                                        className="p-2 hover:bg-gray-200 rounded-lg transition-all"
                                    >
                                        <X className="w-5 h-5 text-gray-600" />
                                    </button>
                                </div>
                            </div>

                            {/* Modal Content */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                {/* Type and Status */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="bg-gray-50 rounded-xl p-4">
                                        <h4 className="text-sm font-medium text-gray-700 mb-2">Type</h4>
                                        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border ${getTypeStyle(selectedNotification.type)}`}>
                                            {getTypeIcon(selectedNotification.type)}
                                            {selectedNotification.type.charAt(0).toUpperCase() + selectedNotification.type.slice(1)}
                                        </span>
                                    </div>
                                    <div className="bg-gray-50 rounded-xl p-4">
                                        <h4 className="text-sm font-medium text-gray-700 mb-2">Status</h4>
                                        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border ${getStatusStyle(selectedNotification.is_read)}`}>
                                            {getStatusIcon(selectedNotification.is_read)}
                                            {selectedNotification.is_read ? 'Read' : 'Unread'}
                                        </span>
                                    </div>
                                </div>

                                {/* Title */}
                                <div className="bg-gray-50 rounded-xl p-4">
                                    <h4 className="text-sm font-medium text-gray-700 mb-2">Title</h4>
                                    <p className="text-gray-900 font-medium">{selectedNotification.title}</p>
                                </div>

                                {/* Message */}
                                <div className="bg-gray-50 rounded-xl p-4">
                                    <h4 className="text-sm font-medium text-gray-700 mb-2">Message</h4>
                                    <p className="text-gray-900 whitespace-pre-wrap">{selectedNotification.message}</p>
                                </div>

                                {/* Recipient */}
                                <div className="bg-gray-50 rounded-xl p-4">
                                    <h4 className="text-sm font-medium text-gray-700 mb-2">Recipient</h4>
                                    <div className="space-y-1">
                                        <p className="text-gray-900 font-medium">{selectedNotification.user_name}</p>
                                        <p className="text-sm text-gray-600">
                                            Blood Type: {selectedNotification.blood_type}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            Area: {selectedNotification.area || 'No area specified'}
                                        </p>
                                    </div>
                                </div>

                                {/* Date */}
                                <div className="bg-gray-50 rounded-xl p-4">
                                    <h4 className="text-sm font-medium text-gray-700 mb-2">Date Sent</h4>
                                    <p className="text-gray-900">{new Date(selectedNotification.created_at).toLocaleString()}</p>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                                <div className="flex justify-end gap-3">
                                    <button
                                        onClick={() => setShowDetailModal(false)}
                                        className="px-4 py-2 text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 transition-all"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Toast Notifications */}
                {successMessage && (
                    <div className="fixed bottom-4 right-4 bg-green-600 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-3 z-50">
                        <CheckCircle className="w-5 h-5" />
                        <span>{successMessage}</span>
                        <button
                            onClick={() => setSuccessMessage('')}
                            className="hover:bg-green-700 rounded-lg p-1"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {errorMessage && (
                    <div className="fixed bottom-4 right-4 bg-red-600 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-3 z-50">
                        <AlertCircle className="w-5 h-5" />
                        <span>{errorMessage}</span>
                        <button
                            onClick={() => setErrorMessage('')}
                            className="hover:bg-red-700 rounded-lg p-1"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>
        );
      };
      
export default NotificationList;