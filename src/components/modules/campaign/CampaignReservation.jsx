import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { X, Calendar, AlertTriangle, Info } from 'lucide-react';

const ActiveReservationModal = ({ reservation, onClose }) => {
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex items-center mb-4">
          <Info className="h-6 w-6 text-blue-500 mr-2" />
          <h3 className="text-lg font-semibold">Active Reservation</h3>
        </div>
        <p className="text-gray-600 mb-4">
          You already have an active reservation for:
        </p>
        <div className="bg-gray-50 p-4 rounded-lg mb-6 space-y-2">
          <p><strong>Date:</strong> {new Date(reservation.session_date).toLocaleDateString()}</p>
          <p><strong>Time:</strong> {reservation.preferred_time}</p>
          <p><strong>Location:</strong> {reservation.campaign_name}</p>
          <p><strong>Address:</strong> {reservation.campaign_address}</p>
        </div>
        <p className="text-gray-600 mb-6">
          Please cancel your existing reservation before making a new one.
        </p>
        <button
          onClick={onClose}
          className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Understood
        </button>
      </div>
    </div>
  );
};

const EligibilityModal = ({ lastDonationDate, nextEligibleDate, onClose }) => {
  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const lastDonationFormatted = formatDate(lastDonationDate);
  const nextEligibleFormatted = formatDate(nextEligibleDate);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex items-center mb-4">
          <AlertTriangle className="h-6 w-6 text-yellow-500 mr-2" />
          <h3 className="text-lg font-semibold">Not Eligible for Donation</h3>
        </div>
        <div className="space-y-4">
          {lastDonationFormatted && (
            <p className="text-gray-600">
              Your last completed donation was on <span className="font-medium">{lastDonationFormatted}</span>.
              For your health and safety, you need to wait at least 3 months between donations.
            </p>
          )}
          {nextEligibleFormatted && (
            <p className="font-medium text-gray-800">
              You will be eligible to donate again on {nextEligibleFormatted}.
            </p>
          )}
          {!lastDonationFormatted && !nextEligibleFormatted && (
            <p className="text-gray-600">
              You have an active reservation. Please complete or cancel it before making a new reservation.
            </p>
          )}
        </div>
        <button
          onClick={onClose}
          className="w-full mt-6 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Understood
        </button>
      </div>
    </div>
  );
};

const CampaignReservationModal = ({ campaign, isOpen, onClose, onSubmit }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [existingReservation, setExistingReservation] = useState(null);
  const [successAnimation, setSuccessAnimation] = useState(false);
  const [showEligibilityModal, setShowEligibilityModal] = useState(false);
  const [showActiveReservationModal, setShowActiveReservationModal] = useState(false);
  const [activeReservation, setActiveReservation] = useState(null);
  const [eligibilityData, setEligibilityData] = useState(null);
  const [lastDonation, setLastDonation] = useState(null);
  const [nextEligibleDate, setNextEligibleDate] = useState(null);
  const [formData, setFormData] = useState({
    user_id: user?.id || '',  
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    blood_type: user?.bloodType || 'UNKNOWN',
    preferred_time: '',
    session_date: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user || !isOpen) return;
  
    const checkUserStatus = async () => {
      try {
        const response = await fetch(
          `http://localhost:5000/api/campaigns/check-eligibility/${user.id}`,
          {
            headers: {
              'Authorization': `Bearer ${sessionStorage.getItem('token')}`
            }
          }
        );
  
        const data = await response.json();
        console.log('Eligibility data:', data); // Debug log
        
        if (data.success) {
          if (!data.eligible) {
            if (data.activeReservation) {
              setActiveReservation(data.activeReservation);
              setShowActiveReservationModal(true);
            } else if (data.lastDonationDate && data.nextEligibleDate) {
              setEligibilityData({
                lastDonationDate: data.lastDonationDate,
                nextEligibleDate: data.nextEligibleDate
              });
              setLastDonation(data.lastDonationDate);
              setNextEligibleDate(new Date(data.nextEligibleDate));
              setShowEligibilityModal(true);
            }
          }
        }
      } catch (error) {
        console.error('Error checking eligibility:', error);
        setError('Failed to check eligibility status');
      }
    };
  
    checkUserStatus();
  }, [user, isOpen]);

  const handleReservation = () => {
    if (!user) {
      // Store campaign info in session storage for redirect after login
      sessionStorage.setItem('reservationRedirect', JSON.stringify({
        campaignId: campaign.id,
        location: campaign.location
      }));
      navigate('/login');
      return;
    }
  };

  // Function to parse time string (e.g., "07:30" to minutes)
  const timeToMinutes = (timeString) => {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // Function to format minutes to time string (e.g., 450 to "07:30")
  const minutesToTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  // Generate time slots between start and end time
  const generateTimeSlots = (startTime, endTime) => {
    const slots = [];
    const intervalMinutes = 60; // 1-hour intervals

    // Convert start and end times to minutes
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);

    // Generate slots starting from the exact start time
    for (let time = startMinutes; time < endMinutes; time += intervalMinutes) {
      slots.push(minutesToTime(time));
    }

    return slots;
  };

  const getTimeSlots = () => {
    // Find the selected session
    const selectedSession = campaign.sessions.find(
      session => session.date === formData.session_date
    );

    if (!selectedSession) return [];

    const [startTime, endTime] = selectedSession.time.split(' - ');
    return generateTimeSlots(startTime, endTime);
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  if (!user) {
    sessionStorage.setItem('reservationRedirect', JSON.stringify({
      campaignId: campaign.id,
      location: campaign.location
    }));
    navigate('/login');
    return;
  }

  setLoading(true);
  setError('');

  try {
    const response = await fetch('http://localhost:5000/api/campaigns/reserve', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionStorage.getItem('token')}`
      },
      body: JSON.stringify({
        campaign_id: campaign.id,
        ...formData,
        user_id: user.id
      }),
    });

    const data = await response.json();

    if (data.success) {
      // Show success animation
      setSuccessAnimation(true);
      
      // Wait for animation to complete before closing
      setTimeout(() => {
        setSuccessAnimation(false);
        onClose();
      }, 1500); // Adjust timing as needed
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    setError(error.message || 'Failed to create reservation');
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
  const checkExistingReservation = async () => {
    if (user) {
      try {
        const response = await fetch(
          `http://localhost:5000/api/campaigns/check-reservation/${user.id}`,
          {
            headers: {
              'Authorization': `Bearer ${sessionStorage.getItem('token')}`
            }
          }
        );
        const data = await response.json();
        
        if (data.success && data.hasReservation) {
          const reservationWithCampaign = {
            ...data.reservation,
            // Get campaign info from the join
            campaign_name: data.reservation.campaign_name || data.reservation.location,
            campaign_address: data.reservation.campaign_address || data.reservation.address
          };
          setExistingReservation(reservationWithCampaign);
          setActiveReservation(reservationWithCampaign);
          setShowActiveReservationModal(true);
        }
      } catch (error) {
        console.error('Error checking existing reservation:', error);
      }
    }
  };

  if (isOpen) {
    checkExistingReservation();
  }
}, [isOpen, user]);

  const handleDateSelection = (date) => {
    if (!date) return;
  
    // Convert selected date string to Date object correctly
    const [year, month, day] = date.split('-');
    const selectedDate = new Date(year, month - 1, day); // month is 0-based in JS
    
    if (nextEligibleDate && selectedDate < nextEligibleDate) {
      setShowEligibilityModal(true);
      return;
    }
  
    setFormData({ ...formData, session_date: date });
  };

  // Pre-fill form when user data changes
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        user_id: user.id || '',
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        blood_type: user.bloodType || 'UNKNOWN'
      }));
    }
  }, [user]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      {showActiveReservationModal && activeReservation && (
        <ActiveReservationModal 
          reservation={activeReservation}
          onClose={() => {
            setShowActiveReservationModal(false);
            onClose();
          }}
        />
      )}
      {showEligibilityModal && eligibilityData && (
        <EligibilityModal
          lastDonationDate={eligibilityData.lastDonationDate}
          nextEligibleDate={eligibilityData.nextEligibleDate}
          onClose={() => {setShowEligibilityModal(false);
          onClose();
          }}
        />
      )}
      {!showEligibilityModal && (
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto relative">
        {successAnimation ? (
          <div className="p-6 text-center">
            <div className="mb-4">
              <div className="mx-auto h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                <svg 
                  className="h-8 w-8 text-green-500" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M5 13l4 4L19 7" 
                  />
                </svg>
              </div>
              
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                Reservation Successful!
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                Your blood donation appointment has been scheduled.
              </p>
            </div>
          </div>
        ) : (
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Make Reservation</h2>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                <X className="h-6 w-6" />
              </button>
            </div>
  
            {!user ? (
              <div className="text-center py-6">
                <p className="mb-4">Please login to make a reservation</p>
                <button
                  onClick={handleReservation}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Login to Continue
                </button>
              </div>
            ) : existingReservation ? (
              <div className="text-center py-6">
                <div className="mb-4 p-4 bg-yellow-50 rounded-lg">
                  <p className="text-yellow-800 font-medium mb-2">
                    You already have an existing reservation:
                  </p>
                  <div className="text-gray-700 space-y-2">
                    <p>Date: {new Date(existingReservation.session_date).toLocaleDateString()}</p>
                    <p>Time: {existingReservation.preferred_time}</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  {/* Autofilled read-only fields */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      readOnly
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                    />
                  </div>
  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      readOnly
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                    />
                  </div>
  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    <input
                      type="text"
                      value={formData.phone}
                      readOnly
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                    />
                  </div>
  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Blood Type</label>
                    <div>
                      <input
                        type="text"
                        value={formData.blood_type}
                        readOnly
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                      />
                      {formData.blood_type === 'UNKNOWN' && (
                        <p className="mt-1 text-sm text-gray-600">
                          Your blood type will be determined during your donation visit.
                        </p>
                      )}
                    </div>
                  </div>
                    
                  {/* User-selectable fields */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Date</label>
                    <select
                      value={formData.session_date}
                      onChange={(e) => handleDateSelection(e.target.value)}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
                      required
                    >
                      <option value="">Select Date</option>
                      {campaign.sessions.map((session, index) => {
                        const isIneligible = nextEligibleDate && new Date(session.date) < nextEligibleDate;
                        return (
                          <option 
                            key={index} 
                            value={session.date}
                            disabled={isIneligible}
                            className={isIneligible ? 'text-gray-400' : ''}
                          >
                            {session.date}
                            {isIneligible ? ' (Not Eligible)' : ''}
                          </option>
                        );
                      })}
                    </select>
                  </div>
  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Preferred Time</label>
                    <div className="mt-2 grid grid-cols-3 gap-2">
                      {getTimeSlots().map((timeSlot) => (
                        <button
                          key={timeSlot}
                          type="button"
                          onClick={() => setFormData({...formData, preferred_time: timeSlot})}
                          className={`p-2 text-sm rounded-md border ${
                            formData.preferred_time === timeSlot
                              ? 'bg-red-600 text-white border-red-600'
                              : 'border-gray-300 hover:border-red-500'
                          }`}
                        >
                          {timeSlot}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
  
                {error && (
                  <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md">
                    {error}
                  </div>
                )}
  
                <button
                  type="submit"
                  disabled={loading}
                  className="mt-6 w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {loading ? 'Processing...' : 'Confirm Reservation'}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
      )}
    </div>
  );
};

export default CampaignReservationModal;