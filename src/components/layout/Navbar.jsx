import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Menu, 
  X, 
  ChevronDown, 
  LogOut, 
  User, 
  Home, 
  Calendar, 
  Activity, 
  UserPlus, 
  Search,
  Bell,
  MessageSquare,
  Settings,
  Heart
} from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mounted, setMounted] = useState(false);
  const dropdownRef = useRef(null);
  const searchRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const navigationItems = [
    { path: '/', label: 'Home', icon: <Home className="w-5 h-5" />, keywords: ['home', 'main', 'landing'] },
    { path: '/campaigns', label: 'Campaigns', icon: <Calendar className="w-5 h-5" />, keywords: ['campaigns', 'events', 'drives'] },
    { path: '/dashboard', label: 'Blood Bank Dashboard', icon: <Activity className="w-5 h-5" />, keywords: ['dashboard', 'blood bank', 'overview'] },
    { path: '/register', label: 'Donor Registration', icon: <UserPlus className="w-5 h-5" />, keywords: ['register', 'donor', 'signup', 'join'] },
  ];

  const getSearchableItems = () => {
    const baseItems = [
      { path: '/', label: 'Home', icon: <Home className="w-4 h-4" />, keywords: ['home', 'main', 'landing'] },
      { path: '/campaigns', label: 'Campaigns', icon: <Calendar className="w-4 h-4" />, keywords: ['campaigns', 'events', 'drives', 'blood drives'] },
      { path: '/dashboard', label: 'Blood Bank Dashboard', icon: <Activity className="w-4 h-4" />, keywords: ['dashboard', 'blood bank', 'overview', 'statistics'] },
      { path: '/about', label: 'About Us', icon: <Heart className="w-4 h-4" />, keywords: ['about', 'us', 'information', 'company'] },
      { path: '/contact', label: 'Contact Us', icon: <MessageSquare className="w-4 h-4" />, keywords: ['contact', 'help', 'support', 'reach'] },
    ];

    // Add user-specific items based on login status
    if (user) {
      // User is logged in - show user dashboard, hide registration and login
      return [
        ...baseItems,
        { path: '/user/dashboard', label: 'User Dashboard', icon: <User className="w-4 h-4" />, keywords: ['user', 'dashboard', 'profile', 'account'] },
      ];
    } else {
      // User is not logged in - show registration and login, hide user dashboard
      return [
        ...baseItems,
        { path: '/register', label: 'Donor Registration', icon: <UserPlus className="w-4 h-4" />, keywords: ['register', 'donor', 'signup', 'join', 'registration'] },
        { path: '/login', label: 'Login', icon: <User className="w-4 h-4" />, keywords: ['login', 'signin', 'account', 'access'] },
      ];
    }
  };

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

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsDropdownOpen(false);
        setIsSearchOpen(false);
        setSearchQuery('');
      }
      if (event.key === '/' && event.ctrlKey) {
        event.preventDefault();
        setIsSearchOpen(true);
        searchRef.current?.focus();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const filteredSearchResults = searchQuery.trim() 
    ? getSearchableItems().filter(item => 
        item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.keywords.some(keyword => keyword.includes(searchQuery.toLowerCase()))
      )
    : [];

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
    <nav className={`fixed top-0 left-0 right-0 bg-white shadow-lg z-[10000] transition-transform duration-300
                    ${mounted ? 'translate-y-0' : '-translate-y-full'}`}
         role="navigation" 
         aria-label="Main navigation">
      <div className="max-w-10xl mx-auto px-4">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <Link 
            to="/" 
            className="flex items-center space-x-2 text-xl font-bold text-red-600 hover:text-red-700 
                     transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded-lg"
            aria-label="LifeLink Blood Bank - Go to homepage"
          >
            <img 
              src="/favicon.svg" 
              alt="LifeLink Blood Bank Logo" 
              className="h-8 w-8 transition-transform duration-300 hover:rotate-12"
            />
            <span className="bg-gradient-to-r from-red-600 to-red-500 bg-clip-text text-transparent">
              LifeLink Blood Bank
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {/* Search Button */}
            <div className="relative">
              <button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-all duration-300
                  transform hover:scale-105 group
                  ${isSearchOpen 
                    ? 'bg-red-50 text-red-600 shadow-sm' 
                    : 'text-gray-700 hover:bg-red-50 hover:text-red-600'}`}
                aria-label="Search navigation"
                aria-expanded={isSearchOpen}
              >
                <Search className="w-4 h-4 transition-transform duration-300 group-hover:rotate-12" />
                <span className="text-sm">Search</span>
                <kbd className="hidden lg:inline-flex items-center px-1.5 py-0.5 text-xs font-medium text-gray-500 bg-gray-100 border border-gray-200 rounded">
                  ⌘/
                </kbd>
              </button>

              {/* Search Dropdown */}
              {isSearchOpen && (
                <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-100 py-2 z-50 animate-fade-in-down">
                  <div className="px-3 pb-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        ref={searchRef}
                        type="text"
                        placeholder="Search pages..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg 
                          focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        aria-label="Search navigation items"
                      />
                    </div>
                  </div>
                  
                  {searchQuery.trim() && (
                    <div className="max-h-64 overflow-y-auto">
                      {filteredSearchResults.length > 0 ? (
                        filteredSearchResults.map((item, index) => (
                          <Link
                            key={item.path}
                            to={item.path}
                            onClick={() => {
                              setIsSearchOpen(false);
                              setSearchQuery('');
                            }}
                            className="flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-red-50 
                              hover:text-red-600 transition-colors duration-200"
                          >
                            {item.icon}
                            <span className="text-sm">{item.label}</span>
                          </Link>
                        ))
                      ) : (
                        <div className="px-3 py-4 text-center text-gray-500 text-sm">
                          No results found for "{searchQuery}"
                        </div>
                      )}
                    </div>
                  )}
                  
                  {!searchQuery.trim() && (
                    <div className="px-3 py-4 text-center text-gray-500 text-sm">
                      Type to search pages and features
                    </div>
                  )}
                </div>
              )}
            </div>

            {visibleNavigationItems.map((item, index) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-1 px-4 py-2 rounded-lg transition-all duration-300
                  transform hover:scale-105 group animate-fade-in-up focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2
                  ${isActivePath(item.path)
                    ? 'bg-red-50 text-red-600 shadow-sm'
                    : 'text-gray-700 hover:bg-red-50 hover:text-red-600'}`}
                style={{ animationDelay: `${index * 100}ms` }}
                aria-current={isActivePath(item.path) ? 'page' : undefined}
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
                    transform hover:scale-105 group focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2
                    ${isDropdownOpen 
                      ? 'bg-red-50 text-red-600 shadow-sm' 
                      : 'text-gray-700 hover:bg-red-50 hover:text-red-600'}`}
                  aria-expanded={isDropdownOpen}
                  aria-haspopup="true"
                  aria-label="User menu"
                >
                  <User className="w-5 h-5 transition-transform duration-300 group-hover:rotate-12" />
                  <span className="font-medium truncate max-w-32">{user.name}</span>
                  <ChevronDown className={`h-4 w-4 transition-transform duration-300 
                    ${isDropdownOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
                </button>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg py-2 border 
                              border-gray-100 animate-fade-in-down z-50" role="menu" aria-orientation="vertical">
                    <Link
                      to="/user/dashboard"
                      className="flex items-center px-4 py-3 text-gray-700 hover:bg-red-50 
                               hover:text-red-600 transition-all duration-300 group focus:outline-none focus:bg-red-50 focus:text-red-600"
                      role="menuitem"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      <User className="h-5 w-5 mr-3 transition-transform duration-300 group-hover:rotate-12" aria-hidden="true" />
                      <div>
                        <div className="font-medium">User Dashboard</div>
                        <div className="text-xs text-gray-500">Manage your account</div>
                      </div>
                    </Link>
                    <div className="border-t border-gray-100 my-1" aria-hidden="true"></div>
                    <button
                      onClick={() => {
                        handleLogout();
                        setIsDropdownOpen(false);
                      }}
                      className="flex items-center w-full px-4 py-3 text-gray-700 hover:bg-red-50 
                               hover:text-red-600 transition-all duration-300 group focus:outline-none focus:bg-red-50 focus:text-red-600"
                      role="menuitem"
                    >
                      <LogOut className="h-5 w-5 mr-3 transition-transform duration-300 group-hover:rotate-12" aria-hidden="true" />
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
                     transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={isOpen}
          >
            {isOpen ? (
              <X className="h-6 w-6 animate-rotate-in" aria-hidden="true" />
            ) : (
              <Menu className="h-6 w-6 animate-rotate-in" aria-hidden="true" />
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
          role="menu"
          aria-label="Mobile navigation menu"
        >
          <div className="flex flex-col p-4 space-y-2">
            {/* Mobile Search */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" aria-hidden="true" />
                <input
                  type="text"
                  placeholder="Search pages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg 
                    focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  aria-label="Search navigation items"
                />
              </div>
              
              {/* Mobile Search Results */}
              {searchQuery.trim() && (
                <div className="mt-2 max-h-48 overflow-y-auto bg-gray-50 rounded-lg">
                  {filteredSearchResults.length > 0 ? (
                    filteredSearchResults.map((item) => (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => {
                          setIsOpen(false);
                          setSearchQuery('');
                        }}
                        className="flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-red-50 
                          hover:text-red-600 transition-colors duration-200"
                      >
                        {item.icon}
                        <span className="text-sm">{item.label}</span>
                      </Link>
                    ))
                  ) : (
                    <div className="px-3 py-4 text-center text-gray-500 text-sm">
                      No results found
                    </div>
                  )}
                </div>
              )}
            </div>
            {visibleNavigationItems.map((item, index) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg
                  transition-all duration-300 transform hover:scale-102 group
                  animate-fade-in-up group focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2
                  ${isActivePath(item.path)
                    ? 'bg-red-50 text-red-600 shadow-sm'
                    : 'text-gray-700 hover:bg-red-50 hover:text-red-600'
                  }`}
                style={{ animationDelay: `${index * 100}ms` }}
                aria-current={isActivePath(item.path) ? 'page' : undefined}
                role="menuitem"
              >
                <div className="transform transition-transform duration-300 group-hover:rotate-12" aria-hidden="true">
                  {item.icon}
                </div>
                <span>{item.label}</span>
              </Link>
            ))}

            {user ? (
              <>
                <div className="border-t border-gray-100 pt-2 animate-fade-in-up"
                    style={{ animationDelay: `${visibleNavigationItems.length * 100}ms` }} aria-hidden="true">
                </div>
                <Link
                  to="/user/dashboard"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center space-x-3 px-4 py-3 text-gray-700 
                          hover:bg-red-50 hover:text-red-600 rounded-lg
                          transition-all duration-300 transform hover:scale-102
                          group animate-fade-in-up focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                  style={{ animationDelay: `${(visibleNavigationItems.length + 1) * 100}ms` }}
                  role="menuitem"
                >
                  <User className="h-5 w-5 transition-transform duration-300 group-hover:rotate-12" aria-hidden="true" />
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
                          group animate-fade-in-up focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                  style={{ animationDelay: `${(visibleNavigationItems.length + 2) * 100}ms` }}
                  role="menuitem"
                >
                  <LogOut className="h-5 w-5 transition-transform duration-300 group-hover:rotate-12" aria-hidden="true" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <Link
                to="/login"
                onClick={() => setIsOpen(false)}
                className="flex justify-center px-4 py-3 bg-red-600 text-white rounded-lg 
                        hover:bg-red-700 transition-all duration-300 transform 
                        hover:scale-105 shadow-sm hover:shadow-md animate-fade-in-up
                        focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                style={{ animationDelay: `${(visibleNavigationItems.length + 1) * 100}ms` }}
                role="menuitem"
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