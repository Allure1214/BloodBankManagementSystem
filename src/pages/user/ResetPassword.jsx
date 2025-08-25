import React, { useState, useEffect } from 'react';
import { Mail, Eye, EyeOff, RefreshCw, ArrowRight, CheckCircle, Lock, KeyRound, Info } from 'lucide-react';

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
        return <Mail className="w-12 h-12 text-red-500" />;
      case 2:
        return <KeyRound className="w-12 h-12 text-red-500" />;
      case 3:
        return <Lock className="w-12 h-12 text-red-500" />;
      default:
        return null;
    }
  };

  const renderStepIndicator = () => (
    <div className="flex justify-center mb-8">
      {[1, 2, 3].map((index) => (
        <div key={index} className="flex items-center">
          <div className={`relative w-12 h-12 rounded-full flex items-center justify-center ${
            step === index ? 'bg-red-100 ring-2 ring-red-500' :
            step > index ? 'bg-green-100 ring-2 ring-green-500' :
            'bg-gray-100'
          }`}>
            {step > index ? (
              <CheckCircle className="w-6 h-6 text-green-500" />
            ) : (
              <span className={`text-lg font-semibold ${
                step === index ? 'text-red-600' : 'text-gray-500'
              }`}>
                {index}
              </span>
            )}
          </div>
          {index < 3 && (
            <div className={`w-24 h-1 mx-2 rounded ${
              step > index ? 'bg-green-500' :
              step === index ? 'bg-red-200' : 'bg-gray-200'
            }`} />
          )}
        </div>
      ))}
    </div>
  );

  const renderPasswordRequirements = () => (
    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
      <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
        <Info className="w-4 h-4 mr-2" />
        Password Requirements
      </h4>
      <ul className="text-xs text-gray-600 space-y-1">
        <li className="flex items-center">
          <div className="w-1 h-1 bg-gray-400 rounded-full mr-2" />
          8-20 characters long
        </li>
        <li className="flex items-center">
          <div className="w-1 h-1 bg-gray-400 rounded-full mr-2" />
          At least one lowercase letter
        </li>
        <li className="flex items-center">
          <div className="w-1 h-1 bg-gray-400 rounded-full mr-2" />
          At least one uppercase letter
        </li>
        <li className="flex items-center">
          <div className="w-1 h-1 bg-gray-400 rounded-full mr-2" />
          At least one number
        </li>
      </ul>
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
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-white flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          {renderStepIcon(step)}
          <h2 className="mt-4 text-3xl font-extrabold text-gray-900">
            {getStepTitle()}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {getStepDescription()}
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10">
          {renderStepIndicator()}

          {error && (
            <div className="mb-6 p-4 rounded-md bg-red-50 border border-red-200 flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="ml-3 text-sm text-red-700">{error}</p>
            </div>
          )}

          {successMessage && (
            <div className="mb-6 p-4 rounded-md bg-green-50 border border-green-200 flex items-start">
              <div className="flex-shrink-0">
                <CheckCircle className="h-5 w-5 text-green-400" />
              </div>
              <p className="ml-3 text-sm text-green-700">{successMessage}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {step === 1 && (
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500 transition-colors duration-200"
                    placeholder="Enter your email"
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div className="flex flex-col space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Enter OTP Code
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      maxLength="6"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      required
                      className="block w-full px-4 py-3 text-center tracking-[1em] border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500 text-lg transition-colors duration-200"
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
                  className={`flex items-center justify-center w-full py-2 text-sm font-medium rounded-md ${
                    countdown > 0
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-red-50 text-red-600 hover:bg-red-100'
                  } transition-colors duration-200`}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${countdown > 0 ? 'animate-spin' : ''}`} />
                  {countdown > 0 ? `Resend in ${countdown}s` : 'Resend OTP'}
                </button>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    New Password
                  </label>
                  <div className="mt-1 relative">
                    <input
                      name="newPassword"
                      type={showPassword ? "text" : "password"}
                      value={formData.newPassword}
                      onChange={handleChange}
                      required
                      className="block w-full pr-10 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500 transition-colors duration-200"
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
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Confirm Password
                  </label>
                  <div className="mt-1">
                    <input
                      name="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                      className="block w-full py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                    />
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {step === 1 ? 'Send OTP' : step === 2 ? 'Verify OTP' : 'Reset Password'}
                  <ArrowRight className="ml-2 w-4 h-4" />
                </>
              )}
            </button>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => window.location.href = '/login'}
                className="text-sm font-medium text-red-600 hover:text-red-500 transition-colors duration-200"
              >
                Back to login
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
