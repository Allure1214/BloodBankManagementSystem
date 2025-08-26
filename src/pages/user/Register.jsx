import React, { useMemo, useState } from 'react';
import { 
  Mail, User, Phone, Lock, Eye, EyeOff, HelpCircle,
  UserCircle, Droplet, Calendar, MapPin, ChevronDown 
} from 'lucide-react';
import PasswordStrengthIndicator from '../../components/modules/blood-donation/PasswordStrengthIndicator';

const validatePassword = (password) => {
  const requirements = [
    { re: /.{8,20}/, label: 'Password must be between 8-20 characters' },
    { re: /[0-9]/, label: 'Password must contain at least one number' },
    { re: /[a-z]/, label: 'Password must contain at least one lowercase letter' },
    { re: /[A-Z]/, label: 'Password must contain at least one uppercase letter' },
  ];

  return requirements
    .filter(req => !req.re.test(password))
    .map(req => req.label);
};

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    bloodType: '',
    dateOfBirth: '',
    gender: '',
    area: '',
    unknownBloodType: false
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showBloodTypeInfo, setShowBloodTypeInfo] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({});

  const JOHOR_AREAS = [
    "Johor Bahru", "Muar", "Batu Pahat", "Kluang", "Pontian",
    "Segamat", "Kota Tinggi", "Mersing", "Kulai", "Tangkak"
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: checked,
        bloodType: checked ? 'UNKNOWN' : ''
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    if (error) setError('');
    setTouched(prev => ({ ...prev, [name]: true }));
  };

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
  const phoneRegex = /^[0-9]{9,15}$/;

  const isAdult = (isoDate) => {
    if (!isoDate) return false;
    const dob = new Date(isoDate);
    if (Number.isNaN(dob.getTime())) return false;
    const today = new Date();
    const age = today.getFullYear() - dob.getFullYear() - ((today.getMonth() < dob.getMonth() || (today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate())) ? 1 : 0);
    return age >= 18;
  };

  const currentFieldErrors = useMemo(() => {
    const errs = {};
    if (!formData.name || formData.name.trim().length < 2) errs.name = 'Enter your full name';
    if (!emailRegex.test(formData.email)) errs.email = 'Enter a valid email';
    if (!phoneRegex.test(formData.phone)) errs.phone = 'Enter a valid phone (9-15 digits)';
    if (!isAdult(formData.dateOfBirth)) errs.dateOfBirth = 'You must be at least 18 years old';
    if (!formData.gender) errs.gender = 'Select a gender';
    if (!formData.area) errs.area = 'Select an area';
    if (!formData.unknownBloodType && !formData.bloodType) errs.bloodType = 'Select a blood type or mark unknown';
    const passwordIssues = validatePassword(formData.password);
    if (passwordIssues.length > 0) errs.password = 'Password must be 8-20 chars with numbers and letters';
    if (!formData.confirmPassword) errs.confirmPassword = 'Confirm your password';
    if (formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword) errs.confirmPassword = "Passwords don't match";
    return errs;
  }, [formData]);

  const isFormValid = useMemo(() => Object.keys(currentFieldErrors).length === 0, [currentFieldErrors]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({
      name: true,
      email: true,
      phone: true,
      dateOfBirth: true,
      gender: true,
      area: true,
      bloodType: true,
      password: true,
      confirmPassword: true,
      unknownBloodType: true
    });

    if (!isFormValid) {
      setError('Please fix the highlighted fields');
      return;
    }

    try {
      setError('');
      setLoading(true);
      const baseUrl = import.meta?.env?.VITE_API_BASE_URL || 'http://localhost:5000';
      const response = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Registration failed');
      }

      window.location.href = '/login';
    } catch (err) {
      setError('Failed to create an account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-red-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Create Account</h2>
          <p className="mt-2 text-gray-600">Join our blood donation community</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          {/* Personal Information */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Name Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name <span className="text-red-600">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
                {touched.name && currentFieldErrors.name && (
                  <p className="mt-1 text-sm text-red-600">{currentFieldErrors.name}</p>
                )}
              </div>

              {/* Email Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address <span className="text-red-600">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
                {touched.email && currentFieldErrors.email && (
                  <p className="mt-1 text-sm text-red-600">{currentFieldErrors.email}</p>
                )}
              </div>

              {/* Phone Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number <span className="text-red-600">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    autoComplete="tel"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
                {touched.phone && currentFieldErrors.phone && (
                  <p className="mt-1 text-sm text-red-600">{currentFieldErrors.phone}</p>
                )}
              </div>

              {/* Date of Birth Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date of Birth <span className="text-red-600">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    required
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
                {touched.dateOfBirth && currentFieldErrors.dateOfBirth && (
                  <p className="mt-1 text-sm text-red-600">{currentFieldErrors.dateOfBirth}</p>
                )}
              </div>

              {/* Gender Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gender <span className="text-red-600">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserCircle className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    required
                    className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 appearance-none bg-white"
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
                {touched.gender && currentFieldErrors.gender && (
                  <p className="mt-1 text-sm text-red-600">{currentFieldErrors.gender}</p>
                )}
              </div>

              {/* Area Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Area <span className="text-red-600">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    name="area"
                    value={formData.area}
                    onChange={handleChange}
                    required
                    className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 appearance-none bg-white"
                  >
                    <option value="">Select Area</option>
                    {JOHOR_AREAS.map(area => (
                      <option key={area} value={area}>{area}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
                {touched.area && currentFieldErrors.area && (
                  <p className="mt-1 text-sm text-red-600">{currentFieldErrors.area}</p>
                )}
              </div>
            </div>
          </div>

          {/* Blood Information */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Blood Information</h3>
              <button
                type="button"
                onClick={() => setShowBloodTypeInfo(!showBloodTypeInfo)}
                className="text-red-600 hover:text-red-700 text-sm flex items-center"
              >
                <HelpCircle className="h-4 w-4 mr-1" />
                Need help?
              </button>
            </div>

            {!formData.unknownBloodType && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Blood Type <span className="text-red-600">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Droplet className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    name="bloodType"
                    value={formData.bloodType}
                    onChange={handleChange}
                    required={!formData.unknownBloodType}
                    className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 appearance-none bg-white"
                  >
                    <option value="">Select Blood Type</option>
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
                {!formData.unknownBloodType && touched.bloodType && currentFieldErrors.bloodType && (
                  <p className="mt-1 text-sm text-red-600">{currentFieldErrors.bloodType}</p>
                )}
              </div>
            )}

            <label className="flex items-center mt-4">
              <input
                type="checkbox"
                name="unknownBloodType"
                checked={formData.unknownBloodType}
                onChange={handleChange}
                className="h-4 w-4 text-red-600 rounded"
              />
              <span className="ml-2 text-sm text-gray-600">
                I don't know my blood type
              </span>
            </label>

            {showBloodTypeInfo && (
              <div className="mt-4 p-4 bg-blue-50 rounded-md text-sm">
                <p className="font-medium mb-2">How to find your blood type:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Check your previous blood donation card</li>
                  <li>Contact your healthcare provider</li>
                  <li>Review recent lab test results</li>
                  <li>Get tested at your next doctor's visit</li>
                </ul>
              </div>
            )}
          </div>

          {/* Password Section */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Security</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password <span className="text-red-600">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
                {formData.password && (
                  <PasswordStrengthIndicator password={formData.password} />
                )}
                {touched.password && currentFieldErrors.password && (
                  <p className="mt-1 text-sm text-red-600">{currentFieldErrors.password}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password <span className="text-red-600">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    required
                  />
                </div>
                {touched.confirmPassword && currentFieldErrors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{currentFieldErrors.confirmPassword}</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center space-y-4">
            <button
              type="submit"
              disabled={loading || !isFormValid}
              className="w-full py-3 px-4 border border-transparent rounded-lg shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 font-medium"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Creating Account...
                </div>
              ) : (
                'Create Account'
              )}
            </button>

            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <a href="/login" className="font-medium text-red-600 hover:text-red-500">
                Login
              </a>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;