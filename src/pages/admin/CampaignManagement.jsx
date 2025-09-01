import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Plus, Edit, Trash, Clock, Search, Eye, X, Filter, CheckCircle, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import AdminLayout from '../../components/layout/AdminDashboardLayout';

const CampaignManagement = () => {
    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('add');
    const [selectedCampaign, setSelectedCampaign] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [activeTab, setActiveTab] = useState('upcoming');
    const [itemsPerPage] = useState(10);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [campaignToDelete, setCampaignToDelete] = useState(null);
    const [showFilters, setShowFilters] = useState(false);
    const [selectedOrganizer, setSelectedOrganizer] = useState('all');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    

    const getFilteredCampaigns = () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
    
        return campaigns.filter(campaign => {
          // Check if campaign has any sessions
        if (!campaign.sessions || campaign.sessions.length === 0) return false;
    
          // Get the latest session date for this campaign
        const latestSession = new Date(Math.max(...campaign.sessions.map(
            session => new Date(session.date)
        )));
    
        if (activeTab === 'upcoming') {
            return latestSession >= today;
        } else {
            return latestSession < today;
        }
        });
    };

    const getUniqueOrganizers = () => {
        return [...new Set(campaigns.map(campaign => campaign.organizer))];
    };

    const clearFilters = () => {
        setSearchTerm('');
        setSelectedOrganizer('all');
    };

    const hasActiveFilters = () => {
        return searchTerm || selectedOrganizer !== 'all';
    };

    const DeleteConfirmationModal = ({ campaign, onConfirm, onCancel }) => (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl">
                <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
                    <Trash className="h-8 w-8 text-red-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    Delete Campaign
                </h3>
                <p className="text-sm text-gray-600 mb-8 leading-relaxed">
                    Are you sure you want to delete campaign <span className="font-medium text-gray-900">"{campaign.location}"</span>? This action cannot be undone.
                </p>
                
                <div className="flex justify-end space-x-3">
                    <button
                    onClick={onCancel}
                    className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200"
                    >
                    Cancel
                    </button>
                    <button
                    onClick={onConfirm}
                    className="px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-red-600 to-red-700 border border-transparent rounded-xl hover:from-red-700 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200"
                    >
                    Delete Campaign
                    </button>
                </div>
                </div>
            </div>
    </div>
    );

    const formatDateForInput = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
    };

    useEffect(() => {
        fetchCampaigns();
    }, []);

    const fetchCampaigns = async () => {
        try {
        const token = sessionStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/admin/campaigns', {
            headers: {
            'Authorization': `Bearer ${token}`
            }
        });
        const data = await response.json();
        
        if (data.success) {
            setCampaigns(data.data);
        } else {
            setError('Failed to fetch campaigns');
        }
        } catch (error) {
        setError('Failed to fetch campaigns');
        } finally {
        setLoading(false);
        }
    };

    const CampaignModal = ({ onClose }) => {
        const [formErrors, setFormErrors] = useState({});
        const [isSubmitting, setIsSubmitting] = useState(false);

        const validateForm = () => {
            const errors = {};
            
            if (!formData.location.trim()) {
                errors.location = 'Location is required';
            }
            
            if (!formData.organizer.trim()) {
                errors.organizer = 'Organizer is required';
            }
            
            if (!formData.address.trim()) {
                errors.address = 'Address is required';
            }
            
            const lat = parseFloat(formData.latitude);
            const lng = parseFloat(formData.longitude);
            
            if (isNaN(lat) || isNaN(lng)) {
                errors.coordinates = 'Please enter valid numeric coordinates';
            } else {
                if (lat < -90 || lat > 90) {
                    errors.latitude = 'Latitude must be between -90 and 90 degrees';
                }
                if (lng < -180 || lng > 180) {
                    errors.longitude = 'Longitude must be between -180 and 180 degrees';
                }
            }
            
            if (!formData.sessions || formData.sessions.length === 0) {
                errors.sessions = 'At least one session is required';
            } else {
                formData.sessions.forEach((session, index) => {
                    if (!session.date) {
                        errors[`session_${index}_date`] = 'Date is required';
                    }
                    if (!session.start_time) {
                        errors[`session_${index}_start_time`] = 'Start time is required';
                    }
                    if (!session.end_time) {
                        errors[`session_${index}_end_time`] = 'End time is required';
                    }
                });
            }
            
            setFormErrors(errors);
            return Object.keys(errors).length === 0;
        };

        const validateCoordinates = () => {
            const lat = parseFloat(formData.latitude);
            const lng = parseFloat(formData.longitude);
            
            if (isNaN(lat) || isNaN(lng)) {
                setError('Please enter numeric values for coordinates');
                return false;
            }
            
            if (lat < -90 || lat > 90) {
                setError('Latitude must be between -90 and 90 degrees');
                return false;
            }
        
            if (lng < -180 || lng > 180) {
                setError('Longitude must be between -180 and 180 degrees');
                return false;
            }
            
            return true;
        };

        const [formData, setFormData] = useState(
            selectedCampaign ? {
                ...selectedCampaign,
                sessions: selectedCampaign.sessions.map(session => ({
                ...session,
                date: formatDateForInput(session.date)
            }))
            } : {
                location: '',
                organizer: '',
                address: '',
                latitude: '',
                longitude: '',
                sessions: [{
                date: '',
                start_time: '',
                end_time: ''
            }]
            }
        );

        const addSession = () => {
        setFormData({
            ...formData,
            sessions: [
            ...formData.sessions,
            { date: '', start_time: '', end_time: '' }
            ]
        });
        };

        const removeSession = (index) => {
        const newSessions = formData.sessions.filter((_, i) => i !== index);
        setFormData({
            ...formData,
            sessions: newSessions
        });
        };

        const handleSessionChange = (index, field, value) => {
        const newSessions = [...formData.sessions];
        newSessions[index] = {
            ...newSessions[index], 
            [field]: value
        };
        setFormData({
            ...formData,
            sessions: newSessions
        });
        };

        const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const token = sessionStorage.getItem('token');
            const url = modalMode === 'add' 
            ? 'http://localhost:5000/api/admin/campaigns'
            : `http://localhost:5000/api/admin/campaigns/${selectedCampaign.id}`;
            
            const response = await fetch(url, {
            method: modalMode === 'add' ? 'POST' : 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
            });

            if (response.ok) {
            setSuccessMessage(modalMode === 'add' ? 'Campaign added successfully!' : 'Campaign updated successfully!');
            fetchCampaigns();
            setTimeout(() => {
                onClose();
                setSuccessMessage('');
            }, 1500);
            } else {
            const errorData = await response.json();
            setError(errorData.message || 'Failed to save campaign');
            }
        } catch (error) {
            setError('Failed to save campaign');
        } finally {
            setIsSubmitting(false);
        }
        };

        return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] shadow-2xl overflow-hidden flex flex-col">
            {/* Modal Header - Fixed */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white flex-shrink-0">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-red-100 rounded-lg">
                        <Calendar className="h-6 w-6 text-red-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">
                        {modalMode === 'view' ? 'Campaign Details' : 
                        modalMode === 'add' ? 'Add New Campaign' : 'Edit Campaign'}
                    </h2>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Location <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        required
                        value={formData.location}
                        readOnly={modalMode === 'view'}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors ${
                            formErrors.location ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        } ${modalMode === 'view' ? 'bg-gray-50' : ''}`}
                        placeholder="e.g., JOHOR BAHRU - AEON TERBAU CITY"
                    />
                    {formErrors.location && (
                        <p className="mt-1 text-sm text-red-600 flex items-center">
                            <AlertCircle className="h-4 w-4 mr-1" />
                            {formErrors.location}
                        </p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                    Organizer <span className="text-red-500">*</span>
                    </label>
                    <input
                    type="text"
                    required
                    value={formData.organizer}
                    readOnly={modalMode === 'view'}
                    onChange={(e) => setFormData({ ...formData, organizer: e.target.value })}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors ${
                        formErrors.organizer ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    } ${modalMode === 'view' ? 'bg-gray-50' : ''}`}
                    placeholder="e.g., Organization Name"
                    />
                    {formErrors.organizer && (
                        <p className="mt-1 text-sm text-red-600 flex items-center">
                            <AlertCircle className="h-4 w-4 mr-1" />
                            {formErrors.organizer}
                        </p>
                    )}
                </div>
                </div>

                <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address <span className="text-red-500">*</span>
                </label>
                <textarea
                    required
                    value={formData.address}
                    readOnly={modalMode === 'view'}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors resize-none ${
                        formErrors.address ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    } ${modalMode === 'view' ? 'bg-gray-50' : ''}`}
                    rows="3"
                    placeholder="Full address of the campaign location"
                />
                {formErrors.address && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {formErrors.address}
                    </p>
                )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Latitude <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="number"
                        step="any"
                        required
                        value={formData.latitude}
                        readOnly={modalMode === 'view'}
                        onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors ${
                            formErrors.latitude || formErrors.coordinates ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        } ${modalMode === 'view' ? 'bg-gray-50' : ''}`}
                        placeholder="e.g., 1.5489000"
                    />
                    <p className="mt-1 text-xs text-gray-500">Valid range: -90 to 90</p>
                    {(formErrors.latitude || formErrors.coordinates) && (
                        <p className="mt-1 text-sm text-red-600 flex items-center">
                            <AlertCircle className="h-4 w-4 mr-1" />
                            {formErrors.latitude || formErrors.coordinates}
                        </p>
                    )}
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Longitude <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="number"
                        step="any"
                        required
                        value={formData.longitude}
                        readOnly={modalMode === 'view'}
                        onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors ${
                            formErrors.longitude || formErrors.coordinates ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        } ${modalMode === 'view' ? 'bg-gray-50' : ''}`}
                        placeholder="e.g., 103.7956000"
                    />
                    <p className="mt-1 text-xs text-gray-500">Valid range: -180 to 180</p>
                    {(formErrors.longitude || formErrors.coordinates) && (
                        <p className="mt-1 text-sm text-red-600 flex items-center">
                            <AlertCircle className="h-4 w-4 mr-1" />
                            {formErrors.longitude || formErrors.coordinates}
                        </p>
                    )}
                </div>
                </div>

                <div>
                <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Campaign Sessions <span className="text-red-500">*</span>
                </label>
                {formErrors.sessions && (
                    <p className="mb-3 text-sm text-red-600 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {formErrors.sessions}
                    </p>
                )}
                {modalMode !== 'view' ? (
                    // Editable sessions form
                    <div className="space-y-4">
                    {formData.sessions.map((session, index) => (
                        <div key={index} className="p-6 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-sm font-medium text-gray-700">Session {index + 1}</h4>
                            {formData.sessions.length > 1 && (
                                <button
                                type="button"
                                onClick={() => removeSession(index)}
                                className="text-red-600 hover:text-red-800 text-sm flex items-center"
                                >
                                <X className="h-4 w-4 mr-1" />
                                Remove
                                </button>
                            )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Date <span className="text-red-500">*</span></label>
                            <input
                                type="date"
                                required
                                value={session.date}
                                onChange={(e) => handleSessionChange(index, 'date', e.target.value)}
                                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors ${
                                    formErrors[`session_${index}_date`] ? 'border-red-300 bg-red-50' : 'border-gray-300'
                                }`}
                            />
                            {formErrors[`session_${index}_date`] && (
                                <p className="mt-1 text-sm text-red-600 flex items-center">
                                    <AlertCircle className="h-4 w-4 mr-1" />
                                    {formErrors[`session_${index}_date`]}
                                </p>
                            )}
                            </div>
                            <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Start Time <span className="text-red-500">*</span></label>
                            <input
                                type="time"
                                required
                                value={session.start_time}
                                onChange={(e) => handleSessionChange(index, 'start_time', e.target.value)}
                                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors ${
                                    formErrors[`session_${index}_start_time`] ? 'border-red-300 bg-red-50' : 'border-gray-300'
                                }`}
                            />
                            {formErrors[`session_${index}_start_time`] && (
                                <p className="mt-1 text-sm text-red-600 flex items-center">
                                    <AlertCircle className="h-4 w-4 mr-1" />
                                    {formErrors[`session_${index}_start_time`]}
                                </p>
                            )}
                            </div>
                            <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">End Time <span className="text-red-500">*</span></label>
                            <input
                                type="time"
                                required
                                value={session.end_time}
                                onChange={(e) => handleSessionChange(index, 'end_time', e.target.value)}
                                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors ${
                                    formErrors[`session_${index}_end_time`] ? 'border-red-300 bg-red-50' : 'border-gray-300'
                                }`}
                            />
                            {formErrors[`session_${index}_end_time`] && (
                                <p className="mt-1 text-sm text-red-600 flex items-center">
                                    <AlertCircle className="h-4 w-4 mr-1" />
                                    {formErrors[`session_${index}_end_time`]}
                                </p>
                            )}
                            </div>
                        </div>
                        </div>
                    ))}
                    <button
                        type="button"
                        onClick={addSession}
                        className="mt-4 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 hover:border-red-300 transition-colors flex items-center"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Another Session
                    </button>
                    </div>
                ) : (
                    // Read-only sessions view (for view mode)
                    <div className="space-y-4">
                    {formData.sessions.map((session, index) => (
                        <div key={index} className="p-4 bg-gray-50 rounded-md">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                            <p className="text-sm text-gray-600">Date</p>
                            <p className="font-medium">{formatDate(session.date)}</p>
                            </div>
                            <div>
                            <p className="text-sm text-gray-600">Start Time</p>
                            <p className="font-medium">{session.start_time}</p>
                            </div>
                            <div>
                            <p className="text-sm text-gray-600">End Time</p>
                            <p className="font-medium">{session.end_time}</p>
                            </div>
                        </div>
                        </div>
                    ))}
                    </div>
                )}
                </div>
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
                    Close
                </button>
                {modalMode !== 'view' && (
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-red-600 to-red-700 border border-transparent rounded-xl hover:from-red-700 hover:to-red-800 disabled:bg-gray-300 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200 flex items-center space-x-2"
                        onClick={handleSubmit}
                    >
                        {isSubmitting ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                <span>{modalMode === 'add' ? 'Adding...' : 'Saving...'}</span>
                            </>
                        ) : (
                            <>
                                <CheckCircle className="h-4 w-4" />
                                <span>{modalMode === 'add' ? 'Add Campaign' : 'Save Changes'}</span>
                            </>
                        )}
                    </button>
                )}
            </div>
        </div>
        </div>
        );
    };

    const handleDelete = async (campaignId) => {
        try {
            const token = sessionStorage.getItem('token');
            const response = await fetch(`http://localhost:5000/api/admin/campaigns/${campaignId}`, {
                method: 'DELETE',
                headers: {
                'Authorization': `Bearer ${token}`
                }
            });
        
            if (response.ok) {
                setSuccessMessage('Campaign deleted successfully!');
                fetchCampaigns();
                setShowDeleteModal(false);
                setCampaignToDelete(null);
                setTimeout(() => setSuccessMessage(''), 3000);
            } else {
                setError('Failed to delete campaign');
            }
            } catch (error) {
            setError('Failed to delete campaign');
        }
    };

    const filteredCampaigns = getFilteredCampaigns().filter(campaign => {
        const matchesSearch = campaign.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            campaign.organizer.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesOrganizer = selectedOrganizer === 'all' || campaign.organizer === selectedOrganizer;
        return matchesSearch && matchesOrganizer;
    });

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredCampaigns.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredCampaigns.length / itemsPerPage);

    const formatDate = (date) => {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    };
  
    const formatTime = (time) => {
      return time.slice(0, 5);
    };

    const CampaignTable = ({ campaigns, activeTab, onEdit, onDelete, onView }) => {
    
      return (
        <div className="overflow-hidden rounded-2xl bg-white border border-gray-200 shadow-lg">
          {/* Table Header */}
          <div className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
            <div className="grid grid-cols-12 divide-x divide-gray-200">
              <div className="col-span-5 px-6 py-4">
                <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  Campaign Details
                </span>
              </div>
              <div className="col-span-4 px-6 py-4">
                <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  Sessions
                </span>
              </div>
              <div className="col-span-3 px-6 py-4">
                <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  Actions
                </span>
              </div>
            </div>
          </div>
    
          {/* Table Body */}
          <div className="divide-y divide-gray-200">
            {campaigns.map((campaign, index) => (
              <div key={campaign.id} className={`hover:bg-gray-50 transition-all duration-200 ${
                index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
              }`}>
                <div className="grid grid-cols-12 divide-x divide-gray-200">
                  {/* Campaign Details */}
                  <div className="col-span-5 p-6">
                    <div className="space-y-3">
                      <div className="flex flex-col">
                        <span className="text-base font-semibold text-gray-900">
                          {campaign.location}
                        </span>
                        <span className="text-sm text-gray-600 font-medium">
                          {campaign.organizer}
                        </span>
                      </div>
                      <div className="flex items-start space-x-2">
                        <MapPin className="h-4 w-4 text-gray-400 mt-1 flex-shrink-0" />
                        <span className="text-sm text-gray-500 break-words leading-relaxed">
                          {campaign.address}
                        </span>
                      </div>
                    </div>
                  </div>
    
                  {/* Sessions */}
                  <div className="col-span-4 p-6">
                    <div className="space-y-4">
                      {campaign.sessions.map((session, idx) => (
                        <div key={idx} className="p-3 bg-white rounded-lg border border-gray-100 shadow-sm">
                          <div className="flex items-center space-x-2 mb-2">
                            <Calendar className="h-4 w-4 text-red-500" />
                            <span className="text-sm font-medium text-gray-900">
                              {formatDate(session.date)}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 ml-6">
                            <Clock className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-600">
                              {formatTime(session.start_time)} - {formatTime(session.end_time)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
    
                  {/* Actions */}
                  <div className="col-span-3 p-6">
                    <div className="flex space-x-2">
                      {activeTab === 'upcoming' ? (
                        <>
                          <button
                            onClick={() => onEdit(campaign)}
                            className="p-3 text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200 hover:scale-105 group relative"
                            title="Edit Campaign"
                          >
                            <Edit className="h-5 w-5" />
                            <span className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 
                                bg-gray-800 text-white px-2 py-1 text-xs rounded opacity-0 group-hover:opacity-100 
                                pointer-events-none transition-opacity duration-200 whitespace-nowrap z-10">
                                Edit Campaign
                            </span>
                          </button>
                          <button
                            onClick={() => onDelete(campaign)}
                            className="p-3 text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 hover:scale-105 group relative"
                            title="Delete Campaign"
                          >
                            <Trash className="h-5 w-5" />
                            <span className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 
                                bg-gray-800 text-white px-2 py-1 text-xs rounded opacity-0 group-hover:opacity-100 
                                pointer-events-none transition-opacity duration-200 whitespace-nowrap z-10">
                                Delete Campaign
                            </span>
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => onView(campaign)}
                          className="p-3 text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-200 hover:scale-105 group relative"
                          title="View Campaign"
                        >
                          <Eye className="h-5 w-5" />
                          <span className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 
                              bg-gray-800 text-white px-2 py-1 text-xs rounded opacity-0 group-hover:opacity-100 
                              pointer-events-none transition-opacity duration-200 whitespace-nowrap z-10">
                              View Campaign
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
    
          {/* Empty State */}
          {campaigns.length === 0 && (
            <div className="text-center py-16 border-t border-gray-200">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gray-100 mb-4">
                <Calendar className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No campaigns found</h3>
              <p className="text-sm text-gray-500 mb-6">
                {activeTab === 'upcoming' 
                  ? 'No upcoming campaigns scheduled' 
                  : 'No recent campaigns found'}
              </p>
              {activeTab === 'upcoming' && (
                <button
                  onClick={() => {
                    setModalMode('add');
                    setSelectedCampaign(null);
                    setShowModal(true);
                  }}
                  className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 hover:border-red-300 transition-colors"
                >
                  Create Your First Campaign
                </button>
              )}
            </div>
          )}
        </div>
      );
    };

    return (
        <AdminLayout>
            <div className="p-8 border-b border-gray-200 bg-gradient-to-r from-red-50 via-white to-red-50">
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-4 lg:space-y-0">
                <div className="flex items-center space-x-4">
                <div className="p-3 bg-gradient-to-br from-red-100 to-red-200 rounded-xl shadow-sm">
                    <Calendar className="h-8 w-8 text-red-600" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Campaign Management</h1>
                    <p className="text-gray-600 mt-1">Manage blood donation campaigns and events</p>
                </div>
                </div>

                <button
                onClick={() => {
                    setModalMode('add');
                    setSelectedCampaign(null);
                    setShowModal(true);
                }}
                className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl flex items-center 
                    hover:from-red-700 hover:to-red-800 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                <Plus className="h-5 w-5 mr-2" />
                Add Campaign
                </button>
            </div>
            </div>

            <div className="border-b border-gray-200 bg-white">
                <nav className="flex -mb-px px-8">
                    <button
                    onClick={() => setActiveTab('upcoming')}
                    className={`py-4 px-6 inline-flex items-center border-b-2 font-medium text-sm transition-colors
                        ${activeTab === 'upcoming' 
                        ? 'border-red-500 text-red-600 bg-red-50' 
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                    >
                    <Calendar className="h-4 w-4 mr-2" />
                    Upcoming Campaigns
                    </button>
                    <button
                    onClick={() => setActiveTab('recent')}
                    className={`py-4 px-6 inline-flex items-center border-b-2 font-medium text-sm transition-colors
                        ${activeTab === 'recent' 
                        ? 'border-red-500 text-red-600 bg-red-50' 
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                    >
                    <Clock className="h-4 w-4 mr-2" />
                    Recent Campaigns
                    </button>
                </nav>
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
                                    placeholder="Search campaigns by location or organizer..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl 
                                    focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors bg-white"
                                />
                            </div>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                                <Filter className="h-5 w-5 text-gray-500" />
                                <select
                                    value={selectedOrganizer}
                                    onChange={(e) => setSelectedOrganizer(e.target.value)}
                                    className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors bg-white"
                                >
                                    <option value="all">All Organizers</option>
                                    {getUniqueOrganizers().map(organizer => (
                                        <option key={organizer} value={organizer}>{organizer}</option>
                                    ))}
                                </select>
                            </div>
                            
                            {hasActiveFilters() && (
                                <button
                                    onClick={clearFilters}
                                    className="px-4 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors flex items-center"
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
                            {selectedOrganizer !== 'all' && (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 border border-blue-200">
                                    Organizer: {selectedOrganizer}
                                    <button
                                        onClick={() => setSelectedOrganizer('all')}
                                        className="ml-2 hover:bg-blue-200 rounded-full p-0.5"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </span>
                            )}
                        </div>
                    )}
                </div>

            {/* Campaigns Table */}
            <CampaignTable
                campaigns={currentItems}
                activeTab={activeTab}
                onEdit={(campaign) => {
                    setSelectedCampaign(campaign);
                    setModalMode('edit');
                    setShowModal(true);
                }}
                onDelete={(campaign) => {
                    setCampaignToDelete(campaign);
                    setShowDeleteModal(true);
                }}
                onView={(campaign) => {
                    setSelectedCampaign(campaign);
                    setModalMode('view');
                    setShowModal(true);
                }}
            />

            {/* Pagination */}
            {filteredCampaigns.length > 0 && (
                <div className="mt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between border-t border-gray-200 pt-6">
                <div className="mb-4 sm:mb-0">
                    <p className="text-sm text-gray-700">
                    Showing <span className="font-semibold text-gray-900">{indexOfFirstItem + 1}</span> to{' '}
                    <span className="font-semibold text-gray-900">
                        {Math.min(indexOfLastItem, filteredCampaigns.length)}
                    </span>{' '}
                    of <span className="font-semibold text-gray-900">{filteredCampaigns.length}</span> campaigns
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                    Previous
                    </button>
                    <div className="flex space-x-1">
                        {[...Array(totalPages)].map((_, i) => (
                        <button
                            key={i + 1}
                            onClick={() => setCurrentPage(i + 1)}
                            className={`px-3 py-2 border rounded-xl text-sm font-medium transition-colors ${
                            currentPage === i + 1 
                                ? 'bg-red-600 text-white border-red-600' 
                                : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                            }`}
                        >
                            {i + 1}
                        </button>
                        ))}
                    </div>
                    <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                    Next
                    </button>
                </div>
                </div>
            )}
        </div>

        {showModal && (
        <CampaignModal
            onClose={() => {
            setShowModal(false);
            setSelectedCampaign(null);
            }}
        />
        )}

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

        {showDeleteModal && campaignToDelete && (
        <DeleteConfirmationModal
            campaign={campaignToDelete}
            onConfirm={() => handleDelete(campaignToDelete.id)}
            onCancel={() => {
            setShowDeleteModal(false);
            setCampaignToDelete(null);
            }}
        />
        )}
    </AdminLayout>
    );
};

export default CampaignManagement;