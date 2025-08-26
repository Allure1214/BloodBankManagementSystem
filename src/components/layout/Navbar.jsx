import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Menu, X, ChevronDown, LogOut, User, Home, Calendar, Activity, UserPlus } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const navigationItems = [
    { path: '/', label: 'Home', icon: <Home className="w-5 h-5" /> },
    { path: '/campaigns', label: 'Campaigns', icon: <Calendar className="w-5 h-5" /> },
    { path: '/dashboard', label: 'Blood Bank Dashboard', icon: <Activity className="w-5 h-5" /> },
    { path: '/register', label: 'Donor Registration', icon: <UserPlus className="w-5 h-5" /> },
  ];

  // Hide Donor Registration when user is logged in
  const visibleNavigationItems = user
    ? navigationItems.filter((item) => item.path !== '/register')
    : navigationItems;

  useEffect(() => {
    setMounted(true);
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const isActivePath = (path) => location.pathname === path;

  return (
    <nav className={`fixed top-0 left-0 right-0 bg-white shadow z-[10000] transition-transform duration-300
                    ${mounted ? 'translate-y-0' : '-translate-y-full'}`}>
      <div className="max-w-10xl mx-auto px-4">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <Link 
            to="/" 
            className="flex items-center space-x-2 text-xl font-bold text-red-600 hover:text-red-700 
                     transition-all duration-300 transform hover:scale-105"
          >
            <img 
              src="/favicon.svg" 
              alt="LifeLink" 
              className="h-8 w-8 transition-transform duration-300 hover:rotate-12"
            />
            <span className="bg-gradient-to-r from-red-600 to-red-500 bg-clip-text text-transparent">
              LifeLink Blood Bank
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {visibleNavigationItems.map((item, index) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-1 px-4 py-2 rounded-lg transition-all duration-300
                  transform hover:scale-105 group animate-fade-in-up
                  ${isActivePath(item.path)
                    ? 'bg-red-50 text-red-600 shadow-sm'
                    : 'text-gray-700 hover:bg-red-50 hover:text-red-600'}`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="transform transition-transform duration-300 group-hover:rotate-12">
                  {item.icon}
                </div>
                <span>{item.label}</span>
              </Link>
            ))}

            {/* User Menu */}
            {user ? (
              <div className="relative ml-2" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300
                    transform hover:scale-105 group
                    ${isDropdownOpen 
                      ? 'bg-red-50 text-red-600 shadow-sm' 
                      : 'text-gray-700 hover:bg-red-50 hover:text-red-600'}`}
                >
                  <User className="w-5 h-5 transition-transform duration-300 group-hover:rotate-12" />
                  <span className="font-medium">{user.name}</span>
                  <ChevronDown className={`h-4 w-4 transition-transform duration-300 
                    ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg py-2 border 
                              border-gray-100 animate-fade-in-down">
                    <Link
                      to="/user/dashboard"
                      className="flex items-center px-4 py-3 text-gray-700 hover:bg-red-50 
                               hover:text-red-600 transition-all duration-300 group"
                    >
                      <User className="h-5 w-5 mr-3 transition-transform duration-300 group-hover:rotate-12" />
                      <div>
                        <div className="font-medium">User Dashboard</div>
                        <div className="text-xs text-gray-500">Manage your account</div>
                      </div>
                    </Link>
                    <div className="border-t border-gray-100 my-1"></div>
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-3 text-gray-700 hover:bg-red-50 
                               hover:text-red-600 transition-all duration-300 group"
                    >
                      <LogOut className="h-5 w-5 mr-3 transition-transform duration-300 group-hover:rotate-12" />
                      <div>
                        <div className="font-medium">Logout</div>
                        <div className="text-xs text-gray-500">Sign out of your account</div>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="ml-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 
                         transition-all duration-300 transform hover:scale-105 
                         shadow-sm hover:shadow-md animate-fade-in-up"
              >
                Login
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100 
                     transition-all duration-300 transform hover:scale-105"
          >
            {isOpen ? (
              <X className="h-6 w-6 animate-rotate-in" />
            ) : (
              <Menu className="h-6 w-6 animate-rotate-in" />
            )}
          </button>
        </div>

        {/* Mobile Navigation Menu */}
        <div
          className={`md:hidden absolute top-16 left-0 right-0 bg-white border-t border-gray-100 
                      shadow-lg transition-all duration-300 ease-in-out ${
            isOpen 
              ? 'translate-y-0 opacity-100'
              : '-translate-y-2 opacity-0 pointer-events-none'
          }`}
        >
          <div className="flex flex-col p-4 space-y-2">
            {visibleNavigationItems.map((item, index) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg
                  transition-all duration-300 transform hover:scale-102 group
                  animate-fade-in-up group
                  ${isActivePath(item.path)
                    ? 'bg-red-50 text-red-600 shadow-sm'
                    : 'text-gray-700 hover:bg-red-50 hover:text-red-600'
                  }`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="transform transition-transform duration-300 group-hover:rotate-12">
                  {item.icon}
                </div>
                <span>{item.label}</span>
              </Link>
            ))}

            {user ? (
              <>
                <div className="border-t border-gray-100 pt-2 animate-fade-in-up"
                    style={{ animationDelay: `${visibleNavigationItems.length * 100}ms` }}>
                </div>
                <Link
                  to="/user/dashboard"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center space-x-3 px-4 py-3 text-gray-700 
                          hover:bg-red-50 hover:text-red-600 rounded-lg
                          transition-all duration-300 transform hover:scale-102
                          group animate-fade-in-up"
                  style={{ animationDelay: `${(visibleNavigationItems.length + 1) * 100}ms` }}
                >
                  <User className="h-5 w-5 transition-transform duration-300 group-hover:rotate-12" />
                  <span>User Dashboard</span>
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsOpen(false);
                  }}
                  className="flex items-center space-x-3 px-4 py-3 text-gray-700 
                          hover:bg-red-50 hover:text-red-600 rounded-lg w-full text-left
                          transition-all duration-300 transform hover:scale-102
                          group animate-fade-in-up"
                  style={{ animationDelay: `${(visibleNavigationItems.length + 2) * 100}ms` }}
                >
                  <LogOut className="h-5 w-5 transition-transform duration-300 group-hover:rotate-12" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <Link
                to="/login"
                onClick={() => setIsOpen(false)}
                className="flex justify-center px-4 py-3 bg-red-600 text-white rounded-lg 
                        hover:bg-red-700 transition-all duration-300 transform 
                        hover:scale-105 shadow-sm hover:shadow-md animate-fade-in-up"
                style={{ animationDelay: `${(visibleNavigationItems.length + 1) * 100}ms` }}
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;