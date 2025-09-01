import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash, Search, MapPin, Phone, Clock, Building2, X, AlertCircle, CheckCircle, Filter, Users, Globe, AlertTriangle, Info, Map, Star, Shield, Zap } from 'lucide-react';
import AdminLayout from '../../components/layout/AdminDashboardLayout';

const BloodBanksManagement = () => {
const [bloodBanks, setBloodBanks] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);
const [searchTerm, setSearchTerm] = useState('');
const [showModal, setShowModal] = useState(false);
const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
const [selectedBank, setSelectedBank] = useState(null);
const [currentPage, setCurrentPage] = useState(1);
const [itemsPerPage, setItemsPerPage] = useState(10);
const [showDeleteModal, setShowDeleteModal] = useState(false);
const [bankToDelete, setBankToDelete] = useState(null);
const [selectedArea, setSelectedArea] = useState('all');
const [successMessage, setSuccessMessage] = useState('');
const [actionLoading, setActionLoading] = useState(null);

    const JOHOR_AREAS = [
        "Johor Bahru",
        "Muar",
        "Batu Pahat",
        "Kluang",
        "Pontian",
        "Segamat",
        "Kota Tinggi",
        "Mersing",
        "Kulai",
        "Tangkak"
    ];

    const hasActiveFilters = searchTerm !== '' || selectedArea !== 'all';

    const clearAllFilters = () => {
        setSearchTerm('');
        setSelectedArea('all');
        setCurrentPage(1);
    };

    const TableHeader = ({ children, sortable = false, onSort = null, sortField = null, sortDirection = null }) => (
        <th 
            className={`px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider bg-gradient-to-r from-gray-50 to-gray-100 border-r border-gray-200 ${
                sortable ? 'cursor-pointer hover:bg-gray-200 transition-colors duration-200' : ''
            }`}
            onClick={sortable ? onSort : undefined}
            role={sortable ? 'button' : undefined}
            tabIndex={sortable ? 0 : undefined}
            aria-label={sortable ? `Sort by ${children}` : undefined}
        >
            <div className="flex items-center space-x-1">
                <span>{children}</span>
                {sortable && sortField && (
                    sortDirection === 'asc' ? 
                        <span className="text-gray-400">↑</span> : 
                        <span className="text-gray-400">↓</span>
                )}
            </div>
        </th>
    );

    const StatusBadge = ({ area }) => {
        const getAreaColor = (area) => {
            const colors = {
                'Johor Bahru': 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border-blue-300',
                'Muar': 'bg-gradient-to-r from-green-100 to-green-200 text-green-800 border-green-300',
                'Batu Pahat': 'bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 border-purple-300',
                'Kluang': 'bg-gradient-to-r from-orange-100 to-orange-200 text-orange-800 border-orange-300',
                'Pontian': 'bg-gradient-to-r from-indigo-100 to-indigo-200 text-indigo-800 border-indigo-300',
                'Segamat': 'bg-gradient-to-r from-pink-100 to-pink-200 text-pink-800 border-pink-300',
                'Kota Tinggi': 'bg-gradient-to-r from-teal-100 to-teal-200 text-teal-800 border-teal-300',
                'Mersing': 'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 border-yellow-300',
                'Kulai': 'bg-gradient-to-r from-red-100 to-red-200 text-red-800 border-red-300',
                'Tangkak': 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border-gray-300'
            };
            return colors[area] || 'bg-gray-100 text-gray-800 border-gray-200';
        };

        const getAreaIcon = (area) => {
            const icons = {
                'Johor Bahru': <Star className="h-3 w-3" />,
                'Muar': <Shield className="h-3 w-3" />,
                'Batu Pahat': <Zap className="h-3 w-3" />,
                'Kluang': <Map className="h-3 w-3" />,
                'Pontian': <Globe className="h-3 w-3" />,
                'Segamat': <Building2 className="h-3 w-3" />,
                'Kota Tinggi': <MapPin className="h-3 w-3" />,
                'Mersing': <Clock className="h-3 w-3" />,
                'Kulai': <Phone className="h-3 w-3" />,
                'Tangkak': <Info className="h-3 w-3" />
            };
            return icons[area] || <Globe className="h-3 w-3" />;
        };

        return (
            <span className={`px-3 py-1 inline-flex items-center text-xs leading-5 font-semibold rounded-full border-2 ${getAreaColor(area)} shadow-sm`}>
                {getAreaIcon(area)}
                <span className="ml-1">{area}</span>
            </span>
        );
    };

    const ActionButton = ({ onClick, icon: Icon, color, label, disabled = false, loading = false }) => {
        const colorClasses = {
            blue: 'text-blue-600 hover:text-blue-700 hover:bg-blue-50',
            red: 'text-red-600 hover:text-red-700 hover:bg-red-50',
            green: 'text-green-600 hover:text-green-700 hover:bg-green-50'
        };

        return (
            <button
                onClick={onClick}
                disabled={disabled || loading}
                className={`p-2 rounded-lg hover:bg-gray-50 ${colorClasses[color]} 
                    transition-all duration-200 group relative disabled:opacity-50 disabled:cursor-not-allowed
                    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500`}
                title={label}
                aria-label={label}
            >
                {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div>
                ) : (
                    <Icon className="h-5 w-5" />
                )}
                <span className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 
                    bg-gray-800 text-white px-2 py-1 text-xs rounded opacity-0 group-hover:opacity-100 
                    pointer-events-none transition-opacity duration-200 whitespace-nowrap z-10">
                    {label}
                </span>
            </button>
        );
    };

const DeleteConfirmationModal = ({ bank, onConfirm, onCancel, isDeleting }) => (
        <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-modal-title"
        >
        <div className="bg-white rounded-2xl p-8 w-full max-w-lg shadow-2xl">
            <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <Trash className="h-8 w-8 text-red-600" />
            </div>
            <h3 id="delete-modal-title" className="text-2xl font-bold text-gray-900 mb-4">
                Delete Blood Bank
            </h3>
            <p className="text-gray-600 mb-6 leading-relaxed">
                Are you sure you want to delete <span className="font-semibold text-gray-900">"{bank.name}"</span>? 
                This action cannot be undone and will remove all associated data.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-3">
                <button
                    onClick={onCancel}
                    disabled={isDeleting}
                    className="w-full sm:w-auto px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200 disabled:opacity-50"
                >
                    Cancel
                </button>
                <button
                    onClick={onConfirm}
                    disabled={isDeleting}
                    className="w-full sm:w-auto px-6 py-3 text-sm font-medium text-white bg-red-600 border border-transparent rounded-xl hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                    {isDeleting ? (
                        <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>Deleting...</span>
                        </>
                    ) : (
                        <>
                            <Trash className="h-4 w-4" />
                            <span>Delete Blood Bank</span>
                        </>
                    )}
                </button>
            </div>
            </div>
        </div>
        </div>
    );

    // Fetch blood banks
    useEffect(() => {
        fetchBloodBanks();
    }, []);

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
        } else {
            setError('Failed to fetch blood banks');
        }
        } catch (error) {
        setError('Failed to fetch blood banks');
        } finally {
        setLoading(false);
        }
    };

    // Blood Bank Form Modal
    const BloodBankModal = ({ onClose }) => {
        const [formData, setFormData] = useState(
        selectedBank || {
            name: '',
            address: '',
            area: '',
            contact: '',
            operating_hours: ''
        }
        );
        const [errors, setErrors] = useState({});
        const [isSubmitting, setIsSubmitting] = useState(false);

        const validateForm = () => {
            const newErrors = {};
            
            if (!formData.name.trim()) {
                newErrors.name = 'Blood bank name is required';
            }
            
            if (!formData.address.trim()) {
                newErrors.address = 'Address is required';
            }
            
            if (!formData.area) {
                newErrors.area = 'Please select an area';
            }
            
            if (!formData.contact.trim()) {
                newErrors.contact = 'Contact information is required';
            }
            
            if (!formData.operating_hours.trim()) {
                newErrors.operating_hours = 'Operating hours are required';
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
            const url = modalMode === 'add' 
            ? 'http://localhost:5000/api/blood-banks'
            : `http://localhost:5000/api/blood-banks/${selectedBank.id}`;
            
            const response = await fetch(url, {
            method: modalMode === 'add' ? 'POST' : 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
            });

            if (response.ok) {
                await fetchBloodBanks();
                onClose();
                setSuccessMessage(`Blood bank ${modalMode === 'add' ? 'added' : 'updated'} successfully!`);
                setTimeout(() => setSuccessMessage(''), 5000);
            } else {
                const data = await response.json();
                setErrors({ general: data.message || 'Failed to save blood bank' });
            }
        } catch (error) {
            setErrors({ general: 'Failed to save blood bank' });
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
                className="bg-white rounded-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
                tabIndex="-1"
            >
            <div className="flex justify-between items-center mb-6">
                <h2 id="modal-title" className="text-2xl font-bold text-gray-900">
                    {modalMode === 'add' ? 'Add New Blood Bank' : 'Edit Blood Bank'}
                </h2>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="bank-name" className="block text-sm font-medium text-gray-700 mb-2">
                            Blood Bank Name
                        </label>
                        <input
                            id="bank-name"
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all duration-200 ${
                                errors.name ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-red-500'
                            }`}
                            placeholder="Enter blood bank name"
                            aria-describedby={errors.name ? 'name-error' : undefined}
                        />
                        {errors.name && (
                            <p id="name-error" className="mt-1 text-sm text-red-600 flex items-center space-x-1" role="alert">
                                <AlertCircle className="h-4 w-4" />
                                <span>{errors.name}</span>
                            </p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="bank-area" className="block text-sm font-medium text-gray-700 mb-2">
                            Area
                        </label>
                        <select
                            id="bank-area"
                            required
                            value={formData.area}
                            onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                            className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all duration-200 ${
                                errors.area ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-red-500'
                            }`}
                            aria-describedby={errors.area ? 'area-error' : undefined}
                        >
                            <option value="">Select Area</option>
                            {JOHOR_AREAS.map((area) => (
                                <option key={area} value={area}>
                                    {area}
                                </option>
                            ))}
                        </select>
                        {errors.area && (
                            <p id="area-error" className="mt-1 text-sm text-red-600 flex items-center space-x-1" role="alert">
                                <AlertCircle className="h-4 w-4" />
                                <span>{errors.area}</span>
                            </p>
                        )}
                    </div>
                </div>

                <div>
                    <label htmlFor="bank-address" className="block text-sm font-medium text-gray-700 mb-2">
                        Address
                    </label>
                    <textarea
                        id="bank-address"
                        required
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all duration-200 ${
                            errors.address ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-red-500'
                        }`}
                        rows="3"
                        placeholder="Enter complete address"
                        aria-describedby={errors.address ? 'address-error' : undefined}
                    />
                    {errors.address && (
                        <p id="address-error" className="mt-1 text-sm text-red-600 flex items-center space-x-1" role="alert">
                            <AlertCircle className="h-4 w-4" />
                            <span>{errors.address}</span>
                        </p>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="bank-contact" className="block text-sm font-medium text-gray-700 mb-2">
                            Contact Information
                        </label>
                        <input
                            id="bank-contact"
                            type="text"
                            required
                            value={formData.contact}
                            onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                            className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all duration-200 ${
                                errors.contact ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-red-500'
                            }`}
                            placeholder="Phone number or email"
                            aria-describedby={errors.contact ? 'contact-error' : undefined}
                        />
                        {errors.contact && (
                            <p id="contact-error" className="mt-1 text-sm text-red-600 flex items-center space-x-1" role="alert">
                                <AlertCircle className="h-4 w-4" />
                                <span>{errors.contact}</span>
                            </p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="bank-hours" className="block text-sm font-medium text-gray-700 mb-2">
                            Operating Hours
                        </label>
                        <input
                            id="bank-hours"
                            type="text"
                            required
                            value={formData.operating_hours}
                            onChange={(e) => setFormData({ ...formData, operating_hours: e.target.value })}
                            className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all duration-200 ${
                                errors.operating_hours ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-red-500'
                            }`}
                            placeholder="e.g., Mon-Sun: 9:00 AM - 5:00 PM"
                            aria-describedby={errors.operating_hours ? 'hours-error' : undefined}
                        />
                        {errors.operating_hours && (
                            <p id="hours-error" className="mt-1 text-sm text-red-600 flex items-center space-x-1" role="alert">
                                <AlertCircle className="h-4 w-4" />
                                <span>{errors.operating_hours}</span>
                            </p>
                        )}
                    </div>
                </div>

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
                        disabled={isSubmitting}
                        className="w-full sm:w-auto px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-red-600 to-red-700 border border-transparent rounded-xl hover:from-red-700 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                    >
                        {isSubmitting ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                <span>{modalMode === 'add' ? 'Adding...' : 'Saving...'}</span>
                            </>
                        ) : (
                            <>
                                <CheckCircle className="h-4 w-4" />
                                <span>{modalMode === 'add' ? 'Add Blood Bank' : 'Save Changes'}</span>
                            </>
                        )}
                    </button>
                </div>
            </form>
            </div>
        </div>
        );
    };

    // Handle delete blood bank
    const handleDelete = async (bankId) => {
        try {
            setActionLoading(bankId);
            const token = sessionStorage.getItem('token');
            const response = await fetch(`http://localhost:5000/api/blood-banks/${bankId}`, {
                method: 'DELETE',
                headers: {
                'Authorization': `Bearer ${token}`
                }
            });
        
            if (response.ok) {
                await fetchBloodBanks();
                setShowDeleteModal(false);
                setBankToDelete(null);
                setSuccessMessage('Blood bank deleted successfully!');
                setTimeout(() => setSuccessMessage(''), 5000);
            } else {
                setError('Failed to delete blood bank');
            }
            } catch (error) {
            setError('Failed to delete blood bank');
        } finally {
            setActionLoading(null);
        }
    };

    // Filter and pagination
    const filteredBanks = bloodBanks.filter(bank => {
        const matchesSearch = bank.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            bank.area.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesArea = selectedArea === 'all' || bank.area === selectedArea;
        return matchesSearch && matchesArea;
    });

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredBanks.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredBanks.length / itemsPerPage);

    // Keyboard navigation for accessibility
    const handleKeyDown = (event) => {
        if (event.key === 'Escape') {
            setShowModal(false);
            setShowDeleteModal(false);
        }
    };

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    
    return (
        <AdminLayout>
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md">
            {/* Enhanced Header */}
            <div className="p-6 sm:p-8 border-b border-gray-200 bg-gradient-to-r from-red-50 via-white to-red-50">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center space-x-4">
                <div className="p-2 sm:p-3 bg-gradient-to-br from-red-100 to-red-200 rounded-xl shadow-sm">
                    <Building2 className="h-6 w-6 sm:h-8 sm:w-8 text-red-600" />
                </div>
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Blood Banks Management</h1>
                    <p className="text-gray-600 mt-1 text-sm sm:text-base">Manage blood bank locations, contact information, and operating hours</p>
                </div>
                </div>

                <button
                onClick={() => {
                    setModalMode('add');
                    setSelectedBank(null);
                    setShowModal(true);
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center px-4 sm:px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl flex items-center 
                    hover:from-red-700 hover:to-red-800 transition-all duration-200 transform hover:-translate-y-0.5 
                    shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                <Plus className="h-5 w-5 mr-2" />
                <span className="hidden sm:inline">Add Blood Bank</span>
                <span className="sm:hidden">Add</span>
                </button>
            </div>
            </div>

            {/* Enhanced Search & Filters */}
            <div className="p-4 sm:p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                <div className="space-y-4">
                    {/* Filter Chips */}
                    {hasActiveFilters && (
                        <div className="flex flex-wrap gap-2">
                            {searchTerm && (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                                    Search: "{searchTerm}"
                                    <button
                                        onClick={() => setSearchTerm('')}
                                        className="ml-2 text-blue-600 hover:text-blue-800"
                                        aria-label={`Remove search filter: ${searchTerm}`}
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </span>
                            )}
                            {selectedArea !== 'all' && (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
                                    Area: {selectedArea}
                                    <button
                                        onClick={() => setSelectedArea('all')}
                                        className="ml-2 text-green-600 hover:text-green-800"
                                        aria-label={`Remove area filter: ${selectedArea}`}
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                            <input
                                type="text"
                                placeholder="Search by name or area..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl 
                                focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all duration-200"
                                aria-label="Search blood banks"
                            />
                        </div>

                        <div className="relative">
                            <select
                                value={selectedArea}
                                onChange={(e) => setSelectedArea(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl 
                                focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all duration-200 appearance-none bg-white"
                                aria-label="Filter by area"
                            >
                                <option value="all">All Areas</option>
                                {JOHOR_AREAS.map((area) => (
                                    <option key={area} value={area}>{area}</option>
                                ))}
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                <Filter className="h-5 w-5 text-gray-400" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Success Message */}
            {successMessage && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-xl mx-4 sm:mx-6 mt-4 flex items-center space-x-2" role="alert">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-green-700">{successMessage}</span>
                </div>
            )}

            {/* Enhanced Table */}
            <div className="bg-white rounded-lg">
            {loading ? (
                <div className="flex justify-center items-center py-16">
                <div className="text-center">
                    <div className="relative mb-4">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full absolute border-4 border-gray-200"></div>
                        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full animate-spin absolute border-4 border-red-600 border-t-transparent"></div>
                    </div>
                    <p className="text-gray-500 text-base sm:text-lg">Loading blood banks...</p>
                </div>
                </div>
            ) : filteredBanks.length === 0 ? (
                <div className="text-center py-16">
                    <Building2 className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 text-base sm:text-lg mb-2">No blood banks found</p>
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
                <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-200" role="table" aria-label="Blood banks list">
                    <thead>
                    <tr className="border-b border-gray-200">
                        <TableHeader>Name & Address</TableHeader>
                        <TableHeader>Area</TableHeader>
                        <TableHeader>Contact</TableHeader>
                        <TableHeader>Operating Hours</TableHeader>
                        <TableHeader>Actions</TableHeader>
                    </tr>
                    </thead>
                    <tbody>
                    {currentItems.map((bank, index) => (
                        <tr 
                            key={bank.id} 
                            className={`hover:bg-gray-50 transition-all duration-200 
                                    ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                                    ${index !== currentItems.length - 1 ? 'border-b border-gray-200' : ''}`}
                            role="row"
                            aria-label={`Blood bank: ${bank.name} in ${bank.area}`}
                        >
                        <td className="px-4 sm:px-6 py-4 border-r border-gray-200">
                            <div>
                            <div className="text-sm font-semibold text-gray-900 mb-2">{bank.name}</div>
                            <div className="text-sm text-gray-500 flex items-start">
                                <MapPin className="h-4 w-4 mr-2 mt-1 flex-shrink-0 text-gray-400" />
                                <span className="break-words">{bank.address}</span>
                            </div>
                            </div>
                        </td>
                        <td className="px-4 sm:px-6 py-4 border-r border-gray-200">
                            <StatusBadge area={bank.area} />
                        </td>
                        <td className="px-4 sm:px-6 py-4 border-r border-gray-200">
                            <div className="text-sm text-gray-900 flex items-center">
                            <Phone className="h-4 w-4 mr-2 text-gray-400" />
                            <span className="break-words">{bank.contact}</span>
                            </div>
                        </td>
                        <td className="px-4 sm:px-6 py-4 border-r border-gray-200">
                            <div className="text-sm text-gray-900 flex items-center">
                            <Clock className="h-4 w-4 mr-2 text-gray-400" />
                            <span className="break-words">{bank.operating_hours}</span>
                            </div>
                        </td>
                        <td className="px-4 sm:px-6 py-4">
                            <div className="flex space-x-2">
                            <ActionButton
                                onClick={() => {
                                setSelectedBank(bank);
                                setModalMode('edit');
                                setShowModal(true);
                                }}
                                icon={Edit}
                                color="blue"
                                label="Edit"
                            />
                            <ActionButton
                                onClick={() => {
                                setBankToDelete(bank);
                                setShowDeleteModal(true);
                                }}
                                icon={Trash}
                                color="red"
                                label="Delete"
                                loading={actionLoading === bank.id}
                            />
                            </div>
                        </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
                </div>
            )}


            {/* Enhanced Pagination */}
            {!loading && filteredBanks.length > 0 && (
                <div className="p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between border-t border-gray-200 gap-4">
                    <div className="text-center sm:text-left">
                        <p className="text-sm text-gray-700">
                            Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to{' '}
                            <span className="font-medium">
                            {Math.min(indexOfLastItem, filteredBanks.length)}
                            </span>{' '}
                            of <span className="font-medium">{filteredBanks.length}</span> results
                        </p>
                        <div className="mt-2">
                            <label htmlFor="items-per-page" className="text-sm text-gray-600 mr-2">
                                Show:
                            </label>
                            <select
                                id="items-per-page"
                                value={itemsPerPage}
                                onChange={(e) => {
                                    setItemsPerPage(Number(e.target.value));
                                    setCurrentPage(1);
                                }}
                                className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                            >
                                <option value={5}>5</option>
                                <option value={10}>10</option>
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="px-3 sm:px-4 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-50 
                            hover:bg-gray-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                            aria-label="Go to previous page"
                        >
                            Previous
                        </button>
                        {[...Array(totalPages)].map((_, i) => {
                            const pageNumber = i + 1;
                            if (
                                pageNumber === 1 ||
                                pageNumber === totalPages ||
                                (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                            ) {
                                return (
                                    <button
                                        key={pageNumber}
                                        onClick={() => setCurrentPage(pageNumber)}
                                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                                            ${currentPage === pageNumber
                                                ? 'bg-red-600 text-white border border-red-600 shadow-md'
                                                : 'border border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                                            }`}
                                        aria-label={`Go to page ${pageNumber}`}
                                        aria-current={currentPage === pageNumber ? 'page' : undefined}
                                    >
                                        {pageNumber}
                                    </button>
                                );
                            } else if (pageNumber === currentPage - 2 || pageNumber === currentPage + 2) {
                                return <span key={pageNumber} className="px-2 text-gray-500">...</span>;
                            }
                            return null;
                        })}
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="px-3 sm:px-4 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-50 
                            hover:bg-gray-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                            aria-label="Go to next page"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
            </div>
        </div>

        {showModal && (
            <BloodBankModal
            onClose={() => {
                setShowModal(false);
                setSelectedBank(null);
            }}
            />
        )}

        {error && (
            <div className="fixed bottom-4 right-4 bg-red-100 border border-red-200 text-red-700 p-4 rounded-xl shadow-lg flex items-center space-x-2" role="alert">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <span>{error}</span>
            </div>
        )}
        
        {showDeleteModal && bankToDelete && (
        <DeleteConfirmationModal
            bank={bankToDelete}
            onConfirm={() => handleDelete(bankToDelete.id)}
            onCancel={() => {
                setShowDeleteModal(false);
                setBankToDelete(null);
            }}
            isDeleting={actionLoading === bankToDelete.id}
        />
        )}
        </AdminLayout>
    );
};

export default BloodBanksManagement;