import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, Eye, Trash2, Mail, 
  Clock, CheckCircle, MessageSquare, ArrowLeft, ArrowRight,
  RefreshCw, AlertCircle
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
      case 'New': return 'bg-blue-100 text-blue-800';
      case 'Read': return 'bg-yellow-100 text-yellow-800';
      case 'Replied': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

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
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Message Management</h1>
          <p className="text-gray-600">Manage and respond to contact form messages from users</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Mail className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Messages</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <AlertCircle className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">New Messages</p>
                <p className="text-2xl font-bold text-blue-600">{stats.new}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Read Messages</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.read_count}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Replied</p>
                <p className="text-2xl font-bold text-green-600">{stats.replied}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search messages..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                                 <select
                   value={statusFilter}
                   onChange={(e) => handleFilterChange(e.target.value)}
                   className={`px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                     statusFilter !== 'all' ? 'border-red-300 bg-red-50' : 'border-gray-300'
                   }`}
                 >
                   <option value="all">All Status</option>
                   <option value="New">New</option>
                   <option value="Read">Read</option>
                   <option value="Replied">Replied</option>
                 </select>

                                 {statusFilter !== 'all' && (
                   <button
                     onClick={() => handleFilterChange('all')}
                     className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm"
                   >
                     Clear Filter
                   </button>
                 )}
                 <button
                   onClick={() => {
                     setSearchTerm('');
                     setStatusFilter('all');
                     setCurrentPage(1);
                     fetchMessagesWithFilter('all');
                   }}
                   className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                 >
                   <RefreshCw className="w-4 h-4" />
                 </button>
              </div>
            </div>
          </div>
        </div>

         

         {/* Messages Table */}
         <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-4" />
              <p className="text-gray-500">Loading messages...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-4" />
              <p className="text-red-500">{error}</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="p-8 text-center">
              <Mail className="w-8 h-8 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No messages found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sender
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Subject
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {messages.map((message) => (
                      <tr key={message.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{message.name}</div>
                            <div className="text-sm text-gray-500">{message.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 max-w-xs truncate">
                            {message.subject}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(message.status)}`}>
                            {getStatusIcon(message.status)}
                            <span className="ml-1">{message.status}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(message.created_at)}
                        </td>
                                                 <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                           <div className="flex space-x-2">
                             <button
                               onClick={() => viewMessage(message.id)}
                               className="text-blue-600 hover:text-blue-900 p-1 rounded"
                               title="View Message"
                             >
                               <Eye className="w-4 h-4" />
                             </button>
                             {message.status !== 'Replied' && (
                               <button
                                 onClick={() => {
                                   setSelectedMessage(message);
                                   setShowResponseModal(true);
                                 }}
                                 className="text-green-600 hover:text-green-900 p-1 rounded"
                                 title="Respond to Message"
                               >
                                 <MessageSquare className="w-4 h-4" />
                               </button>
                             )}
                             <button
                               onClick={() => deleteMessage(message.id)}
                               className="text-red-600 hover:text-red-900 p-1 rounded"
                               title="Delete Message"
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

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Showing <span className="font-medium">{(currentPage - 1) * limit + 1}</span> to{' '}
                        <span className="font-medium">
                          {Math.min(currentPage * limit, totalMessages)}
                        </span>{' '}
                        of <span className="font-medium">{totalMessages}</span> results
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                        <button
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ArrowLeft className="w-4 h-4" />
                        </button>
                        
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              page === currentPage
                                ? 'z-10 bg-red-50 border-red-500 text-red-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        ))}
                        
                        <button
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Message Detail Modal */}
        {showModal && selectedMessage && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Message Details</h3>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <span className="sr-only">Close</span>
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Name</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedMessage.name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedMessage.email}</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Subject</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedMessage.subject}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Message</label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-900 whitespace-pre-wrap">{selectedMessage.message}</p>
                    </div>
                  </div>

                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                       <label className="block text-sm font-medium text-gray-700">Date</label>
                       <p className="mt-1 text-sm text-gray-900">{formatDate(selectedMessage.created_at)}</p>
                     </div>
                     <div>
                       <label className="block text-sm font-medium text-gray-700">Status</label>
                       <div className="mt-1">
                         <select
                           value={selectedMessage.status}
                           onChange={(e) => updateMessageStatus(selectedMessage.id, e.target.value)}
                           className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                         >
                           <option value="New">New</option>
                           <option value="Read">Read</option>
                           <option value="Replied">Replied</option>
                         </select>
                       </div>
                     </div>
                   </div>

                   {selectedMessage.admin_response && (
                     <div>
                       <label className="block text-sm font-medium text-gray-700">Admin Response</label>
                       <div className="mt-1 p-3 bg-green-50 rounded-lg border border-green-200">
                         <p className="text-sm text-gray-900 whitespace-pre-wrap">{selectedMessage.admin_response}</p>
                         <p className="text-xs text-green-600 mt-2">
                           Responded on {formatDate(selectedMessage.responded_at)}
                         </p>
                       </div>
                     </div>
                   )}
                </div>

                                 <div className="mt-6 flex justify-end space-x-3">
                   {selectedMessage.status !== 'Replied' && (
                     <button
                       onClick={() => {
                         setShowModal(false);
                         setShowResponseModal(true);
                       }}
                       className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                     >
                       Respond
                     </button>
                   )}
                   <button
                     onClick={() => deleteMessage(selectedMessage.id)}
                     className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                   >
                     Delete Message
                   </button>
                   <button
                     onClick={() => setShowModal(false)}
                     className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                   >
                     Close
                   </button>
                 </div>
              </div>
            </div>
          </div>
                 )}

         {/* Response Modal */}
         {showResponseModal && selectedMessage && (
           <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
             <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
               <div className="mt-3">
                 <div className="flex items-center justify-between mb-4">
                   <h3 className="text-lg font-medium text-gray-900">Respond to Message</h3>
                   <button
                     onClick={() => {
                       setShowResponseModal(false);
                       setResponseText('');
                     }}
                     className="text-gray-400 hover:text-gray-600"
                   >
                     <span className="sr-only">Close</span>
                     <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                     </svg>
                   </button>
                 </div>

                 <div className="space-y-4">
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-2">From</label>
                     <p className="text-sm text-gray-900">{selectedMessage.name} ({selectedMessage.email})</p>
                   </div>

                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                     <p className="text-sm text-gray-900">{selectedMessage.subject}</p>
                   </div>

                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-2">Original Message</label>
                     <div className="p-3 bg-gray-50 rounded-lg">
                       <p className="text-sm text-gray-900 whitespace-pre-wrap">{selectedMessage.message}</p>
                     </div>
                   </div>

                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-2">Your Response</label>
                     <textarea
                       value={responseText}
                       onChange={(e) => setResponseText(e.target.value)}
                       rows={4}
                       placeholder="Type your response here..."
                       className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                     />
                   </div>
                 </div>

                 <div className="mt-6 flex justify-end space-x-3">
                   <button
                     onClick={() => {
                       setShowResponseModal(false);
                       setResponseText('');
                     }}
                     className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                   >
                     Cancel
                   </button>
                   <button
                     onClick={() => sendResponse(selectedMessage.id)}
                     disabled={responding || !responseText.trim()}
                     className={`px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 ${
                       responding || !responseText.trim()
                         ? 'bg-gray-400 cursor-not-allowed'
                         : 'bg-red-600 text-white hover:bg-red-700'
                     }`}
                   >
                     {responding ? 'Sending...' : 'Send Response'}
                   </button>
                 </div>
               </div>
             </div>
           </div>
         )}
       </div>
     </div>
   );
 };

export default MessageManagement;
