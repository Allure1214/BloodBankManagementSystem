import React, { useEffect } from 'react';
import { 
  Heart, Users, MapPin, Phone, Clock, Mail, Globe,
  Activity, Shield, Award, ExternalLink
} from 'lucide-react';
import { Link } from 'react-router-dom';

const AboutUs = () => {
  useEffect(() => {
    // Smooth scroll behavior
    document.documentElement.style.scrollBehavior = 'smooth';
    return () => {
      document.documentElement.style.scrollBehavior = 'auto';
    };
  }, []);

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-red-600 to-red-700 text-white" role="banner" aria-labelledby="hero-title">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative container mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center">
          <div className="animate-fade-in">
            <div className="bg-red-500 bg-opacity-20 w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mx-auto mb-6 sm:mb-8">
              <Heart className="w-8 h-8 sm:w-10 sm:h-10 animate-pulse" aria-hidden="true" />
            </div>
            <h1 id="hero-title" className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6">Welcome to LifeLink Blood Bank</h1>
            <p className="text-lg sm:text-xl md:text-2xl mb-6 sm:mb-8 text-red-100">
              Connecting donors to save lives across Johor
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 sm:space-x-4">
              <button 
                className="bg-white text-red-600 px-6 sm:px-8 py-3 rounded-lg font-medium hover:bg-red-50 transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-red-600"
                onClick={() => scrollToSection('contact')}
                aria-label="Become a blood donor"
              >
                <Link to='/register' className="block">
                  Become a Donor
                </Link>
              </button>
              <button 
                className="bg-red-500 text-white px-6 sm:px-8 py-3 rounded-lg font-medium hover:bg-red-400 transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-red-600"
                onClick={() => scrollToSection('features')}
                aria-label="Learn more about our services"
              >
                <Link to='/' className="block">
                  Learn More
                </Link>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="container mx-auto px-4 sm:px-6 py-16 sm:py-20" aria-labelledby="mission-vision-title">
        <div className="grid md:grid-cols-2 gap-8 sm:gap-12">
          <article className="bg-white p-6 sm:p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <div className="bg-red-50 w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mb-4 sm:mb-6">
              <Shield className="w-7 h-7 sm:w-8 sm:h-8 text-red-600" aria-hidden="true" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">Our Mission</h2>
            <p className="text-gray-600 leading-relaxed">
              To ensure a safe and adequate blood supply for the community while providing excellent service to donors,
              patients, and healthcare partners through continuous dedication and improvement.
            </p>
          </article>
          <article className="bg-white p-6 sm:p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <div className="bg-red-50 w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mb-4 sm:mb-6">
              <Award className="w-7 h-7 sm:w-8 sm:h-8 text-red-600" aria-hidden="true" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">Our Vision</h2>
            <p className="text-gray-600 leading-relaxed">
              To be the leading blood bank service in Johor, recognized for excellence in blood collection,
              testing, and distribution while maintaining the highest standards of safety and quality.
            </p>
          </article>
        </div>
      </section>

      {/* Key Features */}
      <section id="features" className="bg-white py-16 sm:py-20" aria-labelledby="features-title">
        <div className="container mx-auto px-4 sm:px-6">
          <h2 id="features-title" className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-12 sm:mb-16">What We Do</h2>
          <div className="grid md:grid-cols-3 gap-8 sm:gap-12">
            {[
              {
                icon: Heart,
                title: "Blood Collection",
                description: "Safe and efficient blood collection from voluntary donors across multiple locations."
              },
              {
                icon: Users,
                title: "Donor Management",
                description: "Comprehensive donor registration and management system to ensure smooth donation process."
              },
              {
                icon: Globe,
                title: "Distribution Network",
                description: "Efficient distribution of blood units to hospitals and healthcare facilities."
              }
            ].map((feature, index) => (
              <article key={index} className="text-center group">
                <div className="bg-red-50 p-4 sm:p-6 rounded-2xl w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center mx-auto mb-4 sm:mb-6
                  group-hover:bg-red-100 transition-colors">
                  <feature.icon className="w-8 h-8 sm:w-10 sm:h-10 text-red-600" aria-hidden="true" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-gray-900">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Information */}
      <section id="contact" className="container mx-auto px-4 sm:px-6 py-16 sm:py-20" aria-labelledby="contact-title">
        <h2 id="contact-title" className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-12 sm:mb-16">Contact Us</h2>
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm">
          <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100">
            <div className="p-6 sm:p-8">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">Main Office</h3>
              <div className="space-y-4 sm:space-y-6">
                <address className="flex items-start group not-italic">
                  <MapPin className="w-5 h-5 text-red-600 mt-1 mr-3 sm:mr-4 group-hover:text-red-500 flex-shrink-0" aria-hidden="true" />
                  <p className="text-gray-600 leading-relaxed">
                    12, 11/5 Jalan Johor,<br />
                    79100 Johor Bahru,<br />
                    Johor, Malaysia
                  </p>
                </address>
                {[
                  { icon: Phone, text: "+60 7-123 4567", type: "tel" },
                  { icon: Mail, text: "intech@lifelinkbloodbank.com", type: "email" },
                  { icon: Clock, text: "Monday - Sunday: 8:00 AM - 6:00 PM", type: "text" }
                ].map((item, index) => (
                  <div key={index} className="flex items-center group">
                    <item.icon className="w-5 h-5 text-red-600 mr-3 sm:mr-4 group-hover:text-red-500 flex-shrink-0" aria-hidden="true" />
                    {item.type === "tel" ? (
                      <a href={`tel:${item.text}`} className="text-gray-600 hover:text-red-600 transition-colors">
                        {item.text}
                      </a>
                    ) : item.type === "email" ? (
                      <a href={`mailto:${item.text}`} className="text-gray-600 hover:text-red-600 transition-colors">
                        {item.text}
                      </a>
                    ) : (
                      <p className="text-gray-600">{item.text}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="p-6 sm:p-8">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">Emergency Contact</h3>
              <p className="text-gray-600 mb-4 sm:mb-6 leading-relaxed">
                For emergencies and urgent blood requirements, please contact our 24/7 hotline:
              </p>
              <div className="bg-red-50 p-4 sm:p-6 rounded-xl hover:bg-red-100 transition-colors">
                <p className="text-red-600 font-semibold mb-2">Emergency Hotline:</p>
                <div className="flex items-center space-x-2">
                  <Phone className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 flex-shrink-0" aria-hidden="true" />
                  <a href="tel:07-9876543" className="text-red-600 text-xl sm:text-2xl font-bold hover:text-red-700 transition-colors">
                    07-987 6543
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutUs;