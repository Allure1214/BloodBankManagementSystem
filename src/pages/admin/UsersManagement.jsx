import React, { useState, useEffect } from 'react';
import { Search, Edit, Trash, UserCheck, UserX, ChevronDown, ChevronUp, Filter, UserPlus, X, Check, Users, AlertCircle, Eye, EyeOff } from 'lucide-react';
import AdminLayout from '../../components/layout/AdminDashboardLayout';

const SearchBar = ({ value, onChange, onStatusFilter, onRoleFilter, selectedStatus, selectedRole, onClearFilters, hasActiveFilters }) => (
  <div className="bg-gradient-to-r from-gray-50 to-white p-6 rounded-xl border border-gray-200 shadow-sm">
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        <input
          type="text"
          placeholder="Search by name or email..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-300 focus:border-red-500 
            focus:ring-2 focus:ring-red-500/20 transition-all duration-200 text-gray-700 placeholder-gray-400"
        />
      </div>
      
      {/* Filters Row */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
          <select
            value={selectedRole}
            onChange={(e) => onRoleFilter(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-red-500 
              focus:ring-2 focus:ring-red-500/20 transition-all duration-200 bg-white"
          >
            <option value="all">All Roles</option>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
          <select
            value={selectedStatus}
            onChange={(e) => onStatusFilter(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-red-500 
              focus:ring-2 focus:ring-red-500/20 transition-all duration-200 bg-white"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Filter Chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 pt-2">
          {selectedRole !== 'all' && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
              Role: {selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}
              <button
                onClick={() => onRoleFilter('all')}
                className="ml-2 text-blue-600 hover:text-blue-800"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {selectedStatus !== 'all' && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
              Status: {selectedStatus.charAt(0).toUpperCase() + selectedStatus.slice(1)}
              <button
                onClick={() => onStatusFilter('all')}
                className="ml-2 text-green-600 hover:text-green-800"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {value && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800">
              Search: "{value}"
              <button
                onClick={() => onChange('')}
                className="ml-2 text-purple-600 hover:text-purple-800"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          <button
            onClick={onClearFilters}
            className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
          >
            Clear All
          </button>
        </div>
      )}
    </div>
  </div>
);

const Pagination = ({ currentPage, totalPages, itemsPerPage, totalItems, onPageChange, onItemsPerPageChange }) => (
  <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-6 bg-white border-t border-gray-200">
    <div className="flex items-center">
      <span className="text-sm text-gray-700">
        Show
        <select
          value={itemsPerPage}
          onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
          className="mx-2 border rounded-lg px-3 py-1 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
        >
          {[10, 25, 50].map(size => (
            <option key={size} value={size}>{size}</option>
          ))}
        </select>
        entries
      </span>
    </div>

    <div className="flex items-center gap-2">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium
          disabled:opacity-50 disabled:cursor-not-allowed
          hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500
          transition-all duration-200"
      >
        Previous
      </button>

      {/* Page Numbers */}
      <div className="flex items-center gap-1">
        {Array.from({ length: totalPages }).map((_, index) => {
          const pageNumber = index + 1;
          if (
            pageNumber === 1 ||
            pageNumber === totalPages ||
            (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
          ) {
            return (
              <button
                key={pageNumber}
                onClick={() => onPageChange(pageNumber)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                  ${currentPage === pageNumber
                    ? 'bg-red-600 text-white border border-red-600 shadow-md'
                    : 'border border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                  }`}
              >
                {pageNumber}
              </button>
            );
          } else if (pageNumber === currentPage - 2 || pageNumber === currentPage + 2) {
            return <span key={pageNumber} className="px-2 text-gray-500">...</span>;
          }
          return null;
        })}
      </div>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium
          disabled:opacity-50 disabled:cursor-not-allowed
          hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500
          transition-all duration-200"
      >
        Next
      </button>
    </div>

    <div className="text-sm text-gray-700">
      Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} entries
    </div>
  </div>
);

const UserManagement = () => {
const [users, setUsers] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);
const [searchTerm, setSearchTerm] = useState('');
const [sortField, setSortField] = useState('name');
const [sortDirection, setSortDirection] = useState('asc');
const [selectedRole, setSelectedRole] = useState('all');
const [selectedStatus, setSelectedStatus] = useState('all');
const [currentPage, setCurrentPage] = useState(1);
const [itemsPerPage, setItemsPerPage] = useState(10);
const [editingUser, setEditingUser] = useState(null);
const [showEditModal, setShowEditModal] = useState(false);
const [showAddModal, setShowAddModal] = useState(false);
const [actionLoading, setActionLoading] = useState(null);

  const validatePassword = (password) => {
    const requirements = [
      { re: /.{8,20}/, label: 'Be between 8-20 characters' },
      { re: /[0-9]/, label: 'Include at least one number' },
      { re: /[a-z]/, label: 'Include at least one lowercase letter' },
      { re: /[A-Z]/, label: 'Include at least one uppercase letter' }
    ];

    return requirements.map(req => ({
      ...req,
      isValid: req.re.test(password)
    }));
  };

  const hasActiveFilters = selectedRole !== 'all' || selectedStatus !== 'all' || searchTerm;

  const clearAllFilters = () => {
    setSelectedRole('all');
    setSelectedStatus('all');
    setSearchTerm('');
    setCurrentPage(1);
  };

  // Add User Modal Component
  const AddUserModal = ({ onClose, onAdd }) => {
    const [formData, setFormData] = useState({
      name: '',
      email: '',
      password: '',
      role: 'user',
      status: 'active'
    });
    const [errors, setErrors] = useState({});
    const [passwordRequirements, setPasswordRequirements] = useState([]);
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
      setPasswordRequirements(validatePassword(formData.password));
    }, [formData.password]);

    const validateForm = () => {
      const newErrors = {};
      
      if (!formData.name.trim()) {
        newErrors.name = 'Name is required';
      }
      
      if (!formData.email.trim()) {
        newErrors.email = 'Email is required';
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = 'Please enter a valid email';
      }
      
      if (!formData.password) {
        newErrors.password = 'Password is required';
      } else if (!passwordRequirements.every(req => req.isValid)) {
        newErrors.password = 'Please meet all password requirements';
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };

    const isPasswordValid = () => {
      return passwordRequirements.every(req => req.isValid);
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      
      if (!validateForm()) {
        return;
      }

      setIsSubmitting(true);
      try {
        const token = sessionStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/admin/users', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formData)
        });

        if (response.ok) {
          onAdd();
          onClose();
        } else {
          const data = await response.json();
          setErrors({ general: data.message || 'Failed to create user' });
        }
      } catch (error) {
        setErrors({ general: 'Failed to create user' });
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Add New User</h2>
            <button 
              onClick={onClose} 
              className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {errors.general && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <span className="text-red-700">{errors.general}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all duration-200 ${
                  errors.name ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-red-500'
                }`}
                placeholder="Enter full name"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600 flex items-center space-x-1">
                  <AlertCircle className="h-4 w-4" />
                  <span>{errors.name}</span>
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all duration-200 ${
                  errors.email ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-red-500'
                }`}
                placeholder="Enter email address"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600 flex items-center space-x-1">
                  <AlertCircle className="h-4 w-4" />
                  <span>{errors.email}</span>
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className={`w-full px-4 py-3 pr-12 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all duration-200 ${
                    errors.password ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-red-500'
                  }`}
                  placeholder="Enter password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 p-1 rounded"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              
              {/* Password Requirements */}
              <div className="mt-3 space-y-2">
                <p className="text-sm font-medium text-gray-700">Password must:</p>
                {passwordRequirements.map((req, index) => (
                  <div key={index} className="flex items-center text-sm">
                    {req.isValid ? (
                      <Check className="w-4 h-4 text-green-500 mr-2" />
                    ) : (
                      <X className="w-4 h-4 text-red-500 mr-2" />
                    )}
                    <span className={req.isValid ? 'text-green-700' : 'text-red-700'}>
                      {req.label}
                    </span>
                  </div>
                ))}
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600 flex items-center space-x-1">
                  <AlertCircle className="h-4 w-4" />
                  <span>{errors.password}</span>
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all duration-200"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all duration-200"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-3 text-sm font-medium text-white bg-red-600 border border-transparent rounded-xl hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Adding...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    <span>Add User</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Fetch users from the API
  const fetchUsers = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setUsers(data.users);
      } else {
        setError(data.message);
      }
    } catch (error) {
      setError('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Sort handler
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filter and sort users
  const filteredUsers = users
  .filter(user => {
    // Exclude superadmins from the list
    if (user.role === 'superadmin') return false;

    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    const matchesStatus = selectedStatus === 'all' || user.status === selectedStatus;
    return matchesSearch && matchesRole && matchesStatus;
  })
  .sort((a, b) => {
    if (sortDirection === 'asc') {
      return a[sortField] > b[sortField] ? 1 : -1;
    }
    return a[sortField] < b[sortField] ? 1 : -1;
  });

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

  // User actions
  const handleStatusChange = async (userId, newStatus) => {
    setActionLoading(userId);
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/admin/users/${userId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        fetchUsers(); // Refresh user list
      } else {
        setError('Failed to update user status');
      }
    } catch (error) {
      setError('Failed to update user status');
    } finally {
      setActionLoading(null);
    }
  };

  // Edit user modal
  const EditUserModal = ({ user, onClose, onSave }) => {
    const [formData, setFormData] = useState({
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status
    });
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const validateForm = () => {
      const newErrors = {};
      
      if (!formData.name.trim()) {
        newErrors.name = 'Name is required';
      }
      
      if (!formData.email.trim()) {
        newErrors.email = 'Email is required';
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = 'Please enter a valid email';
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      
      if (!validateForm()) {
        return;
      }

      setIsSubmitting(true);
      try {
        const token = sessionStorage.getItem('token');
        const response = await fetch(`http://localhost:5000/api/admin/users/${user.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formData)
        });

        if (response.ok) {
          onSave();
          onClose();
        } else {
          const data = await response.json();
          setErrors({ general: data.message || 'Failed to update user' });
        }
      } catch (error) {
        setErrors({ general: 'Failed to update user' });
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 w-full max-w-lg">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Edit User</h2>
            <button 
              onClick={onClose} 
              className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {errors.general && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <span className="text-red-700">{errors.general}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all duration-200 ${
                  errors.name ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-red-500'
                }`}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600 flex items-center space-x-1">
                  <AlertCircle className="h-4 w-4" />
                  <span>{errors.name}</span>
                </p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all duration-200 ${
                  errors.email ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-red-500'
                }`}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600 flex items-center space-x-1">
                  <AlertCircle className="h-4 w-4" />
                  <span>{errors.email}</span>
                </p>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all duration-200"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all duration-200"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-3 text-sm font-medium text-white bg-red-600 border border-transparent rounded-xl hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Edit className="h-4 w-4" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <AdminLayout>
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md">
        {/* Header */}
        <div className="p-8 border-b border-gray-200 bg-gradient-to-r from-red-50 via-white to-red-50">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-br from-red-100 to-red-200 rounded-xl shadow-sm">
                <Users className="h-8 w-8 text-red-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Users Management</h1>
                <p className="text-gray-600 mt-1">Manage user accounts, roles, and permissions</p>
              </div>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center px-6 py-3 border border-transparent rounded-xl
                text-sm font-medium text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500
                shadow-lg transition-all duration-200 hover:shadow-xl
                transform hover:-translate-y-0.5"
            >
              <UserPlus className="h-5 w-5 mr-2" />
              Add User
            </button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="p-6">
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            selectedRole={selectedRole}
            selectedStatus={selectedStatus}
            onRoleFilter={setSelectedRole}
            onStatusFilter={setSelectedStatus}
            onClearFilters={clearAllFilters}
            hasActiveFilters={hasActiveFilters}
          />
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th 
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors duration-200"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center space-x-2">
                    <span>Name</span>
                    {sortField === 'name' && (
                      sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors duration-200"
                  onClick={() => handleSort('email')}
                >
                  <div className="flex items-center space-x-2">
                    <span>Email</span>
                    {sortField === 'email' && (
                      sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Status
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
                      <p className="text-gray-500">Loading users...</p>
                    </div>
                  </td>
                </tr>
              ) : paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center space-y-4">
                      <Users className="h-12 w-12 text-gray-400" />
                      <p className="text-gray-500">No users found</p>
                      {hasActiveFilters && (
                        <button
                          onClick={clearAllFilters}
                          className="text-red-600 hover:text-red-700 underline"
                        >
                          Clear filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((user, index) => (
                  <tr 
                    key={user.id} 
                    className={`hover:bg-gray-50 transition-colors duration-200 ${
                      index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">{user.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium
                        ${user.role === 'admin' 
                          ? 'bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 border border-purple-200' 
                          : 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border border-blue-200'
                        }`}
                      >
                        {user.role === 'admin' ? '👑 Admin' : '👤 User'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium
                        ${user.status === 'active' 
                          ? 'bg-gradient-to-r from-green-100 to-green-200 text-green-800 border border-green-200' 
                          : 'bg-gradient-to-r from-red-100 to-red-200 text-red-800 border border-red-200'
                        }`}
                      >
                        {user.status === 'active' ? '🟢 Active' : '🔴 Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex space-x-3">
                        <button
                          onClick={() => {
                            setEditingUser(user);
                            setShowEditModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded-lg transition-all duration-200"
                          title="Edit user"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        {user.status === 'active' ? (
                          <button
                            onClick={() => handleStatusChange(user.id, 'inactive')}
                            disabled={actionLoading === user.id}
                            className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded-lg transition-all duration-200 disabled:opacity-50"
                            title="Deactivate user"
                          >
                            {actionLoading === user.id ? (
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-600"></div>
                            ) : (
                              <UserX className="h-5 w-5" />
                            )}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStatusChange(user.id, 'active')}
                            disabled={actionLoading === user.id}
                            className="text-green-600 hover:text-green-800 p-2 hover:bg-green-50 rounded-lg transition-all duration-200 disabled:opacity-50"
                            title="Activate user"
                          >
                            {actionLoading === user.id ? (
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-600"></div>
                            ) : (
                              <UserCheck className="h-5 w-5" />
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && paginatedUsers.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            itemsPerPage={itemsPerPage}
            totalItems={filteredUsers.length}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={(value) => {
              setItemsPerPage(value);
              setCurrentPage(1);
            }}
          />
        )}

        {/* Error Message */}
        {error && (
          <div className="p-6 bg-red-50 border-l-4 border-red-400 text-red-700 mx-6 mb-6 rounded-xl flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Edit User Modal */}
        {showEditModal && editingUser && (
          <EditUserModal
            user={editingUser}
            onClose={() => {
              setShowEditModal(false);
              setEditingUser(null);
            }}
            onSave={() => {
              fetchUsers();
              setShowEditModal(false);
              setEditingUser(null);
            }}
          />
        )}

        {/* Add User Modal */}
        {showAddModal && (
          <AddUserModal
            onClose={() => setShowAddModal(false)}
            onAdd={() => {
              fetchUsers();
              setShowAddModal(false);
            }}
          />
        )}
      </div>
    </AdminLayout>
  );
};

export default UserManagement;