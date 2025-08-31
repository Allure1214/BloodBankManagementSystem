import React, { useState, useEffect } from 'react';
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
  UserCircle
} from 'lucide-react';

const SidebarLink = ({ icon: Icon, title, path, isActive }) => (
  <Link
    to={path}
    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-[1.02]
      ${isActive 
        ? 'bg-red-50 text-red-600 shadow-sm translate-x-2' 
        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
      }`}
  >
    <div className={`p-1.5 rounded-md transition-all duration-300 ease-in-out transform
      ${isActive 
        ? 'bg-red-100 scale-110' 
        : 'bg-gray-100 group-hover:bg-gray-200'}`}
    >
      <Icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? 'scale-110' : ''}`} />
    </div>
    <span className="font-medium">{title}</span>
    {isActive && (
      <div className="w-1.5 h-1.5 rounded-full bg-red-500 ml-auto animate-pulse" />
    )}
  </Link>
);

const AdminDashboardLayout = ({ children }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [permissions, setPermissions] = useState(null);
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    document.body.classList.add('admin-layout');
    return () => {
      document.body.classList.remove('admin-layout');
    };
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
      { title: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' }
    ];
  
    const permissionBasedItems = [
      {
        title: 'Users',
        icon: Users,
        path: '/admin/users',
        requiredPermission: 'can_manage_users',
        superAdminOnly: true
      },
      {
        title: 'Blood Inventory',
        icon: Database,
        path: '/admin/inventory',
        requiredPermission: 'can_manage_inventory'
      },
      {
        title: 'Blood Banks',
        icon: Building2,
        path: '/admin/blood-banks',
        requiredPermission: 'can_manage_blood_banks'
      },
      {
        title: 'Campaign',
        icon: Calendar,
        path: '/admin/campaigns',
        requiredPermission: 'can_manage_campaigns'
      },
      {
        title: 'Donations',
        icon: Droplet,
        path: '/admin/donations',
        requiredPermission: 'can_manage_donations'
      },
      {
        title: 'Appointments',
        icon: ClipboardList,
        path: '/admin/appointments',
        requiredPermission: 'can_manage_appointments'
      },
      {
        title: 'Reports',
        icon: Activity,
        path: '/admin/reports',
        requiredPermission: 'can_manage_reports',
      }
    ];
  
    const filteredItems = permissionBasedItems.filter(item => {
      if (!permissions) return false;
      if (user?.role === 'superadmin') return true;
      if (item.superAdminOnly && user?.role !== 'superadmin') return false;
      return permissions[item.requiredPermission];
    });
  
    const commonItems = [
      { title: 'Notifications', icon: Bell, path: '/admin/notifications' }
    ];
  
    const superAdminItems = user?.role === 'superadmin' ? [
      { title: 'Settings', icon: Settings, path: '/admin/settings' }
    ] : [];
  
    return [...baseItems, ...filteredItems, ...commonItems, ...superAdminItems];
  };  

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (!permissions) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-white">
        <div className="w-16 h-16 relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200"></div>
          <div className="absolute top-0 left-0 h-16 w-16 border-t-4 border-red-600 rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }
  const overlayClasses = `fixed inset-0 bg-black transition-opacity duration-300 lg:hidden
    ${isSidebarOpen ? 'opacity-50' : 'opacity-0 pointer-events-none'}`;

    return (
      <div className="min-h-screen bg-gray-50">
        {/* Sidebar with slide and fade animations */}
        <aside 
          className={`fixed top-0 left-0 z-40 w-64 h-full bg-white shadow-lg transform 
            transition-all duration-300 ease-in-out
            ${isSidebarOpen ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'} 
            lg:translate-x-0 lg:opacity-100`}
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
  
          {/* Navigation with smooth transitions */}
          <div className="h-[calc(100vh-4rem)] flex flex-col">
            <div className="flex-1 overflow-y-auto px-4 py-6">
              <nav className="space-y-2">
                {getNavigationItems().map((item, index) => (
                  <div
                    key={item.path}
                    className="transform transition-all duration-300"
                    style={{
                      transitionDelay: `${index * 50}ms`,
                      opacity: isSidebarOpen ? 1 : 0,
                      transform: isSidebarOpen ? 'translateX(0)' : 'translateX(-20px)'
                    }}
                  >
                    <SidebarLink
                      icon={item.icon}
                      title={item.title}
                      path={item.path}
                      isActive={location.pathname === item.path}
                    />
                  </div>
                ))}
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
        <div className="lg:ml-64 min-h-screen flex flex-col transition-all duration-300">
          {/* Header with animations */}
          <header className="fixed top-0 right-0 left-0 lg:left-64 bg-white border-b z-30
            transition-transform duration-300">
            <div className="h-16 px-4 flex items-center justify-between gap-4">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100
                  transition-all duration-200 hover:scale-105"
              >
                <Menu className="h-6 w-6" />
              </button>
  
              {/* Role Badge with pulse animation */}
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-xs font-medium
                  transition-all duration-300 hover:shadow-md
                  ${user?.role === 'superadmin' 
                    ? 'bg-purple-100 text-purple-800 hover:bg-purple-200' 
                    : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                  }`}>
                  {user?.role === 'superadmin' ? 'Super Admin' : 'Admin'}
                </span>
              </div>
  
              {/* User Dropdown with smooth transitions */}
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100
                    transition-all duration-200"
                >
                  <span className="font-medium text-gray-700">{user?.name}</span>
                  <ChevronDown 
                    className={`w-4 h-4 text-gray-500 transition-transform duration-300
                      ${isDropdownOpen ? 'rotate-180' : ''}`} 
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
                >
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-2 text-gray-700
                      hover:bg-red-50 hover:text-red-600 transition-colors duration-200"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            </div>
          </header>
  
          {/* Main Content with fade animation */}
          <main className="flex-1 p-6 mt-16 transition-opacity duration-300">
            {children}
          </main>
  
          {/* Footer */}
          <footer className="py-4 px-6 text-center text-sm text-gray-500 border-t bg-white">
            © {new Date().getFullYear()} LifeLink Blood Bank. All rights reserved.
          </footer>
        </div>
      </div>
    );
  };
  
  export default AdminDashboardLayout;