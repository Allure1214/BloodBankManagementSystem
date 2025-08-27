import React, { useState, useMemo } from 'react';
import { 
  MapPin, Phone, Mail, Clock, Send, 
  AlertCircle, CheckCircle, ChevronDown, User
} from 'lucide-react';

const InputField = ({ label, icon: Icon, error, touched, ...props }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
    <div className="relative rounded-lg shadow-sm">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Icon className="h-5 w-5 text-gray-400" aria-hidden="true" />
      </div>
      <input
        {...props}
        className={`block w-full pl-10 pr-3 py-2.5 border rounded-lg
          transition duration-150 ease-in-out
          focus:ring-2 focus:ring-red-500 focus:border-transparent
          hover:border-gray-300
          ${error && touched ? 'border-red-300' : 'border-gray-200'}`}
      />
    </div>
    {touched && error && (
      <p className="mt-1 text-sm text-red-600">{error}</p>
    )}
  </div>
);

const ContactUs = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [touched, setTouched] = useState({});

  const subjectOptions = [
    'General Inquiry',
    'Blood Donation',
    'Blood Request',
    'Feedback',
    'Other'
  ];

  const contactInfo = [
    {
      icon: MapPin,
      title: "Our Location",
      content: ["12, 11/5 Jalan Johor", "79100 Johor Bahru", "Johor, Malaysia"]
    },
    {
      icon: Phone,
      title: "Phone",
      content: ["07-123 4567"],
      emergency: "Emergency: 07-987 6543"
    },
    {
      icon: Mail,
      title: "Email",
      content: ["info@lifelinkbloodbank.com"]
    },
    {
      icon: Clock,
      title: "Operating Hours",
      content: ["Monday - Saturday: 8:00 AM - 6:00 PM"],
      emergency: "Emergency Services: 24/7"
    }
  ];

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

  const fieldErrors = useMemo(() => {
    const errors = {};
    if (!formData.name || formData.name.trim().length < 2) {
      errors.name = 'Please enter your full name';
    }
    if (!emailRegex.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    if (!formData.subject) {
      errors.subject = 'Please select a subject';
    }
    if (!formData.message || formData.message.trim().length < 10) {
      errors.message = 'Message must be at least 10 characters';
    }
    return errors;
  }, [formData]);

  const isFormValid = useMemo(() => Object.keys(fieldErrors).length === 0, [fieldErrors]);

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    setTouched(prev => ({ ...prev, [e.target.name]: true }));
    // Clear messages when user starts typing
    setError('');
    setSubmitted(false);
  };

  const handleBlur = (e) => {
    setTouched(prev => ({ ...prev, [e.target.name]: true }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Mark all fields as touched
    setTouched({
      name: true,
      email: true,
      subject: true,
      message: true
    });

    if (!isFormValid) {
      setError('Please fix the highlighted fields');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const baseUrl = import.meta?.env?.VITE_API_BASE_URL || 'http://localhost:5000';
      const response = await fetch(`${baseUrl}/api/messages/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        setSubmitted(true);
        setFormData({ name: '', email: '', subject: '', message: '' });
        setTouched({});
      } else {
        setError(data.message || 'Failed to send message');
      }
    } catch (err) {
      setError('Failed to send message. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 sm:py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">Contact Us</h1>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
            Have questions about blood donation or need assistance? 
            We're here to help and would love to hear from you.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12">
          {/* Get in Touch Section */}
          <div className="bg-white rounded-xl shadow-sm p-6 sm:p-8 h-fit">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6 sm:mb-8">Get in Touch</h2>
            
            <div className="space-y-6 sm:space-y-8">
              {contactInfo.map((item, index) => (
                <div key={index} className="flex items-start group">
                  <div className="bg-red-50 rounded-lg p-2 sm:p-3 group-hover:bg-red-100 transition-colors flex-shrink-0">
                    <item.icon className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" aria-hidden="true" />
                  </div>
                  <div className="ml-3 sm:ml-4">
                    <h3 className="font-medium text-gray-900 mb-1">{item.title}</h3>
                    {item.content.map((line, i) => (
                      <p key={i} className="text-gray-600 text-sm sm:text-base">{line}</p>
                    ))}
                    {item.emergency && (
                      <p className="text-red-600 mt-1 font-medium text-sm sm:text-base">{item.emergency}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-white rounded-xl shadow-sm p-6 sm:p-8">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6 sm:mb-8">Send us a Message</h2>

            {submitted && (
              <div className="mb-6 p-4 bg-green-50 rounded-lg flex items-center text-green-700" role="alert">
                <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0" aria-hidden="true" />
                <span>Thank you for your message. We'll get back to you soon!</span>
              </div>
            )}

            {error && (
              <div className="mb-6 p-4 bg-red-50 rounded-lg flex items-center text-red-700" role="alert">
                <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6" noValidate>
              <InputField
                label="Name"
                icon={User}
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Your full name"
                error={fieldErrors.name}
                touched={touched.name}
                aria-label="Your full name"
              />

              <InputField
                label="Email"
                icon={Mail}
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Your email address"
                error={fieldErrors.email}
                touched={touched.email}
                aria-label="Your email address"
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Subject
                </label>
                <div className="relative rounded-lg shadow-sm">
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" aria-hidden="true" />
                  <select
                    name="subject"
                    required
                    value={formData.subject}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`block w-full pr-10 pl-3 py-2.5 border rounded-lg
                      appearance-none bg-white cursor-pointer
                      focus:ring-2 focus:ring-red-500 focus:border-transparent
                      hover:border-gray-300 transition duration-150 ease-in-out
                      ${fieldErrors.subject && touched.subject ? 'border-red-300' : 'border-gray-200'}`}
                    aria-label="Select a subject"
                  >
                    <option value="">Select a subject</option>
                    {subjectOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
                {touched.subject && fieldErrors.subject && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.subject}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Message
                </label>
                <textarea
                  name="message"
                  required
                  rows={4}
                  value={formData.message}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="How can we help you?"
                  className={`w-full px-4 py-3 border rounded-lg resize-none
                    focus:ring-2 focus:ring-red-500 focus:border-transparent
                    hover:border-gray-300 transition duration-150 ease-in-out
                    ${fieldErrors.message && touched.message ? 'border-red-300' : 'border-gray-200'}`}
                  aria-label="Your message"
                />
                {touched.message && fieldErrors.message && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting || !isFormValid}
                className={`w-full py-3 px-4 rounded-lg text-white font-medium
                  transition duration-150 ease-in-out flex items-center justify-center
                  focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2
                  ${submitting || !isFormValid
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-red-600 hover:bg-red-700'}`}
                aria-label={submitting ? 'Sending message...' : 'Send message'}
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-5 w-5 mr-2" aria-hidden="true" />
                    Send Message
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactUs;