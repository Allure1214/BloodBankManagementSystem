import React, { useState, useEffect } from 'react';
import {
  Mail,
  Eye,
  EyeOff,
  RefreshCw,
  ArrowRight,
  CheckCircle,
  Lock,
  KeyRound,
  Info,
  Shield,
  AlertCircle
} from 'lucide-react';

const ResetPassword = () => {
  const [formData, setFormData] = useState({
    email: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [otp, setOtp] = useState('');
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      const emailTrimmed = (formData.email || '').trim();
      if (!emailTrimmed) {
        throw new Error('Please enter your email address');
      }
      if (step === 1) {
        const verifyResponse = await fetch('http://localhost:5000/api/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: emailTrimmed })
        });

        if (!verifyResponse.ok) {
          const errorData = await verifyResponse.json();
          throw new Error(errorData.message || 'Email verification failed');
        }

        const otpResponse = await fetch('http://localhost:5000/api/auth/send-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: emailTrimmed })
        });

        if (!otpResponse.ok) {
          const errorData = await otpResponse.json();
          throw new Error(errorData.message || 'Failed to send OTP');
        }

        setStep(2);
        setCountdown(60);
      } else if (step === 2) {
        const response = await fetch('http://localhost:5000/api/auth/verify-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: emailTrimmed, otp })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Invalid OTP');
        }
        setStep(3);
      } else {
        if (formData.newPassword !== formData.confirmPassword) {
          throw new Error("Passwords don't match");
        }

        const response = await fetch('http://localhost:5000/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: emailTrimmed,
            newPassword: formData.newPassword,
            otp
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to reset password');
        }

        setSuccessMessage('Password reset successful!');
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderStepIcon = (currentStep) => {
    switch (currentStep) {
      case 1:
        return <Mail className="w-10 h-10 text-red-600" />;
      case 2:
        return <KeyRound className="w-10 h-10 text-red-600" />;
      case 3:
        return <Lock className="w-10 h-10 text-red-600" />;
      default:
        return null;
    }
  };

  const renderStepIndicator = () => (
    <div className="flex justify-center mb-6">
      {[1, 2, 3].map((index) => (
        <div key={index} className="flex items-center">
          <div className={`relative w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
            step === index ? 'bg-red-100 ring-2 ring-red-500 scale-110' :
            step > index ? 'bg-green-100 ring-2 ring-green-500' :
            'bg-gray-100 ring-1 ring-gray-300'
          }`}>
            {step > index ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <span className={`text-base font-semibold transition-colors duration-300 ${
                step === index ? 'text-red-600' : 'text-gray-500'
              }`}>
                {index}
              </span>
            )}
          </div>
          {index < 3 && (
            <div className={`w-16 h-1 mx-2 rounded transition-all duration-300 ${
              step > index ? 'bg-green-500' :
              step === index ? 'bg-red-200' : 'bg-gray-200'
            }`} />
          )}
        </div>
      ))}
    </div>
  );

  const renderPasswordRequirements = () => (
    <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
      <h4 className="text-sm font-semibold text-blue-900 mb-3 flex items-center gap-2">
        <Shield className="w-4 h-4 text-blue-600" />
        Password Requirements
      </h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div className="flex items-center text-xs text-blue-800">
          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2" />
          8-20 characters long
        </div>
        <div className="flex items-center text-xs text-blue-800">
          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2" />
          At least one lowercase letter
        </div>
        <div className="flex items-center text-xs text-blue-800">
          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2" />
          At least one uppercase letter
        </div>
        <div className="flex items-center text-xs text-blue-800">
          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2" />
          At least one number
        </div>
      </div>
    </div>
  );

  const getStepTitle = () => {
    switch (step) {
      case 1:
        return "Verify Your Email";
      case 2:
        return "Enter OTP Code";
      case 3:
        return "Create New Password";
      default:
        return "Reset Password";
    }
  };

  const getStepDescription = () => {
    switch (step) {
      case 1:
        return "Enter your email address to receive a verification code";
      case 2:
        return "Enter the 6-digit code sent to your email";
      case 3:
        return "Create a strong password for your account";
      default:
        return "";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-pink-50 flex flex-col justify-center py-8 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
            {renderStepIcon(step)}
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3 bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">
            {getStepTitle()}
          </h1>
          <p className="text-gray-600 leading-relaxed">
            {getStepDescription()}
          </p>
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white rounded-2xl shadow-xl py-6 px-6 border border-gray-100">
          {renderStepIndicator()}

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
              <p className="text-sm text-green-700 font-medium">{successMessage}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {step === 1 && (
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Mail className="h-4 w-4 text-red-500" />
                  Email Address
                </label>
                <div className="relative group">
                  <input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="block w-full pl-10 pr-3 py-3 text-sm border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 group-hover:border-gray-300"
                    placeholder="Enter your email address"
                  />
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <KeyRound className="h-4 w-4 text-red-500" />
                    Enter OTP Code
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      maxLength="6"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      required
                      className="block w-full px-4 py-3 text-center tracking-[0.5em] border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-lg font-mono transition-all duration-200"
                      placeholder="000000"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={async () => {
                    if (countdown === 0) {
                      try {
                        const response = await fetch('http://localhost:5000/api/auth/send-otp', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ email: formData.email })
                        });

                        if (!response.ok) {
                          const errorData = await response.json();
                          setError(errorData.message || 'Failed to resend OTP');
                          return;
                        }

                        setCountdown(60);
                        setError('');
                      } catch (error) {
                        setError('Failed to resend OTP. Please try again.');
                      }
                    }
                  }}
                  disabled={countdown > 0}
                  className={`flex items-center justify-center w-full py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                    countdown > 0
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 hover:border-red-300'
                  }`}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${countdown > 0 ? 'animate-spin' : ''}`} />
                  {countdown > 0 ? `Resend in ${countdown}s` : 'Resend OTP'}
                </button>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Lock className="h-4 w-4 text-red-500" />
                    New Password
                  </label>
                  <div className="relative group">
                    <input
                      name="newPassword"
                      type={showPassword ? "text" : "password"}
                      value={formData.newPassword}
                      onChange={handleChange}
                      required
                      className="block w-full pl-10 pr-10 py-3 text-sm border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 group-hover:border-gray-300"
                      placeholder="Enter new password"
                    />
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
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

                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Lock className="h-4 w-4 text-red-500" />
                    Confirm Password
                  </label>
                  <div className="relative group">
                    <input
                      name="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                      className="block w-full pl-10 pr-3 py-3 text-sm border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 group-hover:border-gray-300"
                      placeholder="Confirm new password"
                    />
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  </div>
                </div>

                {renderPasswordRequirements()}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-lg shadow-md text-sm font-semibold text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:transform-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </div>
              ) : (
                <>
                  {step === 1 ? 'Send OTP' : step === 2 ? 'Verify OTP' : 'Reset Password'}
                  <ArrowRight className="ml-2 w-4 h-4" />
                </>
              )}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => window.location.href = '/login'}
                className="text-sm font-semibold text-red-600 hover:text-red-700 transition-colors duration-200"
              >
                ← Back to login
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
