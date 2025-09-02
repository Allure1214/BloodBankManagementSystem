import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Users2, 
  Database, 
  CalendarDays, 
  Building2, 
  Droplet, 
  ClipboardList, 
  Search,
  MoreVertical,
  UserX,
  Ban,
  Mail,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  X,
  Filter,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Eye
} from 'lucide-react';


const SettingsPage = () => {
  const [admins, setAdmins] = useState([]);
  const [filteredAdmins, setFilteredAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedAdmins, setSelectedAdmins] = useState([]);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const entriesOptions = [10, 25, 50];

  // Permission configuration
  const permissionConfig = [
    { key: 'can_manage_inventory', icon: <Database className="w-4 h-4" />, label: 'Manage Blood Inventory' },
    { key: 'can_manage_campaigns', icon: <CalendarDays className="w-4 h-4" />, label: 'Manage Campaigns' },
    { key: 'can_manage_blood_banks', icon: <Building2 className="w-4 h-4" />, label: 'Manage Blood Banks' },
    { key: 'can_manage_donations', icon: <Droplet className="w-4 h-4" />, label: 'Manage Donations' },
    { key: 'can_manage_appointments', icon: <ClipboardList className="w-4 h-4" />, label: 'Manage Appointments' },
    { key: 'can_manage_reports', icon: <BarChart3 className="w-4 h-4" />, label: 'Manage Reports' },
  ];

  useEffect(() => {
    fetchAdmins();
  }, []);

  useEffect(() => {
    handleSearch(searchQuery);
    // Reset to first page when search query changes
    setCurrentPage(1);
  }, [searchQuery, admins]);

  // Helper functions
  const clearAllFilters = () => {
    setSearchQuery('');
    setCurrentPage(1);
  };

  const hasActiveFilters = () => {
    return searchQuery !== '';
  };

  const getAdminRole = (admin) => {
    // All users are treated as admin
    return 'admin';
  };

  const getRoleStyle = (role) => {
    return 'bg-blue-100 text-blue-800 border-blue-200';
  };

  const getRoleIcon = (role) => {
    return <Users2 className="w-4 h-4" />;
  };

  const totalPages = Math.ceil(filteredAdmins.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;
  const currentEntries = filteredAdmins.slice(startIndex, endIndex);

  const handleEntriesChange = (value) => {
    setEntriesPerPage(value);
    setCurrentPage(1); // Reset to first page when changing entries per page
  };

  // Handle click outside dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openDropdownId && !event.target.closest('.admin-dropdown')) {
        setOpenDropdownId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openDropdownId]);

  const fetchAdmins = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/permission/normal-admins', {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch admins');
      
      const data = await response.json();
      if (data.success) {
        setAdmins(data.admins);
        setFilteredAdmins(data.admins);
      }
    } catch (err) {
      setError('Failed to load admin users');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query) => {
    let filtered = admins.filter(admin => {
      const matchesSearch = query === '' || 
        admin.name.toLowerCase().includes(query.toLowerCase()) ||
        admin.email.toLowerCase().includes(query.toLowerCase());
      
      return matchesSearch;
    });

    // Sort filtered results
    filtered.sort((a, b) => {
      let aValue, bValue;
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'email':
          aValue = a.email.toLowerCase();
          bValue = b.email.toLowerCase();
          break;
        case 'permissions':
          aValue = Object.values(a.permissions || {}).filter(Boolean).length;
          bValue = Object.values(b.permissions || {}).filter(Boolean).length;
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredAdmins(filtered);
  };

  const handlePermissionChange = async (adminId, permission, newValue) => {
    setSavingId(adminId);
    try {
      const response = await fetch(`http://localhost:5000/api/admin/permission/${adminId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        },
        body: JSON.stringify({
          [permission]: newValue
        })
      });

      if (!response.ok) throw new Error('Failed to update permissions');

      setAdmins(admins.map(admin => {
        if (admin.id === adminId) {
          return {
            ...admin,
            permissions: {
              ...admin.permissions,
              [permission]: newValue
            }
          };
        }
        return admin;
      }));

    } catch (err) {
      setError('Failed to update permissions');
      console.error(err);
    } finally {
      setSavingId(null);
    }
  };

  const toggleDropdown = (adminId) => {
    setOpenDropdownId(openDropdownId === adminId ? null : adminId);
  };

  const handleDeactivateAdmin = async (adminId) => {
    // Implement deactivate functionality
    console.log('Deactivate admin:', adminId);
    setOpenDropdownId(null);
  };

  const handleRemoveAdmin = async (adminId) => {
    // Implement remove functionality
    console.log('Remove admin:', adminId);
    setOpenDropdownId(null);
  };

  const handleContactAdmin = async (adminEmail) => {
    window.location.href = `mailto:${adminEmail}`;
    setOpenDropdownId(null);
  };

  const handleViewAdmin = (admin) => {
    setSelectedAdmin(admin);
    setShowDetailModal(true);
  };

  const handleBulkPermissionChange = async (permission, newValue) => {
    if (selectedAdmins.length === 0) return;
    
    setIsSubmitting(true);
    try {
      const promises = selectedAdmins.map(adminId => 
        fetch(`http://localhost:5000/api/admin/permission/${adminId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionStorage.getItem('token')}`
          },
          body: JSON.stringify({
            [permission]: newValue
          })
        })
      );

      await Promise.all(promises);
      setSuccessMessage(`Updated ${permission} for ${selectedAdmins.length} admins`);
      setSelectedAdmins([]);
      fetchAdmins(); // Refresh data
    } catch (error) {
      setErrorMessage('Failed to update permissions');
    } finally {
      setIsSubmitting(false);
    }
  };





  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      {/* Enhanced Header - Matching Notification Management Style */}
      <div className="mb-8">
        <div className="p-8 border-b border-gray-200 bg-gradient-to-r from-red-50 via-white to-red-50">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center space-x-4 mb-4 sm:mb-0">
              <div className="p-3 bg-gradient-to-br from-red-100 to-red-200 rounded-xl shadow-sm">
                <Settings className="h-8 w-8 text-red-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Admin Permission Settings</h1>
                <p className="text-gray-600 mt-1">Manage permissions and roles for admin users</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Filter Section */}
      <div className="bg-gradient-to-r from-gray-50 to-white rounded-2xl p-6 shadow-lg border border-gray-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-red-100 rounded-lg">
            <Filter className="w-5 h-5 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800">Search & Filters</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Search */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Search Admins</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
              />
            </div>
          </div>

          {/* Sort Options */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Sort By</label>
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="flex-1 px-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
              >
                <option value="name">Name</option>
                <option value="email">Email</option>
                <option value="permissions">Permissions</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-3 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-all"
                title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>
        </div>

        {/* Filter Chips */}
        <div className="flex flex-wrap gap-2 mt-4">
          {searchQuery && (
            <span className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
              Search: "{searchQuery}"
              <button onClick={() => setSearchQuery('')} className="hover:bg-blue-200 rounded-full p-0.5">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 mt-6">
          <button
            onClick={clearAllFilters}
            disabled={!hasActiveFilters()}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Clear Filters
          </button>
          <button
            onClick={fetchAdmins}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Enhanced Admin Cards Section */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        {/* Section Header */}
        <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h3 className="text-lg font-semibold text-gray-800">Admin Users</h3>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {filteredAdmins.length} admin{filteredAdmins.length !== 1 ? 's' : ''} found
              </span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Show</span>
                <select
                  value={entriesPerPage}
                  onChange={(e) => handleEntriesChange(Number(e.target.value))}
                  className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                >
                  {entriesOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
                <span className="text-sm text-gray-600">entries</span>
              </div>
            </div>
          </div>
        </div>

        {/* Admin Cards */}
        <div className="p-6 space-y-6">
          {currentEntries.map((admin) => {
            const role = getAdminRole(admin);
            return (
              <div key={admin.id} className="bg-gray-50 rounded-xl p-6 border border-gray-200 hover:shadow-md transition-all">
                {/* Admin Header */}
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white rounded-xl shadow-sm">
                      <Users2 className="w-6 h-6 text-gray-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{admin.name}</h3>
                      <p className="text-sm text-gray-600">{admin.email}</p>
                      <div className="mt-2">
                        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${getRoleStyle(role)}`}>
                          {getRoleIcon(role)}
                          ADMIN
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleViewAdmin(admin)}
                      className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-all"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <div className="relative admin-dropdown">
                      <button
                        onClick={() => toggleDropdown(admin.id)}
                        className="p-2 hover:bg-gray-200 rounded-lg transition-all"
                      >
                        <MoreVertical className="w-5 h-5 text-gray-500" />
                      </button>
                      {openDropdownId === admin.id && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border py-1 z-10">
                          <button
                            onClick={() => handleContactAdmin(admin.email)}
                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            <Mail className="w-4 h-4 mr-2" />
                            Contact Admin
                          </button>
                          <button
                            onClick={() => handleDeactivateAdmin(admin.id)}
                            className="flex items-center w-full px-4 py-2 text-sm text-yellow-700 hover:bg-yellow-50"
                          >
                            <Ban className="w-4 h-4 mr-2" />
                            Deactivate Admin
                          </button>
                          <button
                            onClick={() => handleRemoveAdmin(admin.id)}
                            className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                          >
                            <UserX className="w-4 h-4 mr-2" />
                            Remove Admin
                          </button>
                        </div>
                      )}
                    </div>
                    {savingId === admin.id && (
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                        Saving...
                      </div>
                    )}
                  </div>
                </div>

                {/* Permission Groups */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Management Permissions */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-gray-700 border-b border-gray-200 pb-2">Management</h4>
                    {permissionConfig.slice(0, 3).map(({ key, icon, label }) => (
                      <div key={key} className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-3">
                          {icon}
                          <span className="text-sm font-medium text-gray-700">{label}</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={admin.permissions?.[key] || false}
                            onChange={(e) => handlePermissionChange(admin.id, key, e.target.checked)}
                            disabled={savingId === admin.id}
                          />
                          <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-red-100 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                        </label>
                      </div>
                    ))}
                  </div>

                  {/* Additional Permissions */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-gray-700 border-b border-gray-200 pb-2">Additional</h4>
                    {permissionConfig.slice(3).map(({ key, icon, label }) => (
                      <div key={key} className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-3">
                          {icon}
                          <span className="text-sm font-medium text-gray-700">{label}</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={admin.permissions?.[key] || false}
                            onChange={(e) => handlePermissionChange(admin.id, key, e.target.checked)}
                            disabled={savingId === admin.id}
                          />
                          <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-red-100 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}

          {filteredAdmins.length === 0 && (
            <div className="text-center py-12">
              <Users2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No admins found</h3>
              <p className="text-gray-500">
                {hasActiveFilters() ? 'Try adjusting your search or filters' : 'No admin users have been added yet'}
              </p>
            </div>
          )}
        </div>

        {/* Enhanced Pagination */}
        {filteredAdmins.length > 0 && (
          <div className="mt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between border-t border-gray-200 pt-6 pb-6 px-6">
            <div className="flex items-center gap-4 mb-4 sm:mb-0">
              <span className="text-sm text-gray-700">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredAdmins.length)} of {filteredAdmins.length} entries
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                aria-label="Previous page"
              >
                Previous
              </button>
              {[...Array(totalPages)].map((_, index) => (
                <button
                  key={index + 1}
                  onClick={() => setCurrentPage(index + 1)}
                  className={`px-4 py-2 border rounded-xl text-sm font-medium transition-all ${
                    currentPage === index + 1 
                      ? 'bg-red-600 text-white border-red-600' 
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                  aria-label={`Page ${index + 1}`}
                  aria-current={currentPage === index + 1 ? 'page' : undefined}
                >
                  {index + 1}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                aria-label="Next page"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Admin Detail Modal */}
      {showDetailModal && selectedAdmin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] shadow-2xl overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Users2 className="w-6 h-6" />
                  <h3 className="text-lg font-semibold">Admin Details</h3>
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Admin Info */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Admin Information</h4>
                <div className="space-y-2">
                  <p className="text-gray-900 font-medium">{selectedAdmin.name}</p>
                  <p className="text-sm text-gray-600">{selectedAdmin.email}</p>
                  <div className="mt-2">
                    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${getRoleStyle(getAdminRole(selectedAdmin))}`}>
                      {getRoleIcon(getAdminRole(selectedAdmin))}
                      ADMIN
                    </span>
                  </div>
                </div>
              </div>

              {/* Permissions */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-4">Current Permissions</h4>
                <div className="grid grid-cols-1 gap-3">
                  {permissionConfig.map(({ key, icon, label }) => (
                    <div key={key} className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-3">
                        {icon}
                        <span className="text-sm font-medium text-gray-700">{label}</span>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        selectedAdmin.permissions?.[key] 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {selectedAdmin.permissions?.[key] ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                  ))}
                </div>
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

export default SettingsPage;