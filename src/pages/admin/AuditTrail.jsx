import React, { useState, useEffect } from 'react';
import { Search, Filter, Calendar, User, Activity, Eye, ChevronDown, ChevronUp, X, Clock, AlertCircle, CheckCircle, Edit, Trash, UserPlus, UserX, Bell, Building2 } from 'lucide-react';
import AdminLayout from '../../components/layout/AdminDashboardLayout';

const AuditTrail = () => {
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    admin_id: '',
    action: '',
    entity_type: '',
    start_date: '',
    end_date: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [filterOptions, setFilterOptions] = useState({
    actions: [],
    entity_types: [],
    admins: []
  });
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchAuditLogs();
    fetchFilterOptions();
    fetchStats();
  }, [currentPage, itemsPerPage, filters, searchTerm]);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('token');
      const params = new URLSearchParams({
        page: currentPage,
        limit: itemsPerPage,
        ...filters
      });

      if (searchTerm) {
        params.append('search', searchTerm);
      }

      const response = await fetch(`http://localhost:5000/api/admin/audit-logs?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setAuditLogs(data.data);
        setTotalPages(data.pagination.total_pages);
        setTotalItems(data.pagination.total);
      } else {
        setError('Failed to fetch audit logs');
      }
    } catch (error) {
      setError('Failed to fetch audit logs');
    } finally {
      setLoading(false);
    }
  };

  const fetchFilterOptions = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/admin/audit-logs/filters/options', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setFilterOptions(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch filter options:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/admin/audit-logs/stats/summary', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      admin_id: '',
      action: '',
      entity_type: '',
      start_date: '',
      end_date: ''
    });
    setSearchTerm('');
    setCurrentPage(1);
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  const hasActiveFilters = () => {
    return Object.values(filters).some(value => value !== '') || searchTerm !== '';
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'CREATE_USER':
        return <UserPlus className="h-4 w-4" />;
      case 'UPDATE_USER':
        return <Edit className="h-4 w-4" />;
      case 'CHANGE_USER_STATUS':
        return <UserX className="h-4 w-4" />;
      case 'CREATE_DONATION':
        return <Activity className="h-4 w-4" />;
      case 'UPDATE_DONATION':
        return <Edit className="h-4 w-4" />;
      case 'CREATE_CAMPAIGN':
        return <Calendar className="h-4 w-4" />;
      case 'UPDATE_CAMPAIGN':
        return <Edit className="h-4 w-4" />;
      case 'DELETE_CAMPAIGN':
        return <Trash className="h-4 w-4" />;
      case 'CHANGE_APPOINTMENT_STATUS':
        return <Edit className="h-4 w-4" />;
      case 'COMPLETE_APPOINTMENT':
        return <CheckCircle className="h-4 w-4" />;
      case 'UPDATE_APPOINTMENT_TIME':
        return <Clock className="h-4 w-4" />;
      case 'UPDATE_INVENTORY':
        return <Activity className="h-4 w-4" />;
      case 'UPDATE_MESSAGE_STATUS':
        return <Edit className="h-4 w-4" />;
      case 'RESPOND_TO_MESSAGE':
        return <CheckCircle className="h-4 w-4" />;
      case 'DELETE_MESSAGE':
        return <Trash className="h-4 w-4" />;
      case 'CREATE_BLOOD_BANK':
        return <Building2 className="h-4 w-4" />;
      case 'UPDATE_BLOOD_BANK':
        return <Edit className="h-4 w-4" />;
      case 'DELETE_BLOOD_BANK':
        return <Trash className="h-4 w-4" />;
      case 'SEND_NOTIFICATION':
        return <Bell className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getActionColor = (action) => {
    if (action.includes('CREATE')) return 'text-green-600 bg-green-100';
    if (action.includes('UPDATE')) return 'text-blue-600 bg-blue-100';
    if (action.includes('DELETE')) return 'text-red-600 bg-red-100';
    if (action.includes('STATUS')) return 'text-yellow-600 bg-yellow-100';
    return 'text-gray-600 bg-gray-100';
  };

  const formatActionName = (action) => {
    const actionMap = {
      'CREATE_USER': 'Create User',
      'UPDATE_USER': 'Update User',
      'CHANGE_USER_STATUS': 'Change User Status',
      'CREATE_DONATION': 'Create Donation',
      'UPDATE_DONATION': 'Update Donation',
      'CREATE_CAMPAIGN': 'Create Campaign',
      'UPDATE_CAMPAIGN': 'Update Campaign',
      'DELETE_CAMPAIGN': 'Delete Campaign',
      'CHANGE_APPOINTMENT_STATUS': 'Change Appointment Status',
      'COMPLETE_APPOINTMENT': 'Complete Appointment',
      'UPDATE_APPOINTMENT_TIME': 'Update Appointment Time',
      'UPDATE_INVENTORY': 'Update Inventory',
      'UPDATE_MESSAGE_STATUS': 'Update Message Status',
      'RESPOND_TO_MESSAGE': 'Respond to Message',
      'DELETE_MESSAGE': 'Delete Message',
      'CREATE_BLOOD_BANK': 'Create Blood Bank',
      'UPDATE_BLOOD_BANK': 'Update Blood Bank',
      'DELETE_BLOOD_BANK': 'Delete Blood Bank',
      'SEND_NOTIFICATION': 'Send Notification'
    };
    
    return actionMap[action] || action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const AuditDetailsModal = ({ log, onClose }) => {
    const formatValue = (value) => {
      if (typeof value === 'object' && value !== null) {
        return JSON.stringify(value, null, 2);
      }
      return String(value);
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] shadow-2xl overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white flex-shrink-0">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <Activity className="h-6 w-6 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Audit Log Details</h2>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <User className="h-5 w-5 mr-2 text-blue-600" />
                    Admin Information
                  </h3>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm font-medium text-gray-600">Admin:</span>
                      <p className="text-sm text-gray-900">{log.admin_name}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Action:</span>
                      <p className="text-sm text-gray-900">{formatActionName(log.action)}</p>
                    </div>
                                         <div>
                       <span className="text-sm font-medium text-gray-600">Entity:</span>
                       <p className="text-sm text-gray-900">{log.entity_type.charAt(0).toUpperCase() + log.entity_type.slice(1)} - {log.entity_name}</p>
                     </div>
                  </div>
                </div>

                <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <Clock className="h-5 w-5 mr-2 text-green-600" />
                    Timestamp & Location
                  </h3>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm font-medium text-gray-600">Date & Time:</span>
                      <p className="text-sm text-gray-900">{new Date(log.created_at).toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">IP Address:</span>
                      <p className="text-sm text-gray-900">{log.ip_address || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Changes */}
              <div className="space-y-4">
                {log.old_values && (
                  <div className="p-4 bg-gradient-to-r from-red-50 to-pink-50 rounded-xl border border-red-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                      <AlertCircle className="h-5 w-5 mr-2 text-red-600" />
                      Previous Values
                    </h3>
                    <pre className="text-xs text-gray-700 bg-white p-3 rounded border overflow-x-auto">
                      {formatValue(log.old_values)}
                    </pre>
                  </div>
                )}

                {log.new_values && (
                  <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                      <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                      New Values
                    </h3>
                    <pre className="text-xs text-gray-700 bg-white p-3 rounded border overflow-x-auto">
                      {formatValue(log.new_values)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-white flex-shrink-0">
            <button
              onClick={onClose}
              className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  const StatsCard = ({ title, value, icon: Icon, color }) => (
    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
      <div className="flex items-center">
        <div className={`p-2 rounded-lg ${color} flex-shrink-0`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div className="ml-3 flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-600 truncate">{title}</p>
          <p className="text-sm font-bold text-gray-900 truncate" title={value}>{value}</p>
        </div>
      </div>
    </div>
  );

  return (
    <AdminLayout>
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {/* Header */}
        <div className="p-8 border-b border-gray-200 bg-gradient-to-r from-red-50 via-white to-red-50">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-br from-red-100 to-red-200 rounded-xl shadow-sm">
                <Activity className="h-8 w-8 text-red-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Audit Trail</h1>
                <p className="text-gray-600 mt-1">Track all administrative actions and changes</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="p-6 border-b border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <StatsCard
                title="Total Actions (30 days)"
                value={stats.total_actions}
                icon={Activity}
                color="bg-blue-500"
              />
              <StatsCard
                title="Most Active Admin"
                value={stats.active_admins[0]?.admin_name || 'N/A'}
                icon={User}
                color="bg-green-500"
              />
                             <StatsCard
                 title="Top Action Type"
                 value={formatActionName(stats.actions_by_type[0]?.action) || 'N/A'}
                 icon={CheckCircle}
                 color="bg-purple-500"
               />
              <StatsCard
                title="Most Modified Entity"
                value={stats.actions_by_entity[0]?.entity_type ? stats.actions_by_entity[0].entity_type.charAt(0).toUpperCase() + stats.actions_by_entity[0].entity_type.slice(1) : 'N/A'}
                icon={Edit}
                color="bg-orange-500"
              />
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Search */}
            <div className="flex-1 max-w-2xl">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search audit logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                />
              </div>
            </div>

            {/* Filter Toggle */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-4 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors flex items-center"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
                {hasActiveFilters() && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    Active
                  </span>
                )}
              </button>

              {hasActiveFilters() && (
                <button
                  onClick={clearFilters}
                  className="px-4 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors flex items-center"
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Admin</label>
                  <select
                    value={filters.admin_id}
                    onChange={(e) => handleFilterChange('admin_id', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  >
                    <option value="">All Admins</option>
                    {filterOptions.admins.map(admin => (
                      <option key={admin.id} value={admin.id}>{admin.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Action</label>
                  <select
                    value={filters.action}
                    onChange={(e) => handleFilterChange('action', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  >
                    <option value="">All Actions</option>
                    {filterOptions.actions.map(action => (
                      <option key={action} value={action}>{formatActionName(action)}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Entity Type</label>
                  <select
                    value={filters.entity_type}
                    onChange={(e) => handleFilterChange('entity_type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  >
                    <option value="">All Types</option>
                                         {filterOptions.entity_types.map(type => (
                       <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                     ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                  <input
                    type="date"
                    value={filters.start_date}
                    onChange={(e) => handleFilterChange('start_date', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                  <input
                    type="date"
                    value={filters.end_date}
                    onChange={(e) => handleFilterChange('end_date', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Audit Logs Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Admin & Action
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Entity
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  IP Address
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center space-y-4">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
                      <p className="text-gray-500">Loading audit logs...</p>
                    </div>
                  </td>
                </tr>
              ) : auditLogs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center space-y-4">
                      <Activity className="h-12 w-12 text-gray-400" />
                      <p className="text-gray-500">No audit logs found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                auditLogs.map((log, index) => (
                  <tr key={log.id} className={`hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${getActionColor(log.action)}`}>
                          {getActionIcon(log.action)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{log.admin_name}</p>
                          <p className="text-sm text-gray-600">{formatActionName(log.action)}</p>
                        </div>
                      </div>
                    </td>
                                         <td className="px-6 py-4">
                       <div>
                         <p className="text-sm font-medium text-gray-900">{log.entity_name}</p>
                         <p className="text-sm text-gray-600 capitalize">{log.entity_type}</p>
                       </div>
                     </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="h-4 w-4 mr-2" />
                        {new Date(log.created_at).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600">{log.ip_address || 'N/A'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => {
                          setSelectedLog(log);
                          setShowDetailsModal(true);
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View details"
                      >
                        <Eye className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-6 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="text-sm text-gray-700">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} entries
              </div>
              <div className="flex items-center space-x-2">
                <label htmlFor="items-per-page" className="text-sm text-gray-600">
                  Show:
                </label>
                <select
                  id="items-per-page"
                  value={itemsPerPage}
                  onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
                <span className="text-sm text-gray-600">per page</span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                Previous
              </button>
              <div className="flex space-x-1">
                {(() => {
                  const pages = [];
                  const maxVisiblePages = 5;
                  
                  if (totalPages <= maxVisiblePages) {
                    // Show all pages if total is small
                    for (let i = 1; i <= totalPages; i++) {
                      pages.push(i);
                    }
                  } else {
                    // Show smart pagination
                    if (currentPage <= 3) {
                      // Show first 4 pages + last page
                      for (let i = 1; i <= 4; i++) {
                        pages.push(i);
                      }
                      pages.push('...');
                      pages.push(totalPages);
                    } else if (currentPage >= totalPages - 2) {
                      // Show first page + last 4 pages
                      pages.push(1);
                      pages.push('...');
                      for (let i = totalPages - 3; i <= totalPages; i++) {
                        pages.push(i);
                      }
                    } else {
                      // Show first page + current range + last page
                      pages.push(1);
                      pages.push('...');
                      for (let i = currentPage - 1; i <= currentPage + 1; i++) {
                        pages.push(i);
                      }
                      pages.push('...');
                      pages.push(totalPages);
                    }
                  }
                  
                  return pages.map((page, index) => {
                    if (page === '...') {
                      return (
                        <span key={`ellipsis-${index}`} className="px-3 py-2 text-gray-500">
                          ...
                        </span>
                      );
                    }
                    
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-2 border rounded-lg text-sm font-medium transition-colors ${
                          currentPage === page
                            ? 'bg-red-600 text-white border-red-600'
                            : 'border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  });
                })()}
              </div>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                Next
              </button>
              {totalPages > 10 && (
                <div className="flex items-center space-x-2 ml-4 pl-4 border-l border-gray-300">
                  <span className="text-sm text-gray-600">Go to:</span>
                  <input
                    type="number"
                    min="1"
                    max={totalPages}
                    value={currentPage}
                    onChange={(e) => {
                      const page = parseInt(e.target.value);
                      if (page >= 1 && page <= totalPages) {
                        setCurrentPage(page);
                      }
                    }}
                    className="w-16 px-2 py-1 border border-gray-300 rounded text-sm text-center focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="p-6 bg-red-50 border-l-4 border-red-400 text-red-700 mx-6 mb-6 rounded-xl flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedLog && (
        <AuditDetailsModal
          log={selectedLog}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedLog(null);
          }}
        />
      )}
    </AdminLayout>
  );
};

export default AuditTrail;
