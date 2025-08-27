import React, { useState } from 'react';
import { 
  Shield, 
  FileText, 
  Eye, 
  Share2, 
  Lock, 
  Bell, 
  Phone,
  ChevronDown,
  ChevronUp,
  Info,
  CheckCircle
} from 'lucide-react';

const PolicySection = ({ icon: Icon, title, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsOpen(!isOpen);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm mb-4 overflow-hidden transition-all duration-200 hover:shadow-md">
      <button
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        className="w-full p-4 sm:p-6 flex items-center justify-between hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-inset"
        aria-expanded={isOpen}
        aria-controls={`policy-content-${title.toLowerCase().replace(/\s+/g, '-')}`}
      >
        <div className="flex items-center gap-3 sm:gap-4">
          <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 flex-shrink-0" aria-hidden="true" />
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">{title}</h2>
        </div>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 flex-shrink-0" aria-hidden="true" />
        ) : (
          <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 flex-shrink-0" aria-hidden="true" />
        )}
      </button>
      
      <div 
        id={`policy-content-${title.toLowerCase().replace(/\s+/g, '-')}`}
        className={`px-4 sm:px-6 pb-4 sm:pb-6 transition-all duration-300 ease-in-out overflow-hidden ${
          isOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
        }`}
        role="region"
        aria-labelledby={`policy-header-${title.toLowerCase().replace(/\s+/g, '-')}`}
      >
        <div className="pl-8 sm:pl-10 pt-2">
          {children}
        </div>
      </div>
    </div>
  );
};

const InfoCard = ({ title, children, type = 'info' }) => {
  const styles = {
    info: 'bg-blue-50 border-blue-200 text-blue-700',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    success: 'bg-green-50 border-green-200 text-green-700'
  };

  return (
    <div className={`p-3 sm:p-4 rounded-lg border ${styles[type]} mb-4`}>
      <div className="flex items-center gap-2 mb-2">
        <Info className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" aria-hidden="true" />
        <h3 className="font-medium text-sm sm:text-base">{title}</h3>
      </div>
      <div className="ml-6 sm:ml-7">
        <div className="text-sm sm:text-base">
          {children}
        </div>
      </div>
    </div>
  );
};

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white py-8 sm:py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8 sm:mb-12 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">Privacy Policy</h1>
          <p className="text-sm sm:text-base text-gray-600">Last updated: August 27, 2025</p>
          <div className="mt-4 sm:mt-6 inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-red-50 rounded-lg">
            <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 flex-shrink-0" aria-hidden="true" />
            <p className="text-xs sm:text-sm text-red-600">
              Your privacy is our top priority
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-4 sm:space-y-6">
          <PolicySection icon={Shield} title="Introduction" defaultOpen={true}>
            <div className="prose prose-red max-w-none text-gray-600">
              <p className="leading-relaxed text-sm sm:text-base">
                At LifeLink Blood Bank, we take your privacy seriously. This Privacy Policy explains 
                how we collect, use, disclose, and safeguard your information when you use our services.
              </p>
              <InfoCard title="Important Notice">
                Please read this policy carefully to understand how we handle your personal information.
              </InfoCard>
            </div>
          </PolicySection>

          <PolicySection icon={FileText} title="Information We Collect">
            <div className="space-y-4 sm:space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-3 sm:p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-3 text-sm sm:text-base">Personal Information</h3>
                  <ul className="space-y-2 text-gray-600">
                    {[
                      'Name and contact details',
                      'Date of birth',
                      'Government ID details',
                      'Medical history',
                      'Blood type',
                      'Previous donations'
                    ].map((item, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm sm:text-base">
                        <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 flex-shrink-0" aria-hidden="true" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="p-3 sm:p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-3 text-sm sm:text-base">Technical Information</h3>
                  <ul className="space-y-2 text-gray-600">
                    {[
                      'Device information',
                      'Browser details',
                      'IP address',
                      'Location data',
                      'Usage statistics',
                      'Preferences'
                    ].map((item, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm sm:text-base">
                        <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500 flex-shrink-0" aria-hidden="true" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </PolicySection>

          <PolicySection icon={Eye} title="How We Use Your Information">
            <div className="space-y-3 sm:space-y-4">
              <div className="grid gap-3 sm:gap-4">
                {[
                  {
                    title: 'Donation Management',
                    description: 'Process and manage blood donations efficiently',
                    icon: <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500" aria-hidden="true" />
                  },
                  {
                    title: 'Communication',
                    description: 'Send appointment reminders and campaign updates',
                    icon: <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" aria-hidden="true" />
                  },
                  {
                    title: 'Safety',
                    description: 'Ensure blood safety and maintain traceability',
                    icon: <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" aria-hidden="true" />
                  },
                  {
                    title: 'Service Improvement',
                    description: 'Enhance our services based on user feedback',
                    icon: <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" aria-hidden="true" />
                  }
                ].map((item, index) => (
                  <div key={index} className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0 mt-0.5">
                      {item.icon}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 text-sm sm:text-base">{item.title}</h3>
                      <p className="text-gray-600 text-xs sm:text-sm">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </PolicySection>

          <PolicySection icon={Share2} title="Information Sharing">
            <div className="space-y-3 sm:space-y-4">
              <InfoCard title="Important Notice" type="warning">
                We never sell or rent your personal information to third parties.
              </InfoCard>
              <div className="grid gap-3 sm:gap-4">
                {[
                  'Healthcare providers and hospitals',
                  'Blood banks and medical facilities',
                  'Regulatory authorities when required',
                  'Service providers who assist our operations'
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 sm:p-4 bg-gray-50 rounded-lg">
                    <Share2 className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" aria-hidden="true" />
                    <span className="text-gray-600 text-sm sm:text-base">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </PolicySection>

          <PolicySection icon={Lock} title="Data Security">
            <div className="space-y-3 sm:space-y-4">
              <div className="grid gap-3 sm:gap-4">
                {[
                  {
                    title: 'Encryption',
                    description: 'All sensitive data is encrypted during transmission and storage'
                  },
                  {
                    title: 'Secure Infrastructure',
                    description: 'We use secure servers and maintain strict database security'
                  },
                  {
                    title: 'Regular Audits',
                    description: 'We conduct regular security audits and assessments'
                  },
                  {
                    title: 'Access Control',
                    description: 'Strict access controls and monitoring of data access'
                  }
                ].map((item, index) => (
                  <div key={index} className="p-3 sm:p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-medium text-gray-900 mb-1 text-sm sm:text-base">{item.title}</h3>
                    <p className="text-gray-600 text-xs sm:text-sm">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </PolicySection>

          <PolicySection icon={Bell} title="Your Rights">
            <div className="space-y-3 sm:space-y-4">
              <div className="grid gap-3 sm:gap-4">
                {[
                  {
                    right: 'Access Your Data',
                    description: 'Request a copy of your personal information'
                  },
                  {
                    right: 'Data Correction',
                    description: 'Request corrections to inaccurate information'
                  },
                  {
                    right: 'Withdraw Consent',
                    description: 'Opt-out of non-essential communications'
                  },
                  {
                    right: 'File Complaints',
                    description: 'Raise concerns about data handling'
                  }
                ].map((item, index) => (
                  <div key={index} className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-50 rounded-lg">
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 mt-0.5 flex-shrink-0" aria-hidden="true" />
                    <div>
                      <h3 className="font-medium text-gray-900 text-sm sm:text-base">{item.right}</h3>
                      <p className="text-gray-600 text-xs sm:text-sm">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </PolicySection>

          <PolicySection icon={Phone} title="Contact Us">
            <div className="space-y-3 sm:space-y-4">
              <p className="text-gray-600 mb-3 sm:mb-4 text-sm sm:text-base">
                For privacy-related inquiries or concerns, please contact us:
              </p>
              <div className="grid gap-3 sm:gap-4">
                {[
                  {
                    label: 'Email',
                    value: 'intech@lifelinkbloodbank.com',
                    bg: 'bg-blue-50'
                  },
                  {
                    label: 'Phone',
                    value: '07-123 4567',
                    bg: 'bg-green-50'
                  },
                  {
                    label: 'Address',
                    value: '12, 11/5 Jalan Johor, 79100 Johor Bahru, Johor, Malaysia',
                    bg: 'bg-purple-50'
                  }
                ].map((contact, index) => (
                  <div key={index} className={`p-3 sm:p-4 rounded-lg ${contact.bg}`}>
                    <p className="font-medium mb-1 text-sm sm:text-base">{contact.label}</p>
                    <p className="text-gray-600 text-sm sm:text-base">{contact.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </PolicySection>
        </div>

      </div>
    </div>
  );
};

export default PrivacyPolicy;