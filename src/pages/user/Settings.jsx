// src/pages/Settings.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  MapPin, Phone, User, Lock, Save, AlertCircle, 
  Calendar, Info, Droplet, Bell, Settings as SettingsIcon,
  Check, X, ChevronRight, Shield, Eye, EyeOff, Heart
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import apiClient from '../../api/client';

// Enhanced Input Group Component
const InputGroup = ({ label, icon: Icon, type = "text", name, value, onChange, className = "", required = false, error = "", ...props }) => (
  <div className="space-y-2">
    <label className="flex items-center text-sm font-semibold text-gray-700">
      <Icon className="h-4 w-4 mr-2 text-gray-500" />
      {label}
      {required && <span className="ml-1 text-red-500">*</span>}
    </label>
    <div className="relative">
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        className={`block w-full px-4 py-3 text-base border rounded-lg transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 
          hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed
          ${error 
            ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500' 
            : 'border-gray-300 bg-white focus:border-red-500 focus:ring-red-500'
          } ${className}`}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600 flex items-center">
          <AlertCircle className="h-4 w-4 mr-1" />
          {error}
        </p>
      )}
    </div>
  </div>
);

// Enhanced Select Group Component
const SelectGroup = ({ label, icon: Icon, name, value, onChange, options, className = "", required = false, error = "" }) => (
  <div className="space-y-2">
    <label className="flex items-center text-sm font-semibold text-gray-700">
      <Icon className="h-4 w-4 mr-2 text-gray-500" />
      {label}
      {required && <span className="ml-1 text-red-500">*</span>}
    </label>
    <div className="relative">
      <select
        name={name}
        value={value}
        onChange={onChange}
        className={`block w-full px-4 py-3 text-base border rounded-lg transition-all duration-200 
          appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 
          hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed
          ${error 
            ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500' 
            : 'border-gray-300 focus:border-red-500 focus:ring-red-500'
          } ${className}`}
      >
        {options}
      </select>
      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
        <ChevronRight className="h-5 w-5 text-gray-400 transform rotate-90" />
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600 flex items-center">
          <AlertCircle className="h-4 w-4 mr-1" />
          {error}
        </p>
      )}
    </div>
  </div>
);

// Enhanced Message Alert Component
const MessageAlert = ({ message, type = 'error', onClose }) => {
  if (!message) return null;

  const styles = {
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-800',
      icon: <Check className="h-5 w-5 text-green-600" />
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800',
      icon: <AlertCircle className="h-5 w-5 text-red-600" />
    }
  };

  const style = styles[type];

  return (
    <div className={`flex items-center justify-between p-4 rounded-lg border ${style.bg} ${style.border} animate-fade-in`}>
      <div className="flex items-center">
        <div className="flex-shrink-0">
          {style.icon}
        </div>
        <div className={`ml-3 ${style.text}`}>
          <p className="text-sm font-medium">{message}</p>
        </div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      )}
    </div>
  );
};

// Enhanced Tab Button Component
const TabButton = ({ active, icon: Icon, label, onClick, count }) => (
  <button
    onClick={onClick}
    className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition-all duration-200 font-medium
      ${active 
        ? 'bg-red-50 text-red-600 border-2 border-red-200 shadow-sm scale-105' 
        : 'text-gray-600 hover:bg-gray-50 hover:scale-105 border-2 border-transparent'}`}
  >
    <Icon className="h-5 w-5" />
    <span>{label}</span>
    {count !== undefined && (
      <span className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold
        ${active ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'}`}>
        {count}
      </span>
    )}
  </button>
);

// Enhanced Settings Card Component
const SettingsCard = ({ title, description, children, message, messageType, onMessageClose, icon: Icon }) => (
  <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200 hover:shadow-md transition-shadow duration-200">
    <div className="px-6 py-5 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
      <div className="flex items-center space-x-3">
        {Icon && (
          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
            <Icon className="h-5 w-5 text-red-600" />
          </div>
        )}
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          {description && (
            <p className="mt-1 text-sm text-gray-600">{description}</p>
          )}
        </div>
      </div>
    </div>
    
    {message && (
      <div className="px-6 pt-4">
        <MessageAlert 
          message={message} 
          type={messageType} 
          onClose={onMessageClose}
        />
      </div>
    )}

    <div className="p-6">{children}</div>
  </div>
);

// Enhanced Notification Preference Card Component
const NotificationPreferenceCard = ({ title, description, checked, onChange, icon: Icon }) => (
  <div className={`relative flex items-start p-5 rounded-xl border-2 transition-all duration-200 cursor-pointer
    ${checked 
      ? 'border-red-500 bg-red-50 shadow-md' 
      : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'}`}
    onClick={onChange}
  >
    <div className="min-w-0 flex-1">
      <div className="flex items-center space-x-3">
        {Icon && (
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center
            ${checked ? 'bg-red-100' : 'bg-gray-100'}`}>
            <Icon className={`h-4 w-4 ${checked ? 'text-red-600' : 'text-gray-500'}`} />
          </div>
        )}
        <div>
          <div className="text-base font-semibold text-gray-900">{title}</div>
          <p className="mt-1 text-sm text-gray-600">{description}</p>
        </div>
      </div>
    </div>
    <div className="ml-4 flex items-center">
      <input
        type="radio"
        checked={checked}
        onChange={onChange}
        className="h-5 w-5 text-red-600 border-gray-300 focus:ring-red-500 focus:ring-2"
      />
    </div>
  </div>
);

// Password Strength Indicator Component
const PasswordStrengthIndicator = ({ password }) => {
  const getStrength = (password) => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    
    if (score < 2) return { level: 'weak', color: 'red', width: '25%' };
    if (score < 4) return { level: 'fair', color: 'yellow', width: '50%' };
    if (score < 5) return { level: 'good', color: 'blue', width: '75%' };
    return { level: 'strong', color: 'green', width: '100%' };
  };

  if (!password) return null;

  const strength = getStrength(password);
  const colorClasses = {
    red: 'bg-red-500',
    yellow: 'bg-yellow-500',
    blue: 'bg-blue-500',
    green: 'bg-green-500'
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">Password strength:</span>
        <span className={`font-medium capitalize ${
          strength.color === 'red' ? 'text-red-600' :
          strength.color === 'yellow' ? 'text-yellow-600' :
          strength.color === 'blue' ? 'text-blue-600' :
          'text-green-600'
        }`}>
          {strength.level}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className={`h-2 rounded-full transition-all duration-300 ${colorClasses[strength.color]}`}
          style={{ width: strength.width }}
        />
      </div>
    </div>
  );
};

const Settings = () => {
  const { user, updateUserProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('profile');
  const [showPassword, setShowPassword] = useState({ current: false, new: false, confirm: false });
  const [notificationPreferences, setNotificationPreferences] = useState({
    receiveAll: true,
    receiveAreaOnly: false,
    receiveNone: false
  });
  const [profileMessage, setProfileMessage] = useState({ text: '', type: '' });
  const [passwordMessage, setPasswordMessage] = useState({ text: '', type: '' });
  const [formErrors, setFormErrors] = useState({});
  
  const JOHOR_AREAS = [
    "Johor Bahru", "Muar", "Batu Pahat", "Kluang", "Pontian", 
    "Segamat", "Kota Tinggi", "Mersing", "Kulai", "Tangkak"
  ];

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    bloodType: '',
    dateOfBirth: '',
    gender: '',
    area: ''
  });

  const formatDateForSubmission = (date) => {
    if (!date) return null;
    
    if (date.includes('T')) {
      return date.split('T')[0];
    }
    
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return null;
      return d.toISOString().split('T')[0];
    } catch (error) {
      console.error('Date formatting error:', error);
      return null;
    }
  };

  useEffect(() => {
    const fetchLatestUserData = async () => {
      try {
        const response = await apiClient.get('/user/profile');
        
        if (response.data.success) {
          setFormData(prev => ({
            ...prev,
            name: response.data.data.name || '',
            phone: response.data.data.phone || '',
            bloodType: response.data.data.blood_type || '',
            dateOfBirth: response.data.data.date_of_birth ? response.data.data.date_of_birth.split('T')[0] : '',
            gender: response.data.data.gender || '',
            area: response.data.data.area || ''
          }));
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        if (error.response?.status === 401) {
          setError('Session expired. Please login again.');
        } else {
          setError('Failed to load user data');
        }
      }
    };

    fetchLatestUserData();
  }, [user]);

  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) errors.name = 'Name is required';
    if (!formData.phone.trim()) errors.phone = 'Phone number is required';
    if (!formData.bloodType) errors.bloodType = 'Blood type is required';
    if (!formData.gender) errors.gender = 'Gender is required';
    if (!formData.dateOfBirth) errors.dateOfBirth = 'Date of birth is required';
    if (!formData.area) errors.area = 'Area is required';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear specific field error
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    // Clear messages when user starts typing
    setError('');
    setSuccess('');
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setProfileMessage({ text: '', type: '' });

    try {
      const token = sessionStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await apiClient.put('/user/profile', {
        name: formData.name,
        phone: formData.phone,
        bloodType: formData.bloodType,
        dateOfBirth: formatDateForSubmission(formData.dateOfBirth),
        gender: formData.gender,
        area: formData.area 
      });

      if (response.data.success) {
        updateUserProfile({
          name: formData.name,
          phone: formData.phone,
          bloodType: formData.bloodType,
          dateOfBirth: formData.dateOfBirth,
          gender: formData.gender
        });
        setProfileMessage({ text: 'Profile updated successfully!', type: 'success' });
      } else {
        setProfileMessage({ 
          text: response.data.message || 'Failed to update profile', 
          type: 'error' 
        });
      }
    } catch (error) {
      console.error('Profile update error:', error);
      if (error.response?.status === 401) {
        setProfileMessage({ 
          text: 'Session expired. Please login again.', 
          type: 'error' 
        });
      } else {
        setProfileMessage({ 
          text: 'An error occurred while updating profile', 
          type: 'error' 
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setLoading(true);
    setPasswordMessage({ text: '', type: '' });

    // Client-side validation
    if (formData.newPassword !== formData.confirmPassword) {
      setPasswordMessage({ text: 'Passwords do not match', type: 'error' });
      setLoading(false);
      return;
    }

    // Password strength validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,20}$/;
    if (!passwordRegex.test(formData.newPassword)) {
      setPasswordMessage({ 
        text: 'Password must be 8-20 characters and include lowercase, uppercase, and numbers', 
        type: 'error' 
      });
      setLoading(false);
      return;
    }

    try {
      const token = sessionStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await apiClient.put('/user/change-password', {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      });

      if (response.data.success) {
        setPasswordMessage({ text: 'Password updated successfully!', type: 'success' });
        // Clear password fields
        setFormData(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }));
      } else {
        setPasswordMessage({ 
          text: response.data.message || 'Failed to update password', 
          type: 'error' 
        });
      }
    } catch (error) {
      console.error('Password update error:', error);
      if (error.response?.status === 401) {
        setPasswordMessage({ 
          text: 'Session expired. Please login again.', 
          type: 'error' 
        });
      } else if (error.response?.status === 400) {
        setPasswordMessage({ 
          text: error.response.data.message || 'Current password is incorrect', 
          type: 'error' 
        });
      } else {
        setPasswordMessage({ 
          text: 'An error occurred while updating password', 
          type: 'error' 
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePreferenceChange = async (preference) => {
    try {
      const response = await apiClient.put('/user/notification-preferences', {
        preference
      });

      if (response.data.success) {
        setNotificationPreferences(prev => {
          const newPrefs = {
            receiveAll: false,
            receiveAreaOnly: false,
            receiveNone: false
          };
          newPrefs[preference] = true;
          return newPrefs;
        });
        setProfileMessage({
          text: 'Notification preferences updated successfully!',
          type: 'success'
        });
      }
    } catch (error) {
      setProfileMessage({
        text: 'Failed to update notification preferences',
        type: 'error'
      });
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPassword(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Enhanced Header Section */}
        <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Account Settings</h1>
              <p className="text-gray-600">
                Manage your account settings, preferences, and security
              </p>
            </div>
            <div className="flex space-x-3">
              <TabButton
                active={activeTab === 'profile'}
                icon={SettingsIcon}
                label="Profile"
                onClick={() => setActiveTab('profile')}
              />
              <TabButton
                active={activeTab === 'notifications'}
                icon={Bell}
                label="Notifications"
                onClick={() => setActiveTab('notifications')}
              />
            </div>
          </div>
        </div>

        {activeTab === 'profile' ? (
          <>
            {/* Enhanced Profile Settings Card */}
            <SettingsCard
              title="Personal Information"
              description="Update your personal details and contact information"
              message={profileMessage.text}
              messageType={profileMessage.type}
              onMessageClose={() => setProfileMessage({ text: '', type: '' })}
              icon={User}
            >
              <form onSubmit={handleProfileUpdate} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InputGroup
                    label="Full Name"
                    icon={User}
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    required
                    error={formErrors.name}
                  />

                  <InputGroup
                    label="Phone Number"
                    icon={Phone}
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Enter your phone number"
                    required
                    error={formErrors.phone}
                  />

                  <SelectGroup
                    label="Blood Type"
                    icon={Droplet}
                    name="bloodType"
                    value={formData.bloodType}
                    onChange={handleChange}
                    required
                    error={formErrors.bloodType}
                    options={
                      <>
                        <option value="">Select Blood Type</option>
                        {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </>
                    }
                  />

                  <SelectGroup
                    label="Gender"
                    icon={Info}
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    required
                    error={formErrors.gender}
                    options={
                      <>
                        <option value="">Select Gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </>
                    }
                  />

                  <InputGroup
                    label="Date of Birth"
                    icon={Calendar}
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    required
                    error={formErrors.dateOfBirth}
                    max={new Date().toISOString().split('T')[0]}
                  />

                  <SelectGroup
                    label="Area"
                    icon={MapPin}
                    name="area"
                    value={formData.area}
                    onChange={handleChange}
                    required
                    error={formErrors.area}
                    options={
                      <>
                        <option value="">Select Area</option>
                        {JOHOR_AREAS.map(area => (
                          <option key={area} value={area}>{area}</option>
                        ))}
                      </>
                    }
                  />
                </div>

                <div className="flex justify-end pt-6 border-t border-gray-200">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center px-8 py-3 bg-red-600 text-white rounded-lg
                      hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 
                      focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed
                      transition-all duration-200 shadow-md font-medium text-base"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3" />
                        Saving Changes...
                      </>
                    ) : (
                      <>
                        <Save className="h-5 w-5 mr-2" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </form>
            </SettingsCard>

            {/* Enhanced Password Change Card */}
            <SettingsCard
              title="Security Settings"
              description="Update your password to keep your account secure"
              message={passwordMessage.text}
              messageType={passwordMessage.type}
              onMessageClose={() => setPasswordMessage({ text: '', type: '' })}
              icon={Shield}
            >
              <form onSubmit={handlePasswordChange} className="space-y-6">
                <InputGroup
                  label="Current Password"
                  icon={Lock}
                  type={showPassword.current ? "text" : "password"}
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleChange}
                  placeholder="Enter your current password"
                  required
                  className="pr-12"
                />

                <InputGroup
                  label="New Password"
                  icon={Lock}
                  type={showPassword.new ? "text" : "password"}
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  placeholder="8-20 characters, include numbers, uppercase and lowercase"
                  required
                  className="pr-12"
                />

                {formData.newPassword && (
                  <PasswordStrengthIndicator password={formData.newPassword} />
                )}

                <InputGroup
                  label="Confirm New Password"
                  icon={Lock}
                  type={showPassword.confirm ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Repeat your new password"
                  required
                  className="pr-12"
                />

                <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                  <Link 
                    to="/reset-password"
                    className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center"
                  >
                    <Lock className="h-4 w-4 mr-1" />
                    Forgot your password?
                  </Link>
                  
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center px-8 py-3 bg-red-600 text-white rounded-lg
                      hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 
                      focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed
                      transition-all duration-200 shadow-md font-medium text-base"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3" />
                        Updating Password...
                      </>
                    ) : (
                      <>
                        <Shield className="h-5 w-5 mr-2" />
                        Update Password
                      </>
                    )}
                  </button>
                </div>
              </form>
            </SettingsCard>
          </>
        ) : (
          <SettingsCard
            title="Notification Preferences"
            description="Choose how you want to receive updates and alerts"
            message={profileMessage.text}
            messageType={profileMessage.type}
            onMessageClose={() => setProfileMessage({ text: '', type: '' })}
            icon={Bell}
          >
            <div className="space-y-4">
              <NotificationPreferenceCard
                title="All Notifications"
                description="Receive updates about donations, campaigns, and blood availability from all areas"
                checked={notificationPreferences.receiveAll}
                onChange={() => handlePreferenceChange('receiveAll')}
                icon={Bell}
              />
  
              <NotificationPreferenceCard
                title="Area-Specific Notifications"
                description={`Only receive notifications about events and campaigns in ${formData.area || 'your area'}`}
                checked={notificationPreferences.receiveAreaOnly}
                onChange={() => handlePreferenceChange('receiveAreaOnly')}
                icon={MapPin}
              />
  
              <NotificationPreferenceCard
                title="Disable All Notifications"
                description="Turn off all notifications from LifeLink Blood Bank"
                checked={notificationPreferences.receiveNone}
                onChange={() => handlePreferenceChange('receiveNone')}
                icon={X}
              />
            </div>
          </SettingsCard>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Settings;