import { API_BASE_URL } from '../../config/api.js';
import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Droplet, 
  ArrowLeft, 
  Phone, 
  Clock, 
  ExternalLink, 
  AlertCircle,
  Activity
} from 'lucide-react';
import { Link } from 'react-router-dom';

const SpecifyAvailability = () => {
  const [bankDetails, setBankDetails] = useState(null);
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const bankId = new URLSearchParams(window.location.search).get('bank');
    if (bankId) {
      fetchBankDetails(bankId);
      fetchAvailability(bankId);
    }
  }, []);

  const fetchBankDetails = async (bankId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/blood-banks/${bankId}`);
      const data = await response.json();
      if (data.success) {
        setBankDetails(data.data);
      }
    } catch (error) {
      setError('Failed to fetch blood bank details');
    }
  };

  const fetchAvailability = async (bankId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/blood-banks/${bankId}/availability`);
      const data = await response.json();
      if (data.success) {
        setAvailability(data.data);
      }
    } catch (error) {
      setError('Failed to fetch availability data');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getAvailabilityStatus = (units) => {
    if (units <= 10) return { color: 'text-red-600', bg: 'bg-red-100', text: 'Critical' };
    if (units <= 30) return { color: 'text-yellow-600', bg: 'bg-yellow-100', text: 'Low' };
    return { color: 'text-green-600', bg: 'bg-green-100', text: 'Good' };
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-600 border-t-transparent"></div>
          <p className="text-gray-600">Loading blood bank information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <Link 
        to="/directory"
        className="inline-flex items-center text-gray-600 hover:text-red-600 mb-8 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <ArrowLeft className="w-5 h-5 mr-2" />
        Back to Directory
      </Link>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {error && (
          <div className="p-4 bg-red-50 border-l-4 border-red-400 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span className="text-red-700">{error}</span>
          </div>
        )}

        {bankDetails && (
          <div className="p-8">
            <div className="flex flex-col md:flex-row justify-between gap-6 mb-12">
              <div className="space-y-4">
                <h1 className="text-3xl font-bold text-gray-900">{bankDetails.name}</h1>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-red-500 flex-shrink-0 mt-1" />
                    <span className="text-gray-600">{bankDetails.address}</span>
                  </div>
                  {bankDetails.contact && (
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-red-500 flex-shrink-0" />
                      <span className="text-gray-600">{bankDetails.contact}</span>
                    </div>
                  )}
                  {bankDetails.operating_hours && (
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-red-500 flex-shrink-0" />
                      <span className="text-gray-600">{bankDetails.operating_hours}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(bankDetails.address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-red-600 hover:text-red-700 px-4 py-2 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
              >
                <MapPin className="w-5 h-5" />
                View on Maps
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            <div className="mb-8">
              <div className="flex items-center gap-2 mb-6">
                <Activity className="w-5 h-5 text-gray-500" />
                <h2 className="text-xl font-semibold text-gray-900">Current Blood Availability</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                {availability.map((item) => (
                  <div 
                    key={item.blood_type}
                    className="relative bg-white border rounded-xl p-6 transition-all duration-200 hover:shadow-md"
                  >
                    {/* Status Badge */}
                    <div className={`absolute -top-2 right-4 px-2 py-1 rounded-full text-xs font-medium ${
                      getAvailabilityStatus(item.units_available).bg
                    } ${getAvailabilityStatus(item.units_available).color}`}>
                      {getAvailabilityStatus(item.units_available).text}
                    </div>

                    <div className="flex flex-col items-center">
                      <Droplet className={`w-10 h-10 mb-3 ${
                        item.units_available > 0 ? 'text-red-500' : 'text-gray-400'
                      }`} />
                      <div className="text-2xl font-bold text-gray-900 mb-2">
                        {item.blood_type}
                      </div>
                      <div className="text-lg font-semibold text-gray-700 mb-2">
                        {item.units_available} units
                      </div>
                      <div className="text-xs text-gray-500 text-center">
                        Last updated:<br />
                        {formatDate(item.last_updated)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SpecifyAvailability;