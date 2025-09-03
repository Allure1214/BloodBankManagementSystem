import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Home, 
  ArrowLeft, 
  Search, 
  Heart,
  AlertTriangle,
  RefreshCw,
  MessageCircle
} from 'lucide-react';

const PageNotFound = () => {
  const quickLinks = [
    { path: '/', label: 'Home', icon: <Home className="w-5 h-5" /> },
    { path: '/campaigns', label: 'Campaigns', icon: <Search className="w-5 h-5" /> },
    { path: '/dashboard', label: 'Blood Bank Dashboard', icon: <Heart className="w-5 h-5" /> },
    { path: '/register', label: 'Become a Donor', icon: <Heart className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 flex items-center justify-center px-4">
      <div className="max-w-4xl mx-auto text-center">
        {/* 404 Illustration */}
        <div className="mb-8 animate-bounce">
          <div className="relative">
            <div className="text-9xl font-bold text-red-200 select-none">404</div>
            <div className="absolute inset-0 flex items-center justify-center">
              <AlertTriangle className="w-16 h-16 text-red-400 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Error Message */}
        <div className="mb-8 animate-fade-in-up">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Oops! Page Not Found
          </h1>
          <p className="text-xl text-gray-600 mb-6 max-w-2xl mx-auto">
            The page you're looking for seems to have vanished into thin air. 
            Don't worry, even the best blood banks sometimes misplace things!
          </p>
          <p className="text-lg text-gray-500 max-w-xl mx-auto">
            Let's get you back on track to saving lives. Every moment counts!
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12 animate-fade-in-up delay-200">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-8 py-4 bg-red-600 text-white rounded-lg 
                     hover:bg-red-700 transition-all duration-300 transform hover:scale-105 
                     shadow-lg hover:shadow-xl font-semibold text-lg"
          >
            <Home className="w-5 h-5" />
            Go Home
          </Link>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-gray-700 border-2 border-gray-300 
                     rounded-lg hover:bg-gray-50 hover:border-red-300 transition-all duration-300 
                     transform hover:scale-105 shadow-lg hover:shadow-xl font-semibold text-lg"
          >
            <ArrowLeft className="w-5 h-5" />
            Go Back
          </button>
        </div>

        {/* Quick Links */}
        <div className="animate-fade-in-up delay-300">
          <h3 className="text-2xl font-semibold text-gray-800 mb-6">
            Popular Pages
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {quickLinks.map((link, index) => (
              <Link
                key={link.path}
                to={link.path}
                className="group flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200 
                         hover:border-red-300 hover:shadow-lg transition-all duration-300 
                         transform hover:scale-105 animate-fade-in-up"
                style={{ animationDelay: `${(index + 4) * 100}ms` }}
              >
                <div className="text-red-600 group-hover:text-red-700 transition-colors duration-300">
                  {link.icon}
                </div>
                <span className="font-medium text-gray-700 group-hover:text-red-700 transition-colors duration-300">
                  {link.label}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-16 p-6 bg-white rounded-xl shadow-lg border border-gray-100 animate-fade-in-up delay-500">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Heart className="w-6 h-6 text-red-600 animate-pulse" />
            <h3 className="text-xl font-semibold text-gray-800">
              Need Help?
            </h3>
          </div>
          <p className="text-gray-600 mb-4">
            If you believe this is an error or need assistance, we're here to help!
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 bg-red-50 text-red-700 rounded-lg 
                       hover:bg-red-100 transition-all duration-300 font-medium"
            >
              <Search className="w-4 h-4" />
              Contact Support
            </Link>
            <Link
              to="/FAQs"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gray-50 text-gray-700 rounded-lg 
                       hover:bg-gray-100 transition-all duration-300 font-medium"
            >
              <RefreshCw className="w-4 h-4" />
              View FAQs
            </Link>
            <button
              onClick={() => {
                // Scroll to bottom to show chatbot
                window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                // Trigger chatbot open after a short delay
                setTimeout(() => {
                  const chatbotButton = document.querySelector('[aria-label="Open chatbot"]');
                  if (chatbotButton) {
                    chatbotButton.click();
                  }
                }, 500);
              }}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-50 text-blue-700 rounded-lg 
                       hover:bg-blue-100 transition-all duration-300 font-medium"
            >
              <MessageCircle className="w-4 h-4" />
              Ask Our AI Assistant
            </button>
          </div>
        </div>

        {/* Fun Fact */}
        <div className="mt-8 p-4 bg-gradient-to-r from-red-100 to-pink-100 rounded-lg border border-red-200 animate-fade-in-up delay-600">
          <p className="text-sm text-red-800 font-medium">
            💡 <strong>Did you know?</strong> A single blood donation can save up to 3 lives! 
            While you're here, why not check out our{' '}
            <Link to="/campaigns" className="underline hover:text-red-900 transition-colors">
              upcoming blood drives
            </Link>?
          </p>
        </div>
      </div>
    </div>
  );
};

export default PageNotFound;
