import React, { useState, useEffect, useRef } from 'react';
import { PlusCircle, X, RefreshCw, ChevronDown, AlertTriangle, Droplet, Search, Scale, Calendar, Filter, TrendingUp, TrendingDown, CheckCircle, AlertCircle, Info, Eye, EyeOff, Zap, Shield, Clock } from 'lucide-react';
import AdminLayout from '../../components/layout/AdminDashboardLayout';

const InventoryCard = ({ data, criticalLevel }) => {
  const isCritical = data.units_available <= criticalLevel;
  const lastUpdated = new Date(data.last_updated);
  const timeDiff = Date.now() - lastUpdated.getTime();
  const hoursAgo = Math.floor(timeDiff / (1000 * 60 * 60));

  const getStockLevel = () => {
    if (data.units_available <= criticalLevel) return 'Critical';
    if (data.units_available <= criticalLevel * 2) return 'Low';
    return 'Normal';
  };

  const getStockStyles = () => {
    const level = getStockLevel();
    return {
      Critical: 'bg-gradient-to-br from-red-50 to-red-100 border-red-200 shadow-red-100',
      Low: 'bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200 shadow-yellow-100',
      Normal: 'bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-green-100'
    }[level];
  };

  const getStockPercentage = () => {
    // Assuming a reasonable maximum stock level for percentage calculation
    const maxStock = Math.max(criticalLevel * 4, data.units_available);
    return Math.min((data.units_available / maxStock) * 100, 100);
  };

  const getProgressBarColor = () => {
    const level = getStockLevel();
    return {
      Critical: 'bg-red-500',
      Low: 'bg-yellow-500',
      Normal: 'bg-green-500'
    }[level];
  };

  const getStockIcon = () => {
    const level = getStockLevel();
    return {
      Critical: <Zap className="h-5 w-5 text-red-600" />,
      Low: <AlertTriangle className="h-5 w-5 text-yellow-600" />,
      Normal: <Shield className="h-5 w-5 text-green-600" />
    }[level];
  };

  const getUrgencyIndicator = () => {
    if (isCritical) {
      return (
        <div className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center animate-pulse">
          <span className="text-xs font-bold">!</span>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`relative p-6 rounded-2xl border-2 ${getStockStyles()} 
      transform transition-all duration-300 hover:scale-105 hover:shadow-xl hover:border-opacity-80
      focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:ring-offset-2`}
      tabIndex="0"
      role="article"
      aria-label={`${data.blood_type} blood type inventory - ${getStockLevel().toLowerCase()} stock level`}
    >
      {getUrgencyIndicator()}
      
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center">
          <div className={`p-3 rounded-xl ${isCritical ? 'bg-red-100' : 'bg-red-50'} mr-4`}>
            <Droplet className={`h-8 w-8 ${isCritical ? 'text-red-600' : 'text-red-500'}`} />
          </div>
          <div>
            <h3 className="text-3xl font-bold text-gray-900 mb-2">{data.blood_type}</h3>
            <div className="flex items-center space-x-2">
              {getStockIcon()}
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                isCritical 
                  ? 'bg-red-100 text-red-800 border border-red-200' 
                  : getStockLevel() === 'Low'
                  ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                  : 'bg-green-100 text-green-800 border border-green-200'
              }`}>
                {getStockLevel()} Stock
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stock Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Stock Level</span>
          <span className="text-sm font-bold text-gray-900">{Math.round(getStockPercentage())}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden" role="progressbar" aria-valuenow={getStockPercentage()} aria-valuemin="0" aria-valuemax="100">
          <div 
            className={`h-3 rounded-full transition-all duration-500 ${getProgressBarColor()}`}
            style={{ width: `${getStockPercentage()}%` }}
          ></div>
        </div>
        <div className="mt-1 text-xs text-gray-500">
          {data.units_available} of {Math.max(criticalLevel * 4, data.units_available)} units
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-white bg-opacity-60 rounded-xl border border-gray-200">
          <div className="flex items-center text-gray-700">
            <Scale className="h-5 w-5 mr-2 text-gray-500" />
            <span className="font-semibold">Available Units</span>
          </div>
          <span className="text-2xl font-bold text-gray-900">{data.units_available}</span>
        </div>

        <div className="flex items-center text-gray-600 p-3 bg-white bg-opacity-60 rounded-xl border border-gray-200">
          <Clock className="h-4 w-4 mr-2 text-gray-500" />
          <span className="text-sm">
            Updated {hoursAgo < 24 
              ? `${hoursAgo} hours ago` 
              : lastUpdated.toLocaleDateString()}
          </span>
        </div>

        {isCritical && (
          <div className="flex items-center text-red-700 text-sm font-semibold p-3 bg-red-50 rounded-xl border border-red-200">
            <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />
            Critical Level Alert - Immediate Action Required
          </div>
        )}

        {/* Stock Level Recommendations */}
        <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
          <div className="flex items-start space-x-2">
            <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-blue-700">
              <span className="font-medium">Recommendation: </span>
              {isCritical 
                ? 'Urgent restocking required' 
                : getStockLevel() === 'Low' 
                ? 'Consider restocking soon' 
                : 'Stock levels are healthy'
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const BloodInventoryManagement = () => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBank, setSelectedBank] = useState('');
  const [bloodBanks, setBloodBanks] = useState([]);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [bloodBankSearchTerm, setBloodBankSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [updateData, setUpdateData] = useState({
    bloodType: '',
    operation: 'add',
    units: 0,
    bankId: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const filteredInventory = inventory.filter(item =>
    searchTerm ? item.blood_type === searchTerm : true
  );

  const filteredBloodBanks = bloodBanks.filter(bank => 
    bank.name.toLowerCase().includes(bloodBankSearchTerm.toLowerCase())
  );

  const hasActiveFilters = searchTerm !== '' || selectedBank !== '';
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
  
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const criticalLevel = 100; // Units below this are considered critical
  
  const clearAllFilters = () => {
    setSearchTerm('');
    if (bloodBanks.length > 0) {
      setSelectedBank(bloodBanks[0].id);
    }
  };

  // Keyboard navigation for dropdown
  const handleKeyDown = (event) => {
    if (event.key === 'Escape') {
      setIsDropdownOpen(false);
    }
  };

  useEffect(() => {
    fetchBloodBanks();
  }, []);

  useEffect(() => {
    if (selectedBank) {
      fetchInventory(selectedBank);
    }
  }, [selectedBank]);

  const fetchBloodBanks = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/blood-banks/all', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setBloodBanks(data.data);
        if (data.data.length > 0) {
          setSelectedBank(data.data[0].id);
        }
      }
    } catch (error) {
      setError('Failed to fetch blood banks');
    }
  };
  
  const fetchInventory = async (bankId) => {
    try {
      setLoading(true);
      setError(null);
      const token = sessionStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/blood-banks/${bankId}/inventory`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setInventory(data.data);
      }
    } catch (error) {
      setError('Failed to fetch inventory data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    try {
      setActionLoading(true);
      const token = sessionStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/admin/inventory/update', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bankId: selectedBank,
          bloodType: updateData.bloodType,
          operation: updateData.operation,
          units: parseInt(updateData.units)
        })
      });

      if (response.ok) {
        await fetchInventory(selectedBank);
        setShowUpdateModal(false);
        setUpdateData({ bloodType: '', operation: 'add', units: 0, bankId: '' });
        setSuccessMessage(`Successfully ${updateData.operation === 'add' ? 'added' : 'removed'} ${updateData.units} units of ${updateData.bloodType}`);
        setTimeout(() => setSuccessMessage(''), 5000);
      }
    } catch (error) {
      setError('Failed to update inventory');
    } finally {
      setActionLoading(false);
    }
  };

  const StockUpdateModal = ({ onClose }) => {
    const [currentUnits, setCurrentUnits] = useState(0);
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
  
    // Update current units when blood type is selected
    useEffect(() => {
      if (updateData.bloodType) {
        const selectedInventory = inventory.find(item => item.blood_type === updateData.bloodType);
        setCurrentUnits(selectedInventory ? selectedInventory.units_available : 0);
      }
    }, [updateData.bloodType]);

    const validateForm = () => {
      const newErrors = {};
      
      if (!updateData.bloodType) {
        newErrors.bloodType = 'Please select a blood type';
      }
      
      if (!updateData.units || updateData.units <= 0) {
        newErrors.units = 'Please enter a valid number of units';
      } else if (updateData.operation === 'remove' && updateData.units > currentUnits) {
        newErrors.units = `Cannot remove more units than available (${currentUnits})`;
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
        await handleUpdate();
      } catch (error) {
        setErrors({ general: 'Failed to update inventory' });
      } finally {
        setIsSubmitting(false);
      }
    };

    // Focus management for accessibility
    useEffect(() => {
      const modal = document.querySelector('[role="dialog"]');
      if (modal) {
        modal.focus();
      }
    }, []);
  
    return (
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div 
          className="bg-white rounded-2xl p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
          tabIndex="-1"
        >
          <div className="flex justify-between items-center mb-6">
            <h3 id="modal-title" className="text-2xl font-bold text-gray-900">Update Blood Inventory</h3>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
              aria-label="Close modal"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {errors.general && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-2" role="alert">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <span className="text-red-700">{errors.general}</span>
            </div>
          )}
  
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Blood Type Selection */}
            <div>
              <label htmlFor="blood-type" className="block text-sm font-medium text-gray-700 mb-2">
                Blood Type
              </label>
              <select
                id="blood-type"
                value={updateData.bloodType}
                onChange={(e) => setUpdateData({ ...updateData, bloodType: e.target.value })}
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all duration-200 ${
                  errors.bloodType ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-red-500'
                }`}
                aria-describedby={errors.bloodType ? 'blood-type-error' : undefined}
              >
                <option value="">Select Blood Type</option>
                {bloodTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              {errors.bloodType && (
                <p id="blood-type-error" className="mt-1 text-sm text-red-600 flex items-center space-x-1" role="alert">
                  <AlertCircle className="h-4 w-4" />
                  <span>{errors.bloodType}</span>
                </p>
              )}
            </div>
  
            {/* Current Stock Info */}
            {updateData.bloodType && (
              <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Current Stock</span>
                  <span className="text-2xl font-bold text-gray-900">{currentUnits} units</span>
                </div>
                {currentUnits <= criticalLevel && (
                  <div className="mt-2 flex items-center text-red-600 text-sm font-medium">
                    <AlertTriangle className="h-4 w-4 mr-1.5" />
                    Critical Level Alert
                  </div>
                )}
              </div>
            )}
  
            {/* Operation Selection */}
            <fieldset>
              <legend className="block text-sm font-medium text-gray-700 mb-3">
                Operation
              </legend>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className={`flex items-center p-3 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                  updateData.operation === 'add' 
                    ? 'border-green-300 bg-green-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <input
                    type="radio"
                    name="operation"
                    value="add"
                    checked={updateData.operation === 'add'}
                    onChange={(e) => setUpdateData({ ...updateData, operation: e.target.value })}
                    className="text-green-600 focus:ring-green-500 mr-3"
                  />
                  <div className="flex items-center">
                    <TrendingUp className="h-5 w-5 text-green-600 mr-2" />
                    <span className="font-medium">Add Units</span>
                  </div>
                </label>
                <label className={`flex items-center p-3 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                  updateData.operation === 'remove' 
                    ? 'border-red-300 bg-red-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <input
                    type="radio"
                    name="operation"
                    value="remove"
                    checked={updateData.operation === 'remove'}
                    onChange={(e) => setUpdateData({ ...updateData, operation: e.target.value })}
                    className="text-red-600 focus:ring-red-500 mr-3"
                  />
                  <div className="flex items-center">
                    <TrendingDown className="h-5 w-5 text-red-600 mr-2" />
                    <span className="font-medium">Remove Units</span>
                  </div>
                </label>
              </div>
            </fieldset>
  
            {/* Units Input */}
            <div>
              <label htmlFor="units" className="block text-sm font-medium text-gray-700 mb-2">
                Number of Units
              </label>
              <input
                id="units"
                type="number"
                min="1"
                max={updateData.operation === 'remove' ? currentUnits : undefined}
                value={updateData.units}
                onChange={(e) => setUpdateData({ ...updateData, units: e.target.value })}
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all duration-200 ${
                  errors.units ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-red-500'
                }`}
                placeholder="Enter number of units"
                aria-describedby={errors.units ? 'units-error' : undefined}
              />
              {errors.units && (
                <p id="units-error" className="mt-1 text-sm text-red-600 flex items-center space-x-1" role="alert">
                  <AlertCircle className="h-4 w-4" />
                  <span>{errors.units}</span>
                </p>
              )}
              {updateData.operation === 'remove' && (
                <p className="mt-2 text-sm text-gray-500 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  Maximum: {currentUnits} units available
                </p>
              )}
            </div>
  
            {/* Preview Changes */}
            {updateData.bloodType && updateData.units > 0 && (
              <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-blue-700">After Update:</span>
                  <span className="text-xl font-bold text-blue-900">
                    {updateData.operation === 'add' 
                      ? currentUnits + parseInt(updateData.units)
                      : currentUnits - parseInt(updateData.units)
                    } units
                  </span>
                </div>
                <div className="mt-2 flex items-center text-blue-600 text-sm">
                  {updateData.operation === 'add' ? (
                    <>
                      <TrendingUp className="h-4 w-4 mr-1" />
                      <span>Stock will increase by {updateData.units} units</span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="h-4 w-4 mr-1" />
                      <span>Stock will decrease by {updateData.units} units</span>
                    </>
                  )}
                </div>
              </div>
            )}
  
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="w-full sm:w-auto px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={
                  isSubmitting ||
                  !updateData.bloodType || 
                  updateData.units <= 0 || 
                  (updateData.operation === 'remove' && updateData.units > currentUnits)
                }
                className="w-full sm:w-auto px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-red-600 to-red-700 border border-transparent rounded-xl hover:from-red-700 hover:to-red-800 
                  disabled:bg-gray-300 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200 flex items-center justify-center space-x-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Updating...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    <span>Update Inventory</span>
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
        {/* Enhanced header */}
        <div className="p-6 sm:p-8 border-b border-gray-200 bg-gradient-to-r from-red-50 via-white to-red-50">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center space-x-4">
              <div className="p-2 sm:p-3 bg-gradient-to-br from-red-100 to-red-200 rounded-xl shadow-sm">
                <Droplet className="h-6 w-6 sm:h-8 sm:w-8 text-red-600" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Blood Inventory Management</h1>
                <p className="text-gray-600 mt-1 text-sm sm:text-base">Monitor and manage blood stock levels across all blood banks</p>
              </div>
            </div>

            <button
              onClick={() => setShowUpdateModal(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center px-4 sm:px-6 py-3 border border-transparent rounded-xl
                text-sm font-medium text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500
                shadow-lg transition-all duration-200 hover:shadow-xl
                transform hover:-translate-y-0.5"
            >
              <PlusCircle className="h-5 w-5 mr-2" />
              Update Stock
            </button>
          </div>
        </div>

        {/* Enhanced Controls section */}
        <div className="p-4 sm:p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <div className="space-y-4">
            {/* Filter Chips */}
            {hasActiveFilters && (
              <div className="flex flex-wrap gap-2">
                {searchTerm && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                    Blood Type: {searchTerm}
                    <button
                      onClick={() => setSearchTerm('')}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                      aria-label={`Remove blood type filter: ${searchTerm}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {selectedBank && bloodBanks.find(bank => bank.id.toString() === selectedBank.toString()) && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
                    Bank: {bloodBanks.find(bank => bank.id.toString() === selectedBank.toString())?.name}
                    <button
                      onClick={() => {
                        if (bloodBanks.length > 0) {
                          setSelectedBank(bloodBanks[0].id);
                        }
                      }}
                      className="ml-2 text-green-600 hover:text-green-800"
                      aria-label="Reset to first blood bank"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                <button
                  onClick={clearAllFilters}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                >
                  Clear All
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Blood Bank Selection */}
              <div className="relative w-full" ref={dropdownRef}>
                <div className="relative">
                  {/* Search Input */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none h-5 w-5" />
                    <input
                      type="text"
                      value={bloodBankSearchTerm}
                      onChange={(e) => {
                        setBloodBankSearchTerm(e.target.value);
                        setIsDropdownOpen(true);
                      }}
                      onFocus={() => setIsDropdownOpen(true)}
                      onKeyDown={handleKeyDown}
                      placeholder="Search blood bank..."
                      className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all duration-200"
                      autoComplete="off"
                      aria-label="Search blood banks"
                      aria-expanded={isDropdownOpen}
                      aria-haspopup="listbox"
                    />
                    {bloodBankSearchTerm && (
                      <button
                        type="button"
                        onClick={() => {
                          setBloodBankSearchTerm('');
                          setIsDropdownOpen(true);
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        aria-label="Clear search"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    )}
                  </div>

                  {/* Selected Blood Bank Display */}
                  {selectedBank && !isDropdownOpen && (
                    <div className="mt-2">
                      {(() => {
                        const selected = bloodBanks.find(bank => bank.id.toString() === selectedBank.toString());
                        if (selected) {
                          return (
                            <div className="p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                              <p className="font-semibold text-gray-900">{selected.name}</p>
                              <p className="text-sm text-gray-500">{selected.area}</p>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  )}

                  {/* Dropdown List */}
                  {isDropdownOpen && (
                    <div 
                      className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-gray-200 max-h-60 overflow-y-auto z-50"
                      role="listbox"
                      aria-label="Blood bank options"
                    >
                      {filteredBloodBanks.length > 0 ? (
                        filteredBloodBanks.map((bank) => (
                          <button
                            key={bank.id}
                            type="button"
                            onClick={() => {
                              setSelectedBank(bank.id);
                              setBloodBankSearchTerm('');
                              setIsDropdownOpen(false);
                            }}
                            className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors duration-200"
                            role="option"
                            aria-selected={bank.id.toString() === selectedBank.toString()}
                          >
                            <p className="font-medium text-gray-900">{bank.name}</p>
                            <p className="text-sm text-gray-500">{bank.area}</p>
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-3 text-sm text-gray-500">
                          No blood banks found
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Blood Type Filter */}
              <div className="relative">
                <select
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-4 pr-10 py-3 border border-gray-300 rounded-xl 
                    appearance-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500
                    transition-all duration-200 bg-white"
                  aria-label="Filter by blood type"
                >
                  <option value="">All Blood Types</option>
                  {bloodTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
              </div>

              {/* Refresh Button */}
              <button
                onClick={() => fetchInventory(selectedBank)}
                disabled={actionLoading}
                className="px-4 py-3 border border-gray-300 rounded-xl flex items-center 
                  justify-center text-gray-700 hover:bg-gray-50 transition-all duration-200 hover:border-gray-400
                  disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Refresh inventory data"
              >
                {actionLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600"></div>
                ) : (
                  <>
                    <RefreshCw className="h-5 w-5 mr-2" />
                    <span className="hidden sm:inline">Refresh Data</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-xl mx-4 mt-4 flex items-center space-x-2" role="alert">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <span className="text-green-700">{successMessage}</span>
          </div>
        )}

        {/* Inventory Grid */}
        <div className="p-4 sm:p-8">
          {loading ? (
            <div className="flex justify-center items-center py-16">
              <div className="text-center">
                <div className="relative mb-4">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full absolute border-4 border-gray-200"></div>
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full animate-spin absolute
                    border-4 border-red-600 border-t-transparent"></div>
                </div>
                <p className="text-gray-500 text-base sm:text-lg">Loading inventory data...</p>
              </div>
            </div>
          ) : filteredInventory.length === 0 ? (
            <div className="text-center py-16">
              <Droplet className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-base sm:text-lg mb-2">No inventory data found</p>
              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="text-red-600 hover:text-red-700 underline"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {filteredInventory.map(item => (
                <InventoryCard 
                  key={item.blood_type}
                  data={item}
                  criticalLevel={criticalLevel}
                />
              ))}
            </div>
          )}

          {error && (
            <div className="mt-8 p-4 sm:p-6 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-2" role="alert">
              <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-red-500" />
              <span className="text-red-700 text-base sm:text-lg">{error}</span>
            </div>
          )}
        </div>
      </div>

      {/* Stock Update Modal */}
      {showUpdateModal && (
        <StockUpdateModal
          show={showUpdateModal}
          onClose={() => setShowUpdateModal(false)}
          inventory={inventory}
          bloodTypes={bloodTypes}
          criticalLevel={criticalLevel}
          onUpdate={handleUpdate}
        />
      )}
    </AdminLayout>
  );
};

export default BloodInventoryManagement;