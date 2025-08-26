// src/pages/Home.jsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import BloodTypeSelector from '../../components/modules/blood-donation/bloodTypeSelector.jsx';
import DonationSteps from '../../components/modules/blood-donation/donationSteps.jsx';
import DonationTypes from '../../components/modules/blood-donation/donationTypes.jsx';
import { 
  ChevronRight, 
  Search, 
  Building, 
  Users, 
  Activity, 
  Clock, 
  FileText, 
  Droplet,
  HeartPulse,
  MapPin
} from 'lucide-react';

const HomePage = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  useEffect(() => {
    window.scrollTo(0, 0);
    setIsLoaded(true);
  }, []);

  const services = [
    { 
      icon: <Search className="w-8 h-8 text-red-600 group-hover:scale-110 transition-transform" />, 
      title: "Blood Availability Search",
      description: "Check real-time blood availability",
      path: "/bloodavailability" 
    },
    { 
      icon: <Building className="w-8 h-8 text-red-600 group-hover:scale-110 transition-transform" />, 
      title: "Blood Bank Directory",
      description: "Find blood banks near you",
      path: "/directory" 
    },
    { 
      icon: <Users className="w-8 h-8 text-red-600 group-hover:scale-110 transition-transform" />, 
      title: "Donation Campaigns",
      description: "Join upcoming campaigns",
      path: "/campaigns" 
    },
    { 
      icon: <HeartPulse className="w-8 h-8 text-red-600 group-hover:scale-110 transition-transform" />, 
      title: "Donor Portal",
      description: "Access your donor account",
      path: "/login" 
    },
    { 
      icon: <Activity className="w-8 h-8 text-red-600 group-hover:scale-110 transition-transform" />, 
      title: "Blood Bank Dashboard",
      description: "View donation statistics",
      path: "/dashboard" 
    }
  ];
  
  const getRandomPosition = (i) => {
    const positions = [
      'top-1/4 left-1/4',
      'top-3/4 left-1/3',
      'top-1/2 left-2/3',
      'top-1/3 right-1/4',
      'top-2/3 right-1/3'
    ];
    return positions[i % positions.length];
  };


  return (
    <div className={`flex-1 flex flex-col w-full transition-opacity duration-1000 ${
      isLoaded ? 'opacity-100' : 'opacity-0'
    }`}>
      {/* Hero Section */}
      <section className="relative w-full overflow-hidden min-h-[600px]">
        <div className="absolute inset-0 bg-gradient-animate" aria-hidden="true"></div>
        
        {/* Background Droplets */}
        <div className="absolute -right-20 -top-20" aria-hidden="true">
          <Droplet className="w-96 h-96 text-red-600 opacity-10 motion-safe:animate-float-rotate" />
        </div>
        <div className="absolute left-20 bottom-20" aria-hidden="true">
          <Droplet className="w-64 h-64 text-red-600 opacity-10 motion-safe:animate-float-rotate-reverse" />
        </div>
        
        {/* Floating droplets */}
        {[...Array(5)].map((_, i) => (
          <div key={i} className={`absolute ${getRandomPosition(i)} motion-safe:animate-float-random opacity-20`} aria-hidden="true">
            <Droplet className="w-8 h-8 text-red-400" />
          </div>
        ))}

        {/* Hero Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20 relative">
          <div className="max-w-3xl space-y-6">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 md:mb-6 leading-tight motion-safe:animate-reveal-text">
              Every Drop Counts, <br />
              <span className="text-red-600 inline-block motion-safe:animate-glow">Save Lives</span> Today
            </h1>
            <p className="text-base md:text-xl text-gray-600 mb-8 md:mb-10 leading-relaxed motion-safe:animate-fade-in-up delay-200">
              Join our mission to help those in need. Your blood donation can save up to three lives.
            </p>
            <div className="flex flex-wrap gap-3 md:gap-4 motion-safe:animate-fade-in-up delay-300">
              <Link 
                to="/register" 
                aria-label="Become a donor and register"
                className="group inline-flex items-center px-6 md:px-8 py-3 md:py-4 bg-red-600 text-white rounded-lg hover:bg-red-700 
                         transition-all transform motion-safe:hover:scale-105 shadow-md hover:shadow-xl motion-safe:animate-pulse-subtle"
              >
                <span>Become a Donor</span>
                <ChevronRight className="ml-2 w-5 h-5 transition-transform motion-safe:group-hover:translate-x-1" />
              </Link>
              <Link 
                to="/bloodavailability" 
                aria-label="Check blood availability near you"
                className="group inline-flex items-center px-6 md:px-8 py-3 md:py-4 bg-white text-red-600 rounded-lg hover:bg-red-50 
                         transition-all transform motion-safe:hover:scale-105 shadow-md hover:shadow-xl"
              >
                <span>Check Availability</span>
                <Search className="ml-2 w-5 h-5 transition-transform motion-safe:group-hover:scale-110" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="w-full bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 animate-reveal-text">
              Our Services
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto animate-fade-in-up">
              Discover how we make blood donation accessible and efficient
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
            {services.slice(0, 4).map((service, index) => (
              <Link 
                key={index} 
                to={service.path}
                className={`group bg-white p-8 rounded-xl shadow-md hover:shadow-xl transition-all 
                         transform motion-safe:hover:-translate-y-2 flex flex-col items-center text-center 
                         motion-safe:animate-fade-in-up`}
                style={{ animationDelay: `${(index + 1) * 100}ms` }}
              >
                <div className="mb-6 p-4 bg-red-50 rounded-full group-hover:bg-red-100 transition-colors">
                  <div className="transform transition-transform motion-safe:group-hover:scale-110 motion-safe:group-hover:rotate-6">
                    {service.icon}
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-red-600 transition-colors">
                  {service.title}
                </h3>
                <p className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">
                  {service.description}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="w-full bg-red-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <Clock className="w-8 h-8 text-red-600" aria-hidden="true" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Donate in under 30 minutes</h3>
                  <p className="mt-1 text-sm text-gray-600">Streamlined process and smart scheduling reduce waiting time.</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <FileText className="w-8 h-8 text-red-600" aria-hidden="true" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Clear eligibility guidance</h3>
                  <p className="mt-1 text-sm text-gray-600">Know exactly when and how you can donate safely.</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <HeartPulse className="w-8 h-8 text-red-600" aria-hidden="true" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Track your impact</h3>
                  <p className="mt-1 text-sm text-gray-600">View donation history and lifesaving milestones in your profile.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works (compact) */}
      <section className="w-full bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900">How it works</h2>
            <p className="mt-2 text-gray-600">Donate in three simple steps: check eligibility, schedule, donate.</p>
          </div>
          <div className="motion-safe:animate-fade-in-up">
            <details className="bg-red-50/60 rounded-xl p-6">
              <summary className="cursor-pointer font-medium text-gray-900 select-none">
                See full steps and donation types
              </summary>
              <div className="mt-6 space-y-8">
              <div>
                  <BloodTypeSelector />
                </div>
                <div>
                  <DonationSteps />
                </div>
                <div>
                  <DonationTypes />
                </div>
              </div>
            </details>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="w-full bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Together, we make an impact</h2>
              <p className="mt-3 text-gray-600">Join thousands of donors and volunteers who help save lives every day.</p>
              <div className="mt-6 grid grid-cols-3 gap-4">
                <div className="p-4 bg-red-50 rounded-lg text-center">
                  <div className="text-2xl font-bold text-red-600">3x</div>
                  <div className="text-sm text-gray-600">Lives per donation</div>
                </div>
                <div className="p-4 bg-red-50 rounded-lg text-center">
                  <div className="text-2xl font-bold text-red-600">1k+</div>
                  <div className="text-sm text-gray-600">Active donors</div>
                </div>
                <div className="p-4 bg-red-50 rounded-lg text-center">
                  <div className="text-2xl font-bold text-red-600">10+</div>
                  <div className="text-sm text-gray-600">Partner banks</div>
                </div>
              </div>
            </div>
            <div className="bg-red-50 rounded-xl p-6">
              <blockquote className="text-gray-800 italic">“The process was so simple and I loved seeing the impact of my donation. I’ll be back!”</blockquote>
              <div className="mt-4 text-sm text-gray-600">— Amina, Donor since 2023</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-cta-animate" aria-hidden="true"></div>
        <div className="relative py-20">
          <div className="container mx-auto px-4 text-center relative">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white motion-safe:animate-reveal-text">
              Ready to Save Lives?
            </h2>
            <p className="text-base md:text-xl mb-10 max-w-2xl mx-auto text-white/90 motion-safe:animate-fade-in-up">
              Your donation can make a difference in someone's life.
            </p>
            <div className="flex flex-wrap justify-center gap-4 md:gap-6 motion-safe:animate-fade-in-up">
              <Link 
                to="/register" 
                aria-label="Register as a donor"
                className="group inline-flex items-center px-8 py-4 bg-white text-red-600 rounded-lg 
                          transition-all transform motion-safe:hover:scale-105 shadow-lg hover:shadow-xl"
              >
                <span>Register as Donor</span>
                <ChevronRight className="ml-2 w-5 h-5 transition-transform motion-safe:group-hover:translate-x-1" />
              </Link>
              <Link 
                to="/directory" 
                aria-label="Find nearest donation center"
                className="group inline-flex items-center px-8 py-4 border-2 border-white text-white rounded-lg 
                          transition-all transform motion-safe:hover:scale-105 hover:bg-white hover:text-red-600"
              >
                <span>Find Nearest Center</span>
                <MapPin className="ml-2 w-5 h-5 transition-transform motion-safe:group-hover:scale-110" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;