import React, { useState, useEffect, useRef } from 'react';
import { Search, Calendar, Droplet, MapPin, User, Mail, Phone, Edit, Plus, X, Filter, CheckCircle, AlertCircle, ChevronDown, ChevronUp, Clock, Check, XCircle } from 'lucide-react';
import AdminLayout from '../../components/layout/AdminDashboardLayout';

const DonationManagement = () => {
    const [donations, setDonations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [selectedBloodType, setSelectedBloodType] = useState('all');
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedDonation, setSelectedDonation] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    const statuses = ['Pending', 'Completed', 'Rejected'];

    const clearFilters = () => {
        setSearchTerm('');
        setSelectedStatus('all');
        setSelectedBloodType('all');
    };

    const hasActiveFilters = () => {
        return searchTerm || selectedStatus !== 'all' || selectedBloodType !== 'all';
    };

    const getStatusIcon = (status) => {
        switch(status) {
            case 'Completed':
                return <Check className="h-4 w-4" />;
            case 'Pending':
                return <Clock className="h-4 w-4" />;
            case 'Rejected':
                return <XCircle className="h-4 w-4" />;
            default:
                return <Clock className="h-4 w-4" />;
        }
    };

    const getStatusStyle = (status) => {
        const baseClasses = "inline-flex items-center px-3 py-1 rounded-full text-sm font-medium transition-all duration-200";
        switch(status) {
            case 'Completed':
                return `${baseClasses} bg-green-100 text-green-800 border border-green-200 hover:bg-green-200`;
            case 'Pending':
                return `${baseClasses} bg-yellow-100 text-yellow-800 border border-yellow-200 hover:bg-yellow-200`;
            case 'Rejected':
                return `${baseClasses} bg-red-100 text-red-800 border border-red-200 hover:bg-red-200`;
            default:
                return `${baseClasses} bg-gray-100 text-gray-800 border border-gray-200`;
        }
    };

    const getBloodTypeStyle = (bloodType) => {
        const baseClasses = "inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border transition-all duration-200";
        const typeColors = {
            'A+': 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200',
            'A-': 'bg-red-50 text-red-700 border-red-100 hover:bg-red-100',
            'B+': 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200',
            'B-': 'bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100',
            'AB+': 'bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200',
            'AB-': 'bg-purple-50 text-purple-700 border-purple-100 hover:bg-purple-100',
            'O+': 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200',
            'O-': 'bg-green-50 text-green-700 border-green-100 hover:bg-green-100'
        };
        return `${baseClasses} ${typeColors[bloodType] || 'bg-gray-100 text-gray-800 border-gray-200'}`;
    };

    const getUrgencyIndicator = (status, donationDate) => {
        if (status === 'Pending') {
            const daysSince = Math.floor((new Date() - new Date(donationDate)) / (1000 * 60 * 60 * 24));
            if (daysSince > 7) {
                return <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200">Overdue</span>;
            } else if (daysSince > 3) {
                return <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">Review Needed</span>;
            }
        }
        return null;
    };

    const SkeletonRow = () => (
        <tr className="animate-pulse">
            <td className="px-6 py-4">
                <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                    <div className="h-3 bg-gray-200 rounded w-48"></div>
                </div>
            </td>
            <td className="px-6 py-4">
                <div className="h-6 bg-gray-200 rounded-full w-16"></div>
            </td>
            <td className="px-6 py-4">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
            </td>
            <td className="px-6 py-4">
                <div className="h-4 bg-gray-200 rounded w-20"></div>
            </td>
            <td className="px-6 py-4">
                <div className="h-6 bg-gray-200 rounded-full w-20"></div>
            </td>
            <td className="px-6 py-4">
                <div className="h-8 w-8 bg-gray-200 rounded"></div>
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
                <div className="flex items-center space-x-3">
                    <div className="h-6 bg-gray-200 rounded-full w-16"></div>
                    <div className="h-6 bg-gray-200 rounded-full w-20"></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                </div>
            </div>
        </div>
    );

    useEffect(() => {
        fetchDonations();
    }, []);

    const fetchDonations = async () => {
        try {
        const token = sessionStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/admin/donations', {
            headers: {
            'Authorization': `Bearer ${token}`
            }
        });
        const data = await response.json();
        
        if (data.success) {
            setDonations(data.data);
        } else {
            setError('Failed to fetch donations');
        }
        } catch (error) {
        setError('Failed to fetch donations');
        } finally {
        setLoading(false);
        }
    };

        const AddDonationModal = ({ onClose }) => {
            const [searchTerm, setSearchTerm] = useState('');
            const [isDropdownOpen, setIsDropdownOpen] = useState(false);
            const [formData, setFormData] = useState({
                donor_id: '',
                blood_bank_id: '',
                donation_date: '',
                blood_type: '',
                quantity_ml: 450,
                status: 'Pending',
                health_screening_notes: ''
            });
            const [donors, setDonors] = useState([]);
            const [bloodBanks, setBloodBanks] = useState([]);
            const [error, setError] = useState('');
            const [formErrors, setFormErrors] = useState({});
            const [isSubmitting, setIsSubmitting] = useState(false);
            const filteredDonors = donors.filter(donor => 
                donor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                donor.email.toLowerCase().includes(searchTerm.toLowerCase())
            );
            const dropdownRef = useRef(null);

            useEffect(() => {
                const handleClickOutside = (event) => {
                if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                    setIsDropdownOpen(false);
                }
                };
            
                document.addEventListener('mousedown', handleClickOutside);
                return () => document.removeEventListener('mousedown', handleClickOutside);
            }, []);
            
            useEffect(() => {
                const fetchInitialData = async () => {
                    setLoading(true);
                    try {
                        await Promise.all([fetchDonors(), fetchBloodBanks()]);
                    } catch (error) {
                        console.error('Error fetching initial data:', error);
                        setError('Failed to load required data');
                    } finally {
                        setLoading(false);
                    }
                };
        
                fetchInitialData();
            }, []);
        
            const fetchDonors = async () => {
                try {
                    const token = sessionStorage.getItem('token');
                    const response = await fetch('http://localhost:5000/api/admin/donations/users/donors', {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
            
                    if (!response.ok) {
                        throw new Error('Failed to fetch donors');
                    }
            
                    const data = await response.json();
                    if (data.success) {
                        // Ensure all required fields are present with proper null handling
                        const donorsWithFullProfile = data.data.map(donor => ({
                            ...donor,
                            name: donor.name,
                            phone: donor.phone || null,
                            blood_type: donor.blood_type || 'UNKNOWN',
                            date_of_birth: donor.date_of_birth || null,
                            gender: donor.gender || null,  // Handle ENUM properly
                            area: donor.area || null
                        }));
                        setDonors(donorsWithFullProfile);
                    } else {
                        throw new Error(data.message || 'Failed to fetch donors');
                    }
                } catch (error) {
                    console.error('Error fetching donors:', error);
                    setError('Failed to fetch donors list');
                    throw error;
                }
            };
        
            const fetchBloodBanks = async () => {
                try {
                    const token = sessionStorage.getItem('token');
                    const response = await fetch('http://localhost:5000/api/blood-banks/all', {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
        
                    if (!response.ok) {
                        throw new Error('Failed to fetch blood banks');
                    }
        
                    const data = await response.json();
                    if (data.success) {
                        setBloodBanks(data.data);
                    } else {
                        throw new Error(data.message || 'Failed to fetch blood banks');
                    }
                } catch (error) {
                    console.error('Error fetching blood banks:', error);
                    setError('Failed to fetch blood banks list');
                    throw error;
                }
            };
        
            // Handle donor selection and auto-fill blood type
            const handleDonorChange = (donorId) => {
                const selectedDonor = donors.find(donor => donor.id.toString() === donorId);
                setFormData(prev => ({
                    ...prev,
                    donor_id: donorId,
                    blood_type: selectedDonor?.blood_type || '' // Auto-fill blood type if available
                }));
            };
        
            const validateForm = () => {
                const errors = {};
                
                if (!formData.donor_id) {
                    errors.donor_id = 'Please select a donor';
                }
                
                if (!formData.blood_bank_id) {
                    errors.blood_bank_id = 'Please select a blood bank';
                }
                
                if (!formData.blood_type) {
                    errors.blood_type = 'Please select a blood type';
                }
                
                if (!formData.donation_date) {
                    errors.donation_date = 'Please select a donation date';
                }
                
                if (!formData.quantity_ml || formData.quantity_ml < 1) {
                    errors.quantity_ml = 'Please enter a valid quantity';
                }
                
                setFormErrors(errors);
                return Object.keys(errors).length === 0;
            };

            // Modified submit handler to update user profile if needed
            const handleSubmit = async (e) => {
                e.preventDefault();
                
                if (!validateForm()) {
                    return;
                }
                
                setIsSubmitting(true);
                setError('');
                
                try {
                    const token = sessionStorage.getItem('token');
                    
                    // First add the donation
                    const donationResponse = await fetch('http://localhost:5000/api/admin/donations', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(formData)
                    });
            
                    if (!donationResponse.ok) {
                        throw new Error('Failed to add donation');
                    }
            
                    // If donation is added successfully and donor had unknown blood type, update their profile
                    const selectedDonor = donors.find(donor => donor.id.toString() === formData.donor_id);
                    if (selectedDonor && (!selectedDonor.blood_type || selectedDonor.blood_type === 'UNKNOWN')) {
                        // Use the new endpoint to update blood type
                        const updateBloodTypeResponse = await fetch(
                            `http://localhost:5000/api/user/update-blood-type/${formData.donor_id}`, 
                            {
                                method: 'PUT',
                                headers: {
                                    'Authorization': `Bearer ${token}`,
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({
                                    bloodType: formData.blood_type
                                })
                            }
                        );
            
                        if (!updateBloodTypeResponse.ok) {
                            console.error('Failed to update user blood type');
                            const errorData = await updateBloodTypeResponse.json();
                            console.error('Blood type update error:', errorData);
                        } else {
                            // If blood type update was successful, update the local donors state
                            setDonors(prevDonors => 
                                prevDonors.map(donor => 
                                    donor.id.toString() === formData.donor_id
                                        ? { ...donor, blood_type: formData.blood_type }
                                        : donor
                                )
                            );
                        }
                    }
            
                    setSuccessMessage('Donation added successfully!');
                    setTimeout(() => {
                        onClose();
                        setSuccessMessage('');
                    }, 1500);
                } catch (error) {
                    setError('Failed to add donation');
                    console.error('Error:', error);
                } finally {
                    setIsSubmitting(false);
                }
            };

            const DonorSelect = () => (
                <div className="relative" ref={dropdownRef}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Donor <span className="text-red-500">*</span>
                  </label>
                  
                  <div className="relative">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setIsDropdownOpen(true);
                      }}
                      onFocus={() => setIsDropdownOpen(true)}
                      placeholder="Search donor by name or email..."
                      className="w-full px-10 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-red-500 focus:border-red-500"
                    />
                    <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                    {searchTerm && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchTerm('');
                          setFormData(prev => ({ ...prev, donor_id: '' }));
                        }}
                        className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    )}
              
                    {/* Selected Donor Display */}
                    {formData.donor_id && !isDropdownOpen && (
                      <div className="mt-2 p-2 bg-gray-50 rounded-md">
                        {(() => {
                          const selectedDonor = donors.find(d => d.id.toString() === formData.donor_id);
                          return selectedDonor ? (
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="font-medium text-gray-900">{selectedDonor.name}</p>
                                <p className="text-sm text-gray-500">{selectedDonor.email}</p>
                              </div>
                              <div className="text-sm">
                                <span className={`px-2 py-1 rounded-full ${
                                  selectedDonor.blood_type && selectedDonor.blood_type !== 'UNKNOWN'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {selectedDonor.blood_type || 'Unknown Blood Type'}
                                </span>
                              </div>
                            </div>
                          ) : null;
                        })()}
                      </div>
                    )}
              
                    {/* Dropdown list */}
                    {isDropdownOpen && (
                      <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg border border-gray-200 max-h-60 overflow-y-auto">
                        {filteredDonors.length > 0 ? (
                          filteredDonors.map((donor) => (
                            <button
                              key={donor.id}
                              type="button"
                              onClick={() => {
                                handleDonorChange(donor.id.toString());
                                setSearchTerm(donor.name);
                                setIsDropdownOpen(false);
                              }}
                              className="w-full px-4 py-2 text-left hover:bg-gray-50 flex justify-between items-center"
                            >
                              <div>
                                <p className="font-medium text-gray-900">{donor.name}</p>
                                <p className="text-sm text-gray-500">{donor.email}</p>
                              </div>
                              <span className={`text-sm px-2 py-1 rounded-full ${
                                donor.blood_type && donor.blood_type !== 'UNKNOWN'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {donor.blood_type || 'Unknown Blood Type'}
                              </span>
                            </button>
                          ))
                        ) : (
                          <div className="px-4 py-2 text-sm text-gray-500">
                            No donors found
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] shadow-2xl overflow-hidden flex flex-col">
                {/* Modal Header - Fixed */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white flex-shrink-0">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-red-100 rounded-lg">
                            <Droplet className="h-6 w-6 text-red-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">Add New Donation</h2>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        disabled={isSubmitting}
                    >
                        <X className="h-5 w-5 text-gray-500" />
                    </button>
                </div>

                {/* Modal Content - Scrollable */}
                <div className="flex-1 overflow-y-auto p-6">
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                            <div className="flex items-center">
                                <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                                <p className="text-sm text-red-700">{error}</p>
                            </div>
                        </div>
                    )}

                    {successMessage && (
                        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
                            <div className="flex items-center">
                                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                                <p className="text-sm text-green-700">{successMessage}</p>
                            </div>
                        </div>
                    )}
        
                <form onSubmit={handleSubmit} className="space-y-6">
                <div className="donor-select">
                    <DonorSelect />
                    {formErrors.donor_id && (
                        <p className="mt-1 text-sm text-red-600 flex items-center">
                            <AlertCircle className="h-4 w-4 mr-1" />
                            {formErrors.donor_id}
                        </p>
                    )}
                </div>
        
                    <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Blood Destination <span className="text-red-500">*</span>
                    </label>
                    <select
                        required
                        value={formData.blood_bank_id}
                        onChange={(e) => setFormData({ ...formData, blood_bank_id: e.target.value })}
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors ${
                            formErrors.blood_bank_id ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                    >
                        <option value="">Select Blood Bank</option>
                        {bloodBanks.map(bank => (
                        <option key={bank.id} value={bank.id}>
                            {bank.name}
                        </option>
                        ))}
                    </select>
                    {formErrors.blood_bank_id && (
                        <p className="mt-1 text-sm text-red-600 flex items-center">
                            <AlertCircle className="h-4 w-4 mr-1" />
                            {formErrors.blood_bank_id}
                        </p>
                    )}
                    </div>
        
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Blood Type <span className="text-red-500">*</span>
                        </label>
                        <select
                            required
                            value={formData.blood_type}
                            onChange={(e) => setFormData({ ...formData, blood_type: e.target.value })}
                            className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors ${
                                formErrors.blood_type ? 'border-red-300 bg-red-50' : 'border-gray-300'
                            }`}
                        >
                            <option value="">Select Blood Type</option>
                            {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(type => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                        {formErrors.blood_type && (
                            <p className="mt-1 text-sm text-red-600 flex items-center">
                                <AlertCircle className="h-4 w-4 mr-1" />
                                {formErrors.blood_type}
                            </p>
                        )}
                        {formData.donor_id && !donors.find(d => d.id.toString() === formData.donor_id)?.blood_type && (
                            <p className="mt-1 text-sm text-gray-500 italic">
                                Donor's blood type will be updated with this selection
                            </p>
                        )}
                    </div>
        
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Donation Date <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="date"
                                required
                                value={formData.donation_date}
                                onChange={(e) => setFormData({ ...formData, donation_date: e.target.value })}
                                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors ${
                                    formErrors.donation_date ? 'border-red-300 bg-red-50' : 'border-gray-300'
                                }`}
                            />
                            {formErrors.donation_date && (
                                <p className="mt-1 text-sm text-red-600 flex items-center">
                                    <AlertCircle className="h-4 w-4 mr-1" />
                                    {formErrors.donation_date}
                                </p>
                            )}
                        </div>
        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Quantity (ml) <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                required
                                value={formData.quantity_ml}
                                onChange={(e) => setFormData({ ...formData, quantity_ml: e.target.value })}
                                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors ${
                                    formErrors.quantity_ml ? 'border-red-300 bg-red-50' : 'border-gray-300'
                                }`}
                                min="0"
                                step="1"
                                placeholder="450"
                            />
                            {formErrors.quantity_ml && (
                                <p className="mt-1 text-sm text-red-600 flex items-center">
                                    <AlertCircle className="h-4 w-4 mr-1" />
                                    {formErrors.quantity_ml}
                                </p>
                            )}
                        </div>
                    </div>
        
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Health Screening Notes
                        </label>
                        <textarea
                            value={formData.health_screening_notes}
                            onChange={(e) => setFormData({ ...formData, health_screening_notes: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors resize-none"
                            rows="3"
                            placeholder="Enter any health screening notes or observations..."
                        />
                    </div>
        
                </form>
                </div>

                {/* Modal Footer - Fixed */}
                <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-white flex-shrink-0">
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
                        className="px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-red-600 to-red-700 border border-transparent rounded-xl hover:from-red-700 hover:to-red-800 disabled:bg-gray-300 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200 flex items-center space-x-2"
                        onClick={handleSubmit}
                    >
                        {isSubmitting ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                <span>Adding...</span>
                            </>
                        ) : (
                            <>
                                <CheckCircle className="h-4 w-4" />
                                <span>Add Donation</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
        );
    };

    const DonationDetailsModal = ({ donation, onClose }) => {
        const [status, setStatus] = useState(donation.status);
        const [healthNotes, setHealthNotes] = useState(donation.health_screening_notes || '');
        const [isSubmitting, setIsSubmitting] = useState(false);
        const [successMessage, setSuccessMessage] = useState('');

        const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const token = sessionStorage.getItem('token');
            const response = await fetch(`http://localhost:5000/api/admin/donations/${donation.id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                status,
                health_screening_notes: healthNotes
            })
            });

            if (response.ok) {
            setSuccessMessage('Donation updated successfully!');
            fetchDonations();
            setTimeout(() => {
                onClose();
                setSuccessMessage('');
            }, 1500);
            } else {
            setError('Failed to update donation');
            }
        } catch (error) {
            setError('Failed to update donation');
        } finally {
            setIsSubmitting(false);
        }
        };

        return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] shadow-2xl overflow-hidden flex flex-col">
            {/* Modal Header - Fixed */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white flex-shrink-0">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-red-100 rounded-lg">
                        <Droplet className="h-6 w-6 text-red-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Donation Details</h2>
                </div>
                <button 
                    onClick={onClose} 
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    disabled={isSubmitting}
                >
                    <X className="h-5 w-5 text-gray-500" />
                </button>
            </div>

            {/* Modal Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6">
                {successMessage && (
                    <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
                        <div className="flex items-center">
                            <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                            <p className="text-sm text-green-700">{successMessage}</p>
                        </div>
                    </div>
                )}
            
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-200">
                        <h3 className="font-semibold text-gray-700 mb-3 flex items-center">
                            <User className="h-5 w-5 mr-2 text-red-500" />
                            Donor Information
                        </h3>
                        <div className="space-y-3">
                            <p className="flex items-center text-sm">
                                <User className="h-4 w-4 mr-2 text-gray-400" />
                                <span className="font-medium">{donation.donor_name}</span>
                            </p>
                            <p className="flex items-center text-sm">
                                <Mail className="h-4 w-4 mr-2 text-gray-400" />
                                {donation.donor_email}
                            </p>
                            <p className="flex items-center text-sm">
                                <Phone className="h-4 w-4 mr-2 text-gray-400" />
                                {donation.donor_phone}
                            </p>
                        </div>
                    </div>

                    <div className="p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-200">
                        <h3 className="font-semibold text-gray-700 mb-3 flex items-center">
                            <Droplet className="h-5 w-5 mr-2 text-red-500" />
                            Donation Details
                        </h3>
                        <div className="space-y-3">
                            <p className="flex items-center text-sm">
                                <Droplet className="h-4 w-4 mr-2 text-gray-400" />
                                <span className="font-medium">Blood Type: </span>
                                <span className="ml-1 px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                                    {donation.blood_type}
                                </span>
                            </p>
                            <p className="flex items-center text-sm">
                                <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                                <span className="font-medium">Date: </span>
                                <span className="ml-1">{new Date(donation.donation_date).toLocaleDateString()}</span>
                            </p>
                            <p className="flex items-center text-sm">
                                <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                                <span className="font-medium">Location: </span>
                                <span className="ml-1">{donation.blood_bank_name}</span>
                            </p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Status
                        </label>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                        >
                            {statuses.map(s => (
                            <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Health Screening Notes
                        </label>
                        <textarea
                            value={healthNotes}
                            onChange={(e) => setHealthNotes(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors resize-none"
                            rows="4"
                            placeholder="Enter health screening notes..."
                        />
                    </div>
                </form>
            </div>

            {/* Modal Footer - Fixed */}
            <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-white flex-shrink-0">
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
                    className="px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-red-600 to-red-700 border border-transparent rounded-xl hover:from-red-700 hover:to-red-800 disabled:bg-gray-300 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200 flex items-center space-x-2"
                    onClick={handleSubmit}
                >
                    {isSubmitting ? (
                        <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>Saving...</span>
                        </>
                    ) : (
                        <>
                            <CheckCircle className="h-4 w-4" />
                            <span>Save Changes</span>
                        </>
                    )}
                </button>
            </div>
        </div>
        </div>
        );
    };

    // Filter donations
    const filteredDonations = donations.filter(donation => {
        const matchesSearch = 
        donation.donor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        donation.blood_bank_name?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = selectedStatus === 'all' || donation.status === selectedStatus;
        const matchesBloodType = selectedBloodType === 'all' || donation.blood_type === selectedBloodType;
        
        return matchesSearch && matchesStatus && matchesBloodType;
    });

    // Pagination
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredDonations.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredDonations.length / itemsPerPage);



      return (
        <AdminLayout>
          <div className="p-8 border-b border-gray-200 bg-gradient-to-r from-red-50 via-white to-red-50">
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-4 lg:space-y-0">
                <div className="flex items-center space-x-4">
                    <div className="p-3 bg-gradient-to-br from-red-100 to-red-200 rounded-xl shadow-sm">
                        <Droplet className="h-8 w-8 text-red-600" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Donation Management</h1>
                        <p className="text-gray-600 mt-1">Track and manage blood donations</p>
                    </div>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl flex items-center 
                        hover:from-red-700 hover:to-red-800 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                    <Plus className="h-5 w-5 mr-2" />
                    Add Donation
                </button>
            </div>
          </div>

          <div className="p-8">
            {/* Enhanced Search and Filters */}
            <div className="bg-gradient-to-r from-gray-50 to-white p-6 rounded-xl border border-gray-200 shadow-sm mb-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                    <div className="flex-1 max-w-2xl">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                            <input
                                type="text"
                                placeholder="Search donations by donor name or blood bank..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl 
                                focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors bg-white"
                                aria-label="Search donations"
                                role="searchbox"
                            />
                        </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                            <Filter className="h-5 w-5 text-gray-500" />
                            <select
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value)}
                                className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors bg-white"
                                aria-label="Filter by status"
                            >
                                <option value="all">All Status</option>
                                {statuses.map(status => (
                                    <option key={status} value={status}>{status}</option>
                                ))}
                            </select>
                        </div>
                        
                        <select
                            value={selectedBloodType}
                            onChange={(e) => setSelectedBloodType(e.target.value)}
                            className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors bg-white"
                            aria-label="Filter by blood type"
                        >
                            <option value="all">All Blood Types</option>
                            {bloodTypes.map(type => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                        
                        {hasActiveFilters() && (
                            <button
                                onClick={clearFilters}
                                className="px-4 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors flex items-center"
                                aria-label="Clear all filters"
                            >
                                <X className="h-4 w-4 mr-2" />
                                Clear Filters
                            </button>
                        )}
                    </div>
                </div>
                
                {/* Filter Chips */}
                {hasActiveFilters() && (
                    <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200 mt-4">
                        {searchTerm && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-red-100 text-red-800 border border-red-200">
                                Search: "{searchTerm}"
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="ml-2 hover:bg-red-200 rounded-full p-0.5"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </span>
                        )}
                        {selectedStatus !== 'all' && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-yellow-100 text-yellow-800 border border-yellow-200">
                                Status: {selectedStatus}
                                <button
                                    onClick={() => setSelectedStatus('all')}
                                    className="ml-2 hover:bg-yellow-200 rounded-full p-0.5"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </span>
                        )}
                        {selectedBloodType !== 'all' && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 border border-blue-200">
                                Blood Type: {selectedBloodType}
                                <button
                                    onClick={() => setSelectedBloodType('all')}
                                    className="ml-2 hover:bg-blue-200 rounded-full p-0.5"
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
                {/* Desktop Table */}
                <div className="hidden lg:block overflow-x-auto">
                    <table className="min-w-full" role="table" aria-label="Donations table">
                        <thead className="bg-gradient-to-r from-gray-50 to-white">
                            <tr role="row">
                                {["Donor Details", "Blood Type", "Blood Destination", "Date", "Status", "Actions"].map((header) => (
                                    <th key={header} className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wide" role="columnheader" scope="col">
                                        {header}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                    <tbody className="divide-y divide-gray-200">
                        {loading ? (
                            // Show skeleton rows while loading
                            Array.from({ length: 5 }).map((_, index) => (
                                <SkeletonRow key={index} />
                            ))
                        ) : (
                            currentItems.map((donation, index) => (
                            <tr key={donation.id} className={`hover:bg-gray-50 transition-all duration-200 ${
                                index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                            }`} role="row">
                                <td className="px-6 py-4">
                                    <div className="flex flex-col">
                                        <span className="text-base font-semibold text-gray-900">{donation.donor_name}</span>
                                        <span className="text-sm text-gray-600">{donation.donor_email}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={getBloodTypeStyle(donation.blood_type)}>
                                        <Droplet className="h-4 w-4 mr-1" />
                                        {donation.blood_type}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center">
                                        <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                                        <span className="text-sm text-gray-900">{donation.blood_bank_name}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center">
                                        <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                                        <span className="text-sm text-gray-900">
                                            {new Date(donation.donation_date).toLocaleDateString()}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center">
                                        <span className={getStatusStyle(donation.status)}>
                                            {getStatusIcon(donation.status)}
                                            <span className="ml-1">{donation.status}</span>
                                        </span>
                                        {getUrgencyIndicator(donation.status, donation.donation_date)}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <button
                                        onClick={() => {
                                            setSelectedDonation(donation);
                                            setShowDetailsModal(true);
                                        }}
                                        className="p-3 text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200 hover:scale-105 group relative focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                        title="Edit Donation"
                                        aria-label={`Edit donation for ${donation.donor_name}`}
                                    >
                                        <Edit className="h-5 w-5" />
                                        <span className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 
                                            bg-gray-800 text-white px-2 py-1 text-xs rounded opacity-0 group-hover:opacity-100 
                                            pointer-events-none transition-opacity duration-200 whitespace-nowrap z-10">
                                            Edit Donation
                                        </span>
                                    </button>
                                </td>
                            </tr>
                            ))
                        )}
                    </tbody>
                    </table>
                </div>

                {/* Mobile Card Layout */}
                <div className="lg:hidden">
                    {loading ? (
                        // Show skeleton cards while loading
                        Array.from({ length: 5 }).map((_, index) => (
                            <SkeletonCard key={index} />
                        ))
                    ) : (
                        currentItems.map((donation, index) => (
                        <div key={donation.id} className={`p-4 border-b border-gray-200 last:border-b-0 ${
                            index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                        }`}>
                            <div className="space-y-3">
                                {/* Donor Info */}
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <h3 className="text-base font-semibold text-gray-900">{donation.donor_name}</h3>
                                        <p className="text-sm text-gray-600">{donation.donor_email}</p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setSelectedDonation(donation);
                                            setShowDetailsModal(true);
                                        }}
                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                        aria-label={`Edit donation for ${donation.donor_name}`}
                                    >
                                        <Edit className="h-5 w-5" />
                                    </button>
                                </div>

                                {/* Blood Type & Status */}
                                <div className="flex items-center space-x-3">
                                    <span className={getBloodTypeStyle(donation.blood_type)}>
                                        <Droplet className="h-4 w-4 mr-1" />
                                        {donation.blood_type}
                                    </span>
                                    <div className="flex items-center">
                                        <span className={getStatusStyle(donation.status)}>
                                            {getStatusIcon(donation.status)}
                                            <span className="ml-1">{donation.status}</span>
                                        </span>
                                        {getUrgencyIndicator(donation.status, donation.donation_date)}
                                    </div>
                                </div>

                                {/* Location & Date */}
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div className="flex items-center">
                                        <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                                        <span className="text-gray-900 truncate">{donation.blood_bank_name}</span>
                                    </div>
                                    <div className="flex items-center">
                                        <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                                        <span className="text-gray-900">
                                            {new Date(donation.donation_date).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        ))
                    )}
                </div>
                
                {/* Empty State */}
                {currentItems.length === 0 && (
                    <div className="text-center py-16">
                        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gray-100 mb-4">
                            <Droplet className="h-8 w-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No donations found</h3>
                        <p className="text-sm text-gray-500 mb-6">
                            {hasActiveFilters() 
                                ? 'No donations match your current filters' 
                                : 'No donations have been recorded yet'}
                        </p>
                        {!hasActiveFilters() && (
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 hover:border-red-300 transition-colors"
                            >
                                Add Your First Donation
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Enhanced Pagination */}
            {filteredDonations.length > 0 && (
                <div className="mt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between border-t border-gray-200 pt-6">
                    <div className="mb-4 sm:mb-0">
                        <p className="text-sm text-gray-700">
                            Showing <span className="font-semibold text-gray-900">{indexOfFirstItem + 1}</span> to{' '}
                            <span className="font-semibold text-gray-900">
                                {Math.min(indexOfLastItem, filteredDonations.length)}
                            </span>{' '}
                            of <span className="font-semibold text-gray-900">{filteredDonations.length}</span> donations
                        </p>
                    </div>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="px-4 py-2 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                            aria-label="Go to previous page"
                        >
                            Previous
                        </button>
                        <div className="flex space-x-1">
                            {[...Array(totalPages)].map((_, i) => (
                                <button
                                    key={i + 1}
                                    onClick={() => setCurrentPage(i + 1)}
                                    className={`px-3 py-2 border rounded-xl text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 ${
                                        currentPage === i + 1 
                                            ? 'bg-red-600 text-white border-red-600' 
                                            : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                                    }`}
                                    aria-label={`Go to page ${i + 1}`}
                                    aria-current={currentPage === i + 1 ? 'page' : undefined}
                                >
                                    {i + 1}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="px-4 py-2 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                            aria-label="Go to next page"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}

            {/* Global Success/Error Messages */}
            {error && (
                <div className="fixed bottom-4 right-4 bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl shadow-lg max-w-sm z-50">
                    <div className="flex items-center">
                        <AlertCircle className="h-5 w-5 text-red-500 mr-3 flex-shrink-0" />
                        <div>
                            <p className="text-sm font-medium">Error</p>
                            <p className="text-sm">{error}</p>
                        </div>
                        <button
                            onClick={() => setError(null)}
                            className="ml-3 text-red-400 hover:text-red-600"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}

            {successMessage && (
                <div className="fixed bottom-4 right-4 bg-green-50 border border-green-200 text-green-700 p-4 rounded-xl shadow-lg max-w-sm z-50">
                    <div className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                        <div>
                            <p className="text-sm font-medium">Success</p>
                            <p className="text-sm">{successMessage}</p>
                        </div>
                        <button
                            onClick={() => setSuccessMessage('')}
                            className="ml-3 text-green-400 hover:text-green-600"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Modals */}
            {showDetailsModal && selectedDonation && (
                <DonationDetailsModal
                    donation={selectedDonation}
                    onClose={() => {
                        setShowDetailsModal(false);
                        setSelectedDonation(null);
                    }}
                />
            )}

            {showAddModal && (
                <AddDonationModal
                    onClose={() => {
                        setShowAddModal(false);
                        fetchDonations();
                    }}
                />
            )}
          </div>
        </AdminLayout>
    );
};

export default DonationManagement;