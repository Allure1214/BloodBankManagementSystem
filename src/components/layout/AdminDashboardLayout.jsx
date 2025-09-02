import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Menu,
  X,
  LayoutDashboard,
  Users,
  Database,
  Building2,
  Calendar,
  Bell,
  Settings,
  LogOut,
  Droplet,
  ClipboardList,
  ChevronDown,
  Activity,
  ShieldCheck,
  UserCircle,
  MessageSquare,
  Search,
  Home,
  ChevronRight
} from 'lucide-react';

const SidebarLink = ({ icon: Icon, title, path, isActive, badge }) => (
  <Link
    to={path}
    className={`group flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 relative overflow-hidden
      ${isActive 
        ? 'bg-gradient-to-r from-red-50 to-red-100 text-red-600 shadow-sm translate-x-2 border-l-4 border-red-500' 
        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:shadow-sm'
      }`}
    aria-current={isActive ? 'page' : undefined}
    aria-label={`Navigate to ${title}`}
  >
    {/* Hover effect background */}
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    
    <div className={`p-1.5 rounded-md transition-all duration-300 ease-in-out transform relative z-10
      ${isActive 
        ? 'bg-red-100 scale-110 shadow-sm' 
        : 'bg-gray-100 group-hover:bg-gray-200 group-hover:scale-105'}`}
    >
      <Icon className={`w-5 h-5 transition-all duration-300 ${isActive ? 'scale-110 text-red-600' : 'text-gray-600 group-hover:text-gray-800'}`} aria-hidden="true" />
    </div>
    <span className="font-medium flex-1 relative z-10">{title}</span>
    {badge && (
      <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-600 rounded-full relative z-10 animate-pulse">
        {badge}
      </span>
    )}
    {isActive && (
      <div className="w-1.5 h-1.5 rounded-full bg-red-500 ml-auto animate-pulse relative z-10" aria-hidden="true" />
    )}
  </Link>
);

// Breadcrumb Component
const Breadcrumb = ({ pathname }) => {
  const pathSegments = pathname.split('/').filter(Boolean);
  const breadcrumbItems = pathSegments.map((segment, index) => {
    const path = '/' + pathSegments.slice(0, index + 1).join('/');
    const title = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
    return { title, path, isLast: index === pathSegments.length - 1 };
  });

  return (
    <nav className="flex items-center space-x-2 text-sm" aria-label="Breadcrumb">
      <Link 
        to="/admin/dashboard" 
        className="flex items-center text-gray-500 hover:text-gray-700 transition-colors"
        aria-label="Go to dashboard"
      >
        <Home className="w-4 h-4" aria-hidden="true" />
      </Link>
      {breadcrumbItems.map((item, index) => (
        <React.Fragment key={item.path}>
          <ChevronRight className="w-4 h-4 text-gray-400" aria-hidden="true" />
          {item.isLast ? (
            <span className="text-gray-900 font-medium" aria-current="page">
              {item.title}
            </span>
          ) : (
            <Link 
              to={item.path} 
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              {item.title}
            </Link>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

const AdminDashboardLayout = ({ children }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [permissions, setPermissions] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [notifications, setNotifications] = useState({ messages: 3, notifications: 1 });
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef(null);
  const searchRef = useRef(null);

  useEffect(() => {
    document.body.classList.add('admin-layout');
    return () => {
      document.body.classList.remove('admin-layout');
    };
  }, []);

  // Keyboard navigation and focus management
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        if (isDropdownOpen) {
          setIsDropdownOpen(false);
        }
        if (isSearchFocused) {
          searchRef.current?.blur();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isDropdownOpen, isSearchFocused]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch permissions
  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/admin/users/permissions', {
          headers: {
            'Authorization': `Bearer ${sessionStorage.getItem('token')}`
          }
        });
        const data = await response.json();
        if (data.success) {
          setPermissions(data.permissions);
        }
      } catch (error) {
        console.error('Error fetching permissions:', error);
      }
    };

    fetchPermissions();
  }, []);

  const getNavigationItems = () => {
    const baseItems = [
      { title: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard', keywords: ['dashboard', 'overview', 'home'] }
    ];
  
    const permissionBasedItems = [
      {
        title: 'Users',
        icon: Users,
        path: '/admin/users',
        requiredPermission: 'can_manage_users',
        superAdminOnly: true,
        keywords: ['users', 'accounts', 'members', 'people']
      },
      {
        title: 'Blood Inventory',
        icon: Database,
        path: '/admin/inventory',
        requiredPermission: 'can_manage_inventory',
        keywords: ['inventory', 'blood', 'stock', 'supply', 'storage']
      },
      {
        title: 'Blood Banks',
        icon: Building2,
        path: '/admin/blood-banks',
        requiredPermission: 'can_manage_blood_banks',
        keywords: ['blood banks', 'centers', 'locations', 'facilities']
      },
      {
        title: 'Campaigns',
        icon: Calendar,
        path: '/admin/campaigns',
        requiredPermission: 'can_manage_campaigns',
        keywords: ['campaigns', 'events', 'drives', 'schedules']
      },
      {
        title: 'Donations',
        icon: Droplet,
        path: '/admin/donations',
        requiredPermission: 'can_manage_donations',
        keywords: ['donations', 'blood donations', 'donors', 'donating']
      },
      {
        title: 'Appointments',
        icon: ClipboardList,
        path: '/admin/appointments',
        requiredPermission: 'can_manage_appointments',
        keywords: ['appointments', 'bookings', 'schedules', 'meetings']
      },
      {
        title: 'Reports',
        icon: Activity,
        path: '/admin/reports',
        requiredPermission: 'can_manage_reports',
        keywords: ['reports', 'analytics', 'statistics', 'data']
      }
    ];
  
    const filteredItems = permissionBasedItems.filter(item => {
      if (!permissions) return false;
      if (user?.role === 'superadmin') return true;
      if (item.superAdminOnly && user?.role !== 'superadmin') return false;
      return permissions[item.requiredPermission];
    });
  
    const commonItems = [
      { 
        title: 'Messages', 
        icon: MessageSquare, 
        path: '/admin/messages', 
        keywords: ['messages', 'chat', 'communication', 'inbox'],
      },
      { 
        title: 'Notifications', 
        icon: Bell, 
        path: '/admin/notifications', 
        keywords: ['notifications', 'alerts', 'updates', 'reminders'],
      }
    ];
  
    const superAdminItems = user?.role === 'superadmin' ? [
      { title: 'Settings', icon: Settings, path: '/admin/settings', keywords: ['settings', 'configuration', 'preferences', 'options'] }
    ] : [];
  
    const allItems = [...baseItems, ...filteredItems, ...commonItems, ...superAdminItems];
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      return allItems.filter(item => 
        item.title.toLowerCase().includes(query) ||
        item.keywords.some(keyword => keyword.includes(query))
      );
    }
    
    return allItems;
  };  

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Skeleton Loading Component
  const SkeletonLoader = () => (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar Skeleton */}
      <aside className="fixed top-0 left-0 z-40 w-64 h-full bg-white shadow-lg">
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-200 rounded-lg animate-pulse"></div>
            <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
        <div className="h-[calc(100vh-4rem)] flex flex-col">
          <div className="flex-1 overflow-y-auto px-4 py-6">
            <div className="space-y-2">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-8 h-8 bg-gray-200 rounded-md animate-pulse"></div>
                  <div className="w-24 h-4 bg-gray-200 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>
          <div className="p-4 border-t border-gray-100">
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
              <div className="flex-1">
                <div className="w-20 h-3 bg-gray-200 rounded animate-pulse mb-1"></div>
                <div className="w-32 h-2 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </aside>
      
      {/* Main Content Skeleton */}
      <div className="lg:ml-64 min-h-screen">
        <header className="fixed top-0 right-0 left-0 lg:left-64 bg-white border-b z-30">
          <div className="h-16 px-4 flex items-center justify-between">
            <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
            <div className="flex items-center gap-3">
              <div className="w-20 h-6 bg-gray-200 rounded-full animate-pulse"></div>
              <div className="w-24 h-8 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </header>
        <main className="flex-1 p-6 mt-16">
          <div className="space-y-4">
            <div className="w-48 h-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white p-6 rounded-lg shadow-sm border">
                  <div className="w-full h-32 bg-gray-200 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );

  if (!permissions) {
    return <SkeletonLoader />;
  }
  const overlayClasses = `fixed inset-0 bg-black transition-opacity duration-300 lg:hidden
    ${isSidebarOpen ? 'opacity-50' : 'opacity-0 pointer-events-none'}`;

    return (
      <div className="min-h-screen bg-gray-50">
        {/* Sidebar with slide and fade animations */}
        <aside 
          className={`fixed top-0 left-0 z-40 w-64 sm:w-72 h-full bg-white shadow-lg transform 
            transition-all duration-300 ease-in-out
            ${isSidebarOpen ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'} 
            lg:translate-x-0 lg:opacity-100`}
          role="navigation"
          aria-label="Main navigation"
        >
          {/* Logo Section with hover effect */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-gray-100">
            <Link 
              to="/admin/dashboard" 
              className="flex items-center gap-2 transition-transform duration-200 hover:scale-105"
            >
              <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center
                transition-all duration-300 hover:shadow-lg hover:bg-red-700">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-900">LifeLink</span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-500 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100
                transition-colors duration-200"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
  
          {/* Search Section */}
          <div className="px-4 py-4 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" aria-hidden="true" />
              <input
                ref={searchRef}
                type="text"
                placeholder="Search navigation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                className={`w-full pl-10 pr-4 py-2 text-sm border rounded-lg 
                  focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent
                  transition-all duration-200 transform
                  ${isSearchFocused 
                    ? 'border-red-300 shadow-md scale-[1.02]' 
                    : 'border-gray-200 hover:border-gray-300'
                  }`}
                aria-label="Search navigation items"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600
                    transition-colors duration-200"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Navigation with smooth transitions */}
          <div className="h-[calc(100vh-8rem)] flex flex-col">
            <div className="flex-1 overflow-y-auto px-4 py-6">
              <nav className="space-y-2" role="list">
                {getNavigationItems().length > 0 ? (
                  getNavigationItems().map((item, index) => (
                    <div
                      key={item.path}
                      className="transform transition-all duration-300"
                      style={{
                        transitionDelay: `${index * 50}ms`,
                        opacity: isSidebarOpen ? 1 : 0,
                        transform: isSidebarOpen ? 'translateX(0)' : 'translateX(-20px)'
                      }}
                      role="listitem"
                    >
                      <SidebarLink
                        icon={item.icon}
                        title={item.title}
                        path={item.path}
                        isActive={location.pathname === item.path}
                        badge={item.badge}
                      />
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Search className="w-8 h-8 text-gray-300 mx-auto mb-2" aria-hidden="true" />
                    <p className="text-sm text-gray-500">No items found</p>
                    <p className="text-xs text-gray-400 mt-1">Try a different search term</p>
                  </div>
                )}
              </nav>
            </div>
  
            {/* User Profile Section with hover effect */}
            <div className="p-4 border-t border-gray-100">
              <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-50
                transition-all duration-200 hover:bg-gray-100 hover:shadow-md">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center
                  transition-transform duration-200 hover:scale-110">
                  <UserCircle className="w-6 h-6 text-red-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
                  <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                </div>
              </div>
            </div>
          </div>
        </aside>
  
        {/* Backdrop overlay with fade animation */}
        <div className={overlayClasses} onClick={() => setSidebarOpen(false)} />
  
        {/* Main Content Area */}
        <div className="lg:ml-64 xl:ml-72 min-h-screen flex flex-col transition-all duration-300">
          {/* Header with animations */}
          <header className="fixed top-0 right-0 left-0 lg:left-64 xl:left-72 bg-white border-b z-30
            transition-transform duration-300">
            <div className="h-16 px-4 flex items-center justify-between gap-4">
              {/* Left Section: Mobile Menu + Breadcrumb */}
              <div className="flex items-center gap-4 flex-1 min-w-0">
                {/* Mobile Menu Button */}
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100
                    transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500"
                  aria-label="Open navigation menu"
                >
                  <Menu className="h-6 w-6" />
                </button>
                
                {/* Breadcrumb Navigation */}
                <div className="hidden sm:block flex-1 min-w-0">
                  <Breadcrumb pathname={location.pathname} />
                </div>
              </div>
  
              {/* Right Section: Role Badge + User Dropdown */}
              <div className="flex items-center gap-3">
                {/* Role Badge with pulse animation */}
                <span className={`px-3 py-1 rounded-full text-xs font-medium
                  transition-all duration-300 hover:shadow-md
                  ${user?.role === 'superadmin' 
                    ? 'bg-purple-100 text-purple-800 hover:bg-purple-200' 
                    : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                  }`}
                  aria-label={`User role: ${user?.role === 'superadmin' ? 'Super Admin' : 'Admin'}`}
                >
                  {user?.role === 'superadmin' ? 'Super Admin' : 'Admin'}
                </span>
  
                {/* User Dropdown with smooth transitions */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100
                      transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                    aria-expanded={isDropdownOpen}
                    aria-haspopup="true"
                    aria-label="User menu"
                  >
                    <span className="font-medium text-gray-700 truncate max-w-32">{user?.name}</span>
                    <ChevronDown 
                      className={`w-4 h-4 text-gray-500 transition-transform duration-300
                        ${isDropdownOpen ? 'rotate-180' : ''}`} 
                      aria-hidden="true"
                    />
                  </button>
  
                  {/* Dropdown menu with fade and scale animation */}
                  <div
                    className={`absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50
                      transition-all duration-200 origin-top-right
                      ${isDropdownOpen 
                        ? 'transform opacity-100 scale-100' 
                        : 'transform opacity-0 scale-95 pointer-events-none'
                      }`}
                    role="menu"
                    aria-orientation="vertical"
                  >
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2 text-gray-700
                        hover:bg-red-50 hover:text-red-600 transition-colors duration-200
                        focus:outline-none focus:bg-red-50 focus:text-red-600"
                      role="menuitem"
                    >
                      <LogOut className="h-4 w-4 mr-2" aria-hidden="true" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </header>
  
          {/* Main Content with fade animation */}
          <main className="flex-1 p-4 sm:p-6 mt-16 transition-opacity duration-300">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
  
          {/* Footer */}
          <footer className="py-4 px-4 sm:px-6 text-center text-sm text-gray-500 border-t bg-white">
            <div className="max-w-7xl mx-auto">
              © {new Date().getFullYear()} LifeLink Blood Bank. All rights reserved.
            </div>
          </footer>
        </div>
      </div>
    );
  };
  
  export default AdminDashboardLayout;