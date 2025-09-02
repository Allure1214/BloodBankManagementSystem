import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, Eye, Trash2, Mail, 
  Clock, CheckCircle, MessageSquare, ArrowLeft, ArrowRight,
  RefreshCw, AlertCircle, X, ChevronDown, ChevronUp, Plus, Edit
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../api/client';

const MessageManagement = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [responseText, setResponseText] = useState('');
  const [responding, setResponding] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    new: 0,
    read_count: 0,
    replied: 0
  });
  const [showFilters, setShowFilters] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Pagination and filtering
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalMessages, setTotalMessages] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [limit] = useState(10);



  const fetchMessages = async () => {
    try {
      setLoading(true);
      console.log('fetchMessages called - statusFilter value:', statusFilter);
      console.log('fetchMessages called - statusFilter type:', typeof statusFilter);
      
      const params = new URLSearchParams({
        page: currentPage,
        limit,
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(searchTerm && { search: searchTerm })
      });

      console.log('Fetching messages with params:', params.toString());
      console.log('Status filter:', statusFilter);

      const response = await apiClient.get(`/admin/messages?${params}`);
      const data = response.data;
      
      console.log('Received messages:', data.messages);
      console.log('Messages count:', data.messages.length);
      
      // Apply client-side filter as backup to ensure consistency
      let filteredMessages = data.messages;
      if (statusFilter !== 'all') {
        filteredMessages = data.messages.filter(msg => msg.status === statusFilter);
        console.log('Client-side filtered messages:', filteredMessages.length);
      }
      
      setMessages(filteredMessages);
      setTotalPages(data.pagination.totalPages);
      setTotalMessages(data.pagination.totalMessages);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await apiClient.get('/admin/messages/stats/overview');
      setStats(response.data.stats);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const updateMessageStatus = async (messageId, newStatus) => {
    try {
      const response = await apiClient.patch(`/admin/messages/${messageId}/status`, { 
        status: newStatus 
      });

      if (response.data.success) {
        // Update local state
        setMessages(prev => prev.map(msg => 
          msg.id === messageId ? { ...msg, status: newStatus } : msg
        ));
        fetchStats(); // Refresh stats
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const deleteMessage = async (messageId) => {
    if (!window.confirm('Are you sure you want to delete this message?')) {
      return;
    }

    try {
      const response = await apiClient.delete(`/admin/messages/${messageId}`);

      if (response.data.success) {
        setMessages(prev => prev.filter(msg => msg.id !== messageId));
        fetchStats(); // Refresh stats
        if (selectedMessage?.id === messageId) {
          setSelectedMessage(null);
          setShowModal(false);
        }
      }
    } catch (err) {
      console.error('Failed to delete message:', err);
    }
  };

  const sendResponse = async (messageId) => {
    if (!responseText.trim()) {
      alert('Please enter a response message');
      return;
    }

    setResponding(true);
    try {
      const response = await apiClient.post(`/admin/messages/${messageId}/respond`, { 
        response: responseText 
      });

      if (response.data.success) {
        // Update local state
        setMessages(prev => prev.map(msg => 
          msg.id === messageId ? { ...msg, status: 'Replied' } : msg
        ));
        
        // Update selected message if it's the same
        if (selectedMessage?.id === messageId) {
          setSelectedMessage(prev => ({ ...prev, status: 'Replied' }));
        }
        
        setResponseText('');
        setShowResponseModal(false);
        fetchStats(); // Refresh stats
        alert('Response sent successfully!');
      } else {
        alert(response.data.message || 'Failed to send response');
      }
    } catch (err) {
      console.error('Failed to send response:', err);
      alert('Failed to send response. Please try again.');
    } finally {
      setResponding(false);
    }
  };

  const viewMessage = async (messageId) => {
    try {
      const response = await apiClient.get(`/admin/messages/${messageId}`);

      if (response.data.success) {
        setSelectedMessage(response.data.message);
        setShowModal(true);
        
        // Don't update local state here - let fetchMessages handle it
        // This prevents the filter from showing incorrect data
        
        // Refresh stats and messages to ensure consistency
        fetchStats();
        
        // Small delay to ensure backend has processed the status change
        setTimeout(() => {
          fetchMessagesWithFilter();
        }, 100);
      }
    } catch (err) {
      console.error('Failed to fetch message:', err);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchMessagesWithFilter();
  };

  const handleFilterChange = (newStatus) => {
    console.log('handleFilterChange called with:', newStatus);
    console.log('Previous statusFilter:', statusFilter);
    setStatusFilter(newStatus);
    setCurrentPage(1);
    console.log('About to call fetchMessages with newStatus:', newStatus);
    // Use newStatus directly instead of waiting for state update
    fetchMessagesWithFilter(newStatus);
  };

  const fetchMessagesWithFilter = async (filterStatus = statusFilter) => {
    try {
      setLoading(true);
      console.log('fetchMessagesWithFilter called - filterStatus:', filterStatus);
      console.log('fetchMessagesWithFilter called - filterStatus type:', typeof filterStatus);
      
      const params = new URLSearchParams({
        page: currentPage,
        limit,
        ...(filterStatus !== 'all' && { status: filterStatus }),
        ...(searchTerm && { search: searchTerm })
      });

      console.log('Fetching messages with params:', params.toString());
      console.log('Filter status:', filterStatus);

      const response = await apiClient.get(`/admin/messages?${params}`);
      const data = response.data;
      
      console.log('Received messages:', data.messages);
      console.log('Messages count:', data.messages.length);
      
      // Apply client-side filter as backup to ensure consistency
      let filteredMessages = data.messages;
      if (filterStatus !== 'all') {
        filteredMessages = data.messages.filter(msg => msg.status === filterStatus);
        console.log('Client-side filtered messages:', filteredMessages.length);
      }
      
      setMessages(filteredMessages);
      setTotalPages(data.pagination.totalPages);
      setTotalMessages(data.pagination.totalMessages);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  useEffect(() => {
    fetchMessagesWithFilter();
    fetchStats();
  }, [currentPage]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm) {
        handleSearch();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'New': return 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200 transition-colors';
      case 'Read': return 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200 transition-colors';
      case 'Replied': return 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200 transition-colors';
      default: return 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200 transition-colors';
    }
  };

  const getPriorityIndicator = (message) => {
    const messageDate = new Date(message.created_at);
    const today = new Date();
    const daysSinceMessage = Math.ceil((today - messageDate) / (1000 * 60 * 60 * 24));
    
    if (message.status === 'New' && daysSinceMessage >= 3) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200 ml-2">
          <AlertCircle className="h-3 w-3 mr-1" />
          Urgent
        </span>
      );
    } else if (message.status === 'New' && daysSinceMessage >= 1) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200 ml-2">
          <Clock className="h-3 w-3 mr-1" />
          New
        </span>
      );
    }
    return null;
  };

  const getMessageUrgency = (message) => {
    const messageDate = new Date(message.created_at);
    const today = new Date();
    const daysSinceMessage = Math.ceil((today - messageDate) / (1000 * 60 * 60 * 24));
    
    if (message.status === 'New' && daysSinceMessage >= 3) {
      return 'urgent';
    } else if (message.status === 'New' && daysSinceMessage >= 1) {
      return 'new';
    }
    return 'normal';
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
        <div className="h-4 bg-gray-200 rounded w-40"></div>
      </td>
      <td className="px-6 py-4">
        <div className="h-6 bg-gray-200 rounded-full w-20"></div>
      </td>
      <td className="px-6 py-4">
        <div className="h-4 bg-gray-200 rounded w-24"></div>
      </td>
      <td className="px-6 py-4">
        <div className="flex space-x-2">
          <div className="h-8 w-8 bg-gray-200 rounded"></div>
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
        <div className="h-4 bg-gray-200 rounded w-40"></div>
        <div className="flex items-center justify-between">
          <div className="h-6 bg-gray-200 rounded-full w-20"></div>
          <div className="h-4 bg-gray-200 rounded w-24"></div>
        </div>
        <div className="flex space-x-2 pt-2">
          <div className="flex-1 h-8 bg-gray-200 rounded"></div>
          <div className="flex-1 h-8 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
  );

  const getStatusIcon = (status) => {
    switch (status) {
      case 'New': return <AlertCircle className="w-4 h-4" />;
      case 'Read': return <Clock className="w-4 h-4" />;
      case 'Replied': return <CheckCircle className="w-4 h-4" />;
      default: return <Mail className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Helper functions for Phase 1 improvements
  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setCurrentPage(1);
    fetchMessagesWithFilter('all');
  };

  const hasActiveFilters = () => {
    return searchTerm !== '' || statusFilter !== 'all';
  };

  if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Enhanced Header */}
        <div className="p-8 border-b border-gray-200 bg-gradient-to-r from-red-50 via-white to-red-50 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center space-x-4 mb-4 sm:mb-0">
              <div className="p-3 bg-gradient-to-br from-red-100 to-red-200 rounded-xl shadow-sm">
                <MessageSquare className="h-8 w-8 text-red-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Message Management</h1>
                <p className="text-gray-600 mt-1">Manage and respond to contact form messages from users</p>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-lg p-6 border border-blue-200">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl shadow-sm">
                <Mail className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-blue-700">Total Messages</p>
                <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl shadow-lg p-6 border border-orange-200">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl shadow-sm">
                <AlertCircle className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-orange-700">New Messages</p>
                <p className="text-2xl font-bold text-orange-900">{stats.new}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl shadow-lg p-6 border border-yellow-200">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-xl shadow-sm">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-yellow-700">Read Messages</p>
                <p className="text-2xl font-bold text-yellow-900">{stats.read_count}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-lg p-6 border border-green-200">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-br from-green-100 to-green-200 rounded-xl shadow-sm">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-green-700">Replied</p>
                <p className="text-2xl font-bold text-green-900">{stats.replied}</p>
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
                placeholder="Search messages by name, email, or subject..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                aria-label="Search messages"
                role="searchbox"
                aria-describedby="search-help"
              />
              <div id="search-help" className="sr-only">
                Search messages by sender name, email address, or message subject
              </div>
            </div>

            {/* Filter Controls */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <select
                  value={statusFilter}
                  onChange={(e) => handleFilterChange(e.target.value)}
                  className="pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors min-w-[150px]"
                  aria-label="Filter messages by status"
                  aria-describedby="status-filter-help"
                >
                  <option value="all">All Status</option>
                  <option value="New">New</option>
                  <option value="Read">Read</option>
                  <option value="Replied">Replied</option>
                </select>
                <div id="status-filter-help" className="sr-only">
                  Filter messages by their current status: new, read, or replied
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

              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setCurrentPage(1);
                  fetchMessagesWithFilter('all');
                }}
                className="px-4 py-3 text-gray-600 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors flex items-center focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                aria-label="Refresh messages"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </button>
            </div>
          </div>

          {/* Filter Chips */}
          {(searchTerm || statusFilter !== 'all') && (
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
              {statusFilter !== 'all' && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800 border border-green-200">
                  Status: {statusFilter}
                  <button
                    onClick={() => handleFilterChange('all')}
                    className="ml-2 hover:bg-green-200 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>

         

         {/* Enhanced Messages Table */}
         <div className="overflow-hidden rounded-2xl bg-white border border-gray-200 shadow-lg">
                  {loading ? (
          <>
            {/* Desktop Skeleton */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-gray-50 to-white">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Sender</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Subject</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
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
        ) : error ? (
            <div className="p-8 text-center">
              <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-4" />
              <p className="text-red-500">{error}</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No messages found</h3>
              <p className="text-gray-600 mb-4">
                {hasActiveFilters() 
                  ? "Try adjusting your search criteria or clear filters to see all messages."
                  : "No messages have been received yet."
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
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200" role="table" aria-label="Messages table">
                  <thead className="bg-gradient-to-r from-gray-50 to-white">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider" role="columnheader" scope="col">
                        Sender
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider" role="columnheader" scope="col">
                        Subject
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider" role="columnheader" scope="col">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider" role="columnheader" scope="col">
                        Date
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider" role="columnheader" scope="col">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {messages.map((message, index) => (
                      <tr key={message.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors`} role="row">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="text-base font-semibold text-gray-900">{message.name}</span>
                            <span className="text-sm text-gray-600">{message.email}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 max-w-xs truncate">
                            {message.subject}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border transition-colors ${getStatusColor(message.status)}`}>
                              {getStatusIcon(message.status)}
                              <span className="ml-1">{message.status}</span>
                            </span>
                            {getPriorityIndicator(message)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(message.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => viewMessage(message.id)}
                              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                              aria-label={`View details for message from ${message.name}`}
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {message.status !== 'Replied' && (
                              <button
                                onClick={() => {
                                  setSelectedMessage(message);
                                  setShowResponseModal(true);
                                }}
                                className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                                aria-label={`Respond to message from ${message.name}`}
                              >
                                <MessageSquare className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => deleteMessage(message.id)}
                              className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                              aria-label={`Delete message from ${message.name}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card Layout */}
              <div className="lg:hidden">
                {messages.map((message, index) => (
                  <div key={message.id} className={`p-4 border-b border-gray-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors`}>
                    <div className="flex flex-col space-y-3">
                      {/* Sender Info */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-base font-semibold text-gray-900">{message.name}</h3>
                          <p className="text-sm text-gray-600">{message.email}</p>
                        </div>
                        <button
                          onClick={() => viewMessage(message.id)}
                          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                          aria-label={`View details for message from ${message.name}`}
                        >
                          <Eye className="h-5 w-5" />
                        </button>
                      </div>

                      {/* Subject */}
                      <div>
                        <p className="text-sm text-gray-900 font-medium">{message.subject}</p>
                      </div>

                      {/* Status & Date */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border transition-colors ${getStatusColor(message.status)}`}>
                            {getStatusIcon(message.status)}
                            <span className="ml-1">{message.status}</span>
                          </span>
                          {getPriorityIndicator(message)}
                        </div>
                        <span className="text-sm text-gray-500">{formatDate(message.created_at)}</span>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex space-x-2 pt-2">
                        {message.status !== 'Replied' && (
                          <button
                            onClick={() => {
                              setSelectedMessage(message);
                              setShowResponseModal(true);
                            }}
                            className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                            aria-label={`Respond to message from ${message.name}`}
                          >
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Respond
                          </button>
                        )}
                        <button
                          onClick={() => deleteMessage(message.id)}
                          className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                          aria-label={`Delete message from ${message.name}`}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Enhanced Pagination */}
              {totalPages > 1 && (
                <div className="mt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between border-t border-gray-200 pt-6 pb-6 px-6">
                  <span className="text-sm text-gray-700 mb-4 sm:mb-0">
                    Showing {(currentPage - 1) * limit + 1} to {Math.min(currentPage * limit, totalMessages)} of {totalMessages} results
                  </span>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-4 py-2 border border-gray-300 rounded-xl text-sm disabled:opacity-50 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                      aria-label="Go to previous page"
                      aria-disabled={currentPage === 1}
                    >
                      Previous
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-4 py-2 border rounded-xl text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 ${
                          page === currentPage 
                            ? 'bg-red-600 text-white border-red-600' 
                            : 'border-gray-300 hover:bg-gray-50'
                        }`}
                        aria-label={`Go to page ${page}`}
                        aria-current={page === currentPage ? 'page' : undefined}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 border border-gray-300 rounded-xl text-sm disabled:opacity-50 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                      aria-label="Go to next page"
                      aria-disabled={currentPage === totalPages}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Enhanced Message Detail Modal */}
        {showModal && selectedMessage && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] shadow-2xl overflow-hidden flex flex-col">
              {/* Fixed Header */}
              <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-red-50 to-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <MessageSquare className="h-5 w-5 text-red-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">Message Details</h2>
                  </div>
                  <button 
                    onClick={() => setShowModal(false)}
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
                  {/* Sender Information Card */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                      <div className="p-1 bg-blue-100 rounded-lg mr-2">
                        <Mail className="h-4 w-4 text-blue-600" />
                      </div>
                      Sender Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <p className="text-sm text-gray-900 bg-white p-2 rounded-lg border">{selectedMessage.name}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <p className="text-sm text-gray-900 bg-white p-2 rounded-lg border">{selectedMessage.email}</p>
                      </div>
                    </div>
                  </div>

                  {/* Message Content Card */}
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                      <div className="p-1 bg-green-100 rounded-lg mr-2">
                        <MessageSquare className="h-4 w-4 text-green-600" />
                      </div>
                      Message Content
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                        <p className="text-sm text-gray-900 bg-white p-2 rounded-lg border">{selectedMessage.subject}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                        <div className="bg-white p-3 rounded-lg border">
                          <p className="text-sm text-gray-900 whitespace-pre-wrap">{selectedMessage.message}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Status & Date Card */}
                  <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-xl border border-yellow-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                      <div className="p-1 bg-yellow-100 rounded-lg mr-2">
                        <Clock className="h-4 w-4 text-yellow-600" />
                      </div>
                      Status & Date
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date Received</label>
                        <p className="text-sm text-gray-900 bg-white p-2 rounded-lg border">{formatDate(selectedMessage.created_at)}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <select
                          value={selectedMessage.status}
                          onChange={(e) => updateMessageStatus(selectedMessage.id, e.target.value)}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 sm:text-sm"
                        >
                          <option value="New">New</option>
                          <option value="Read">Read</option>
                          <option value="Replied">Replied</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Admin Response Card */}
                  {selectedMessage.admin_response && (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                        <div className="p-1 bg-green-100 rounded-lg mr-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        </div>
                        Admin Response
                      </h3>
                      <div className="bg-white p-3 rounded-lg border border-green-200">
                        <p className="text-sm text-gray-900 whitespace-pre-wrap">{selectedMessage.admin_response}</p>
                        <p className="text-xs text-green-600 mt-2">
                          Responded on {formatDate(selectedMessage.responded_at)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Fixed Footer */}
              <div className="flex-shrink-0 px-6 py-4 border-t border-gray-200 bg-gray-50">
                <div className="flex justify-end space-x-3">
                  {selectedMessage.status !== 'Replied' && (
                    <button
                      onClick={() => {
                        setShowModal(false);
                        setShowResponseModal(true);
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
                    >
                      Respond
                    </button>
                  )}
                  <button
                    onClick={() => deleteMessage(selectedMessage.id)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
                  >
                    Delete Message
                  </button>
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

         {/* Enhanced Response Modal */}
         {showResponseModal && selectedMessage && (
           <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
             <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] shadow-2xl overflow-hidden flex flex-col">
               {/* Fixed Header */}
               <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-white">
                 <div className="flex items-center justify-between">
                   <div className="flex items-center space-x-3">
                     <div className="p-2 bg-green-100 rounded-lg">
                       <MessageSquare className="h-5 w-5 text-green-600" />
                     </div>
                     <h2 className="text-xl font-bold text-gray-900">Respond to Message</h2>
                   </div>
                   <button 
                     onClick={() => {
                       setShowResponseModal(false);
                       setResponseText('');
                     }}
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
                   {/* Sender Information */}
                   <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200">
                     <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                       <div className="p-1 bg-blue-100 rounded-lg mr-2">
                         <Mail className="h-4 w-4 text-blue-600" />
                       </div>
                       Sender Information
                     </h3>
                     <div className="space-y-2">
                       <div>
                         <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
                         <p className="text-sm text-gray-900 bg-white p-2 rounded-lg border">{selectedMessage.name} ({selectedMessage.email})</p>
                       </div>
                       <div>
                         <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                         <p className="text-sm text-gray-900 bg-white p-2 rounded-lg border">{selectedMessage.subject}</p>
                       </div>
                     </div>
                   </div>

                   {/* Original Message */}
                   <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-xl border border-gray-200">
                     <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                       <div className="p-1 bg-gray-100 rounded-lg mr-2">
                         <MessageSquare className="h-4 w-4 text-gray-600" />
                       </div>
                       Original Message
                     </h3>
                     <div className="bg-white p-3 rounded-lg border">
                       <p className="text-sm text-gray-900 whitespace-pre-wrap">{selectedMessage.message}</p>
                     </div>
                   </div>

                   {/* Response Form */}
                   <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200">
                     <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                       <div className="p-1 bg-green-100 rounded-lg mr-2">
                         <Edit className="h-4 w-4 text-green-600" />
                       </div>
                       Your Response
                     </h3>
                     <div>
                       <label className="block text-sm font-medium text-gray-700 mb-2">Response Message</label>
                       <textarea
                         value={responseText}
                         onChange={(e) => setResponseText(e.target.value)}
                         rows={6}
                         placeholder="Type your response here..."
                         className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm"
                       />
                     </div>
                   </div>
                 </div>
               </div>

               {/* Fixed Footer */}
               <div className="flex-shrink-0 px-6 py-4 border-t border-gray-200 bg-gray-50">
                 <div className="flex justify-end space-x-3">
                   <button
                     onClick={() => {
                       setShowResponseModal(false);
                       setResponseText('');
                     }}
                     className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                   >
                     Cancel
                   </button>
                   <button
                     onClick={() => sendResponse(selectedMessage.id)}
                     disabled={responding || !responseText.trim()}
                     className={`px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors ${
                       responding || !responseText.trim()
                         ? 'bg-gray-400 cursor-not-allowed text-white'
                         : 'bg-green-600 text-white hover:bg-green-700'
                     }`}
                   >
                     {responding ? (
                       <div className="flex items-center">
                         <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                         Sending...
                       </div>
                     ) : (
                       'Send Response'
                     )}
                   </button>
                 </div>
               </div>
             </div>
           </div>
         )}

         {/* Enhanced Error Toast */}
         {error && (
           <div className="fixed bottom-4 right-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg shadow-lg max-w-sm">
             <div className="flex items-center">
               <AlertCircle className="h-5 w-5 mr-2" />
               <span className="flex-1">{error}</span>
               <button
                 onClick={() => setError('')}
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
     </div>
   );
 };

export default MessageManagement;
