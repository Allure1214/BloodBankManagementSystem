import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Mail, Lock, Eye, EyeOff, AlertCircle,
  LogIn, Key, Heart, Shield, Users
} from 'lucide-react';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  
  const UnknownBloodTypeModal = ({ onClose, onGoToSettings }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 animate-fade-in shadow-2xl border border-gray-100">
        <div className="text-center">
          <div className="mx-auto h-14 w-14 rounded-full bg-yellow-100 flex items-center justify-center mb-4">
            <AlertCircle className="h-7 w-7 text-yellow-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Blood Type Not Set
          </h3>
          <p className="text-gray-600 mb-6 leading-relaxed text-sm">
            Please update your blood type in settings to receive relevant notifications and donation opportunities.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 font-medium text-sm"
            >
              Later
            </button>
            <button
              onClick={onGoToSettings}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-[1.02] text-sm"
            >
              Go to Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showBloodTypeModal, setShowBloodTypeModal] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
  
    try {
      const user = await login(formData.email, formData.password, rememberMe);
      
      if (user.role === 'user' && (user.bloodType === 'UNKNOWN' || !user.bloodType)) {
        setShowBloodTypeModal(true);
        return;
      }
  
      if ((user.role === 'admin' || user.role === 'superadmin') && user.status === 'inactive') {
        setError('Your admin account has been deactivated. Please contact the super administrator.');
        return;
      }
  
      handleRedirect(user);
    } catch (err) {
      if (err.response?.status === 403) {
        setError('Your account has been deactivated. Please contact the administrator.');
      } else {
        setError('Invalid email or password');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRedirect = (user) => {
    const reservationData = sessionStorage.getItem('reservationRedirect');
    if (reservationData && user.role === 'user') {
      sessionStorage.removeItem('reservationRedirect');
      navigate(`/campaigns/`);
    } else {
      switch(user.role) {
        case 'superadmin':
        case 'admin':
          navigate('/admin/dashboard');
          break;
        default:
          navigate('/user/dashboard');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-pink-50 flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Left Side - Login Form */}
          <div className="flex justify-center">
            <div className="max-w-sm w-full">
              <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
                <div className="text-center mb-6">
                  <div className="bg-gradient-to-r from-red-100 to-pink-100 w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <LogIn className="h-8 w-8 text-red-600" />
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back</h1>
                  <p className="text-gray-600 text-sm">Please sign in to your account to continue</p>
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                    <p className="text-xs text-red-700 font-medium">{error}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <Mail className="h-4 w-4 text-red-500" />
                        Email Address
                      </label>
                      <div className="relative group">
                        <input
                          type="email"
                          name="email"
                          required
                          value={formData.email}
                          onChange={handleChange}
                          className="block w-full pl-10 pr-3 py-3 text-sm border-2 border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 group-hover:border-gray-300"
                          placeholder="Enter your email address"
                        />
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <Key className="h-4 w-4 text-red-500" />
                        Password
                      </label>
                      <div className="relative group">
                        <input
                          type={showPassword ? "text" : "password"}
                          name="password"
                          required
                          value={formData.password}
                          onChange={handleChange}
                          className="block w-full pl-10 pr-10 py-3 text-sm border-2 border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 group-hover:border-gray-300"
                          placeholder="Enter your password"
                        />
                        <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <input
                        id="remember-me"
                        name="remember-me"
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="h-4 w-4 text-red-600 focus:ring-red-500 border-2 border-gray-300 rounded transition-colors"
                      />
                      <label htmlFor="remember-me" className="ml-2 block text-sm font-medium text-gray-700">
                        Remember me
                      </label>
                    </div>

                    <Link 
                      to="/reset-password"
                      className="text-sm font-semibold text-red-600 hover:text-red-700 transition-colors"
                    >
                      Forgot password?
                    </Link>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-md text-sm font-semibold text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:transform-none"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Signing in...</span>
                      </div>
                    ) : (
                      'Sign In'
                    )}
                  </button>
                </form>

                <div className="mt-6">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-3 bg-white text-gray-500 font-medium">
                        New to our platform?
                      </span>
                    </div>
                  </div>

                  <div className="mt-4">
                    <Link
                      to="/register"
                      className="w-full flex justify-center py-3 px-4 border-2 border-red-600 rounded-lg text-sm font-semibold text-red-600 hover:bg-red-50 hover:border-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200 transform hover:scale-[1.02]"
                    >
                      Create a new account
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Features & Benefits */}
          <div className="hidden lg:block">
            <div className="text-center lg:text-left">
              <div className="mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                  <Heart className="w-8 h-8 text-red-600" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-3 bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">
                  Blood Bank Management
                </h2>
                <p className="text-lg text-gray-600 leading-relaxed max-w-lg">
                  Join thousands of users in managing blood donations, finding donors, and saving lives through our comprehensive platform.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Shield className="w-5 h-5 text-red-600" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-base font-semibold text-gray-900 mb-1">Secure & Reliable</h3>
                    <p className="text-sm text-gray-600">Your data is protected with enterprise-grade security and encryption.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-base font-semibold text-gray-900 mb-1">Community Driven</h3>
                    <p className="text-sm text-gray-600">Connect with donors and recipients in your local community.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Heart className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-base font-semibold text-gray-900 mb-1">Save Lives</h3>
                    <p className="text-sm text-gray-600">Every login brings you closer to helping someone in need.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showBloodTypeModal && (
        <UnknownBloodTypeModal
          onClose={() => {
            setShowBloodTypeModal(false);
            navigate('/user/dashboard');
          }}
          onGoToSettings={() => {
            setShowBloodTypeModal(false);
            navigate('/user/settings');
          }}
        />
      )}
    </div>
  );
};

export default Login;