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
  BarChart3
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
    const filtered = admins.filter(admin => 
      admin.name.toLowerCase().includes(query.toLowerCase()) ||
      admin.email.toLowerCase().includes(query.toLowerCase())
    );
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

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <Settings className="w-8 h-8 text-gray-700" />
          <h1 className="text-2xl font-bold text-gray-900">Admin Settings</h1>
        </div>
        <p className="mt-2 text-gray-600">Manage permissions for admin users</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-400 text-red-700">
          {error}
        </div>
      )}

      {/* Entries selector and search bar in a flex container */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
        {/* Entries selector */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Show</span>
          <select
            value={entriesPerPage}
            onChange={(e) => handleEntriesChange(Number(e.target.value))}
            className="border border-gray-300 rounded px-2 py-1 text-sm focus:ring-red-500 focus:border-red-500"
          >
            {entriesOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          <span className="text-sm text-gray-600">entries</span>
        </div>

        {/* Search bar */}
        <div className="relative w-full sm:w-auto">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full sm:w-64 pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
            placeholder="Search admins..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Users2 className="w-5 h-5 text-gray-500" />
              <h2 className="text-lg font-semibold text-gray-900">Admin Users</h2>
            </div>
            <span className="text-sm text-gray-500">
              {filteredAdmins.length} admin{filteredAdmins.length !== 1 ? 's' : ''} found
            </span>
          </div>

          <div className="grid gap-6">
            {currentEntries.map((admin) => (
              <div 
                key={admin.id}
                className="border rounded-lg p-4 space-y-4"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium text-gray-900">{admin.name}</h3>
                    <p className="text-sm text-gray-500">{admin.email}</p>
                  </div>
                  <div className="relative admin-dropdown">
                    <button
                      onClick={() => toggleDropdown(admin.id)}
                      className="p-2 hover:bg-gray-100 rounded-full transition-colors"
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
                    <span className="text-sm text-gray-500">Saving...</span>
                  )}
                </div>

                <div className="grid gap-3">
                  {permissionConfig.map(({ key, icon, label }) => (
                    <div 
                      key={key}
                      className="flex items-center justify-between py-2 border-b last:border-0"
                    >
                      <div className="flex items-center gap-2">
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
            ))}

            {filteredAdmins.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                {searchQuery ? 'No matching admin users found' : 'No admin users found'}
              </div>
            )}
          </div>

          {/* Pagination controls */}
          {filteredAdmins.length > 0 && (
            <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="text-sm text-gray-600">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredAdmins.length)} of {filteredAdmins.length} entries
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-2 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`px-3 py-1 border rounded ${
                      currentPage === i + 1 
                        ? 'bg-red-600 text-white' 
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-2 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;