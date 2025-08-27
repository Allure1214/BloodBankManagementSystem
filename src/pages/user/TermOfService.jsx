import React, { useState } from 'react';
import { Phone, User, Scroll, ShieldCheck, Lock, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';

const TermsSection = ({ icon: Icon, title, children, defaultOpen = false }) => {
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
        aria-controls={`terms-content-${title.toLowerCase().replace(/\s+/g, '-')}`}
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
        id={`terms-content-${title.toLowerCase().replace(/\s+/g, '-')}`}
        className={`px-4 sm:px-6 pb-4 sm:pb-6 transition-all duration-300 ease-in-out overflow-hidden ${
          isOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
        }`}
        role="region"
        aria-labelledby={`terms-header-${title.toLowerCase().replace(/\s+/g, '-')}`}
      >
        <div className="pl-8 sm:pl-10 pt-2">
          {children}
        </div>
      </div>
    </div>
  );
};

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white py-8 sm:py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8 sm:mb-12 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">Terms of Service</h1>
          <p className="text-sm sm:text-base text-gray-600">Last updated: August 27, 2025</p>
          <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-red-50 rounded-lg inline-block">
            <p className="text-xs sm:text-sm text-red-600">
              Please read these terms carefully before using our services
            </p>
          </div>
        </div>

        {/* Collapsible Sections */}
        <div className="space-y-4 sm:space-y-6">
          <TermsSection icon={Scroll} title="Introduction" defaultOpen={true}>
            <div className="prose prose-red max-w-none text-gray-600">
              <p className="leading-relaxed text-sm sm:text-base">
                Welcome to LifeLink Blood Bank. By accessing our services, you agree 
                to be bound by these Terms of Service. These terms outline your rights
                and responsibilities when using our platform.
              </p>
            </div>
          </TermsSection>

          <TermsSection icon={User} title="User Responsibilities">
            <div className="space-y-3 sm:space-y-4 text-gray-600">
              <p className="text-sm sm:text-base">As a user of our platform, you agree to:</p>
              <ul className="list-none space-y-2 sm:space-y-3">
                {[
                  'Provide accurate and complete information during registration',
                  'Keep your account credentials confidential',
                  'Notify us of any unauthorized use of your account',
                  'Follow all blood donation guidelines and requirements',
                  'Be truthful about your medical history and current health status',
                  'Respect appointment schedules and notify us of any cancellations'
                ].map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm sm:text-base">
                    <div className="w-2 h-2 rounded-full bg-red-500 mt-2 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </TermsSection>

          <TermsSection icon={Lock} title="Privacy and Data Protection">
            <div className="space-y-3 sm:space-y-4 text-gray-600">
              <p className="text-sm sm:text-base">Our commitment to protecting your privacy includes:</p>
              <div className="grid gap-3 sm:gap-4">
                {[
                  {
                    title: 'Data Security',
                    description: 'Your personal information is encrypted and securely stored'
                  },
                  {
                    title: 'Confidentiality',
                    description: 'Medical information is kept strictly confidential'
                  },
                  {
                    title: 'Limited Access',
                    description: 'Only authorized healthcare providers can access necessary data'
                  },
                  {
                    title: 'Transparency',
                    description: 'You can request access to your stored data at any time'
                  }
                ].map((item, index) => (
                  <div key={index} className="p-3 sm:p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-medium text-gray-900 mb-1 text-sm sm:text-base">{item.title}</h3>
                    <p className="text-xs sm:text-sm">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </TermsSection>

          <TermsSection icon={ShieldCheck} title="Service Rules and Guidelines">
            <div className="space-y-3 sm:space-y-4 text-gray-600">
              <div className="bg-red-50 p-3 sm:p-4 rounded-lg mb-3 sm:mb-4">
                <p className="text-red-700 font-medium text-sm sm:text-base">Important Guidelines</p>
                <ul className="mt-2 space-y-1 sm:space-y-2 text-red-600 text-xs sm:text-sm">
                  <li>• Must be at least 18 years old to donate</li>
                  <li>• Must wait 56 days between whole blood donations</li>
                  <li>• Must meet minimum weight requirements</li>
                </ul>
              </div>
              <div className="space-y-2 sm:space-y-3">
                {[
                  'Follow all health and safety protocols during donation',
                  'Comply with age and eligibility requirements',
                  'Respect the privacy of other donors and patients',
                  'Do not misuse or attempt to manipulate our systems'
                ].map((rule, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" aria-hidden="true" />
                    <span className="text-sm sm:text-base">{rule}</span>
                  </div>
                ))}
              </div>
            </div>
          </TermsSection>

          <TermsSection icon={AlertCircle} title="Disclaimers and Limitations">
            <div className="bg-gray-50 p-3 sm:p-4 rounded-lg text-gray-600">
              <ul className="space-y-2 sm:space-y-3">
                {[
                  'Services are provided "as is" without warranties',
                  'We reserve the right to modify or terminate services',
                  'We may update these terms with reasonable notice',
                  'Users are responsible for understanding eligibility requirements'
                ].map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm sm:text-base">
                    <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </TermsSection>

          <TermsSection icon={Phone} title="Contact Us">
            <div className="space-y-3 sm:space-y-4 text-gray-600">
              <p className="text-sm sm:text-base">Have questions? Reach out to us:</p>
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
                    <p className="text-sm sm:text-base">{contact.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </TermsSection>
        </div>

      </div>
    </div>
  );
};

export default TermsOfService;