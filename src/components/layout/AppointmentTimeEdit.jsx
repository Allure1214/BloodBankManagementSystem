import { API_BASE_URL } from '../../config/api.js';
import React, { useState, useEffect } from 'react';
import { Clock, X, Loader2, Calendar, MapPin, Info, AlertCircle } from 'lucide-react';

const AppointmentTimeEdit = ({ appointment, onUpdate, onClose }) => {
  const [selectedTime, setSelectedTime] = useState(appointment.preferred_time);
  const [timeSlots, setTimeSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingSlots, setFetchingSlots] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTimeSlots();
  }, []);

  const fetchTimeSlots = async () => {
    try {
      setFetchingSlots(true);
      
      const date = new Date(appointment.session_date);
      const formattedDate = date.toLocaleDateString('en-CA');
  
      const response = await fetch(
        `${API_BASE_URL}/appointment/time-slots/${appointment.campaign_id}/${formattedDate}`,
        {
          headers: {
            'Authorization': `Bearer ${sessionStorage.getItem('token')}`
          }
        }
      );
  
      if (!response.ok) {
        throw new Error('Failed to fetch time slots');
      }
  
      const data = await response.json();
      if (data.success) {
        setTimeSlots(data.data);
      } else {
        throw new Error(data.message || 'Failed to load time slots');
      }
    } catch (err) {
      setError('Failed to load available time slots');
      console.error('Error fetching time slots:', err);
    } finally {
      setFetchingSlots(false);
    }
  };

  const handleUpdate = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(`${API_BASE_URL}/appointment/${appointment.id}/update-time`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        },
        body: JSON.stringify({ preferred_time: selectedTime })
      });

      if (!response.ok) {
        throw new Error('Failed to update appointment time');
      }

      onUpdate(selectedTime);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const TimeSlot = ({ time, available, selected, onClick }) => (
    <button
      onClick={onClick}
      disabled={!available}
      className={`
        group flex items-center justify-center px-4 py-3 rounded-lg transition-all
        ${selected 
          ? 'border-2 border-red-500 bg-red-50 text-red-700 ring-2 ring-offset-2 ring-red-500' 
          : available
            ? 'border border-gray-200 hover:border-red-300 hover:bg-red-50'
            : 'border border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed'
        }
      `}
    >
      <Clock className={`h-4 w-4 mr-2 transition-colors ${
        selected 
          ? 'text-red-600'
          : available 
            ? 'text-gray-400 group-hover:text-red-500' 
            : 'text-gray-300'
      }`} />
      <span className="font-medium">{time}</span>
      {!available && (
        <span className="ml-2 text-xs px-2 py-0.5 bg-gray-100 rounded-full">
          Full
        </span>
      )}
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ zIndex: 10001 }}>
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm" 
        onClick={onClose}
      />
      
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg animate-scale-fade-in overflow-hidden">
        {/* Header */}
        <div className="bg-red-50 p-6 pb-8">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-lg hover:bg-red-100 text-red-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Change Appointment Time
          </h3>
          
          <div className="text-sm text-gray-600 space-y-2">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              {new Date(appointment.session_date).toLocaleDateString()}
            </div>
            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-2" />
              {appointment.campaign_name}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {fetchingSlots ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 text-red-600 animate-spin mb-4" />
              <p className="text-sm text-gray-600">Loading available time slots...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {error && (
                <div className="flex items-start p-4 rounded-lg bg-red-50 text-red-700">
                  <AlertCircle className="h-5 w-5 mr-3 flex-shrink-0 mt-0.5" />
                  <p className="text-sm">{error}</p>
                </div>
              )}

              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-900">Available Time Slots</h4>
                <div className="grid grid-cols-2 gap-3">
                  {timeSlots.map(({ time, available }) => (
                    <TimeSlot
                      key={time}
                      time={time}
                      available={available}
                      selected={selectedTime === time}
                      onClick={() => available && setSelectedTime(time)}
                    />
                  ))}
                </div>
              </div>

              {/* Current time note */}
              <div className="flex items-start text-sm text-gray-600 bg-gray-50 p-4 rounded-lg">
                <Info className="h-5 w-5 mr-3 flex-shrink-0" />
                <p>
                  Current appointment time: <span className="font-medium">{appointment.preferred_time}</span>
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 
                    hover:bg-gray-50 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdate}
                  disabled={loading || selectedTime === appointment.preferred_time}
                  className={`flex items-center px-4 py-2 text-sm font-medium text-white 
                    rounded-lg transition-colors ${
                      loading || selectedTime === appointment.preferred_time
                        ? 'bg-gray-300 cursor-not-allowed'
                        : 'bg-red-600 hover:bg-red-700'
                    }`}
                >
                  {loading && <Loader2 className="animate-spin h-4 w-4 mr-2" />}
                  {loading ? 'Updating...' : 'Update Time'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AppointmentTimeEdit;