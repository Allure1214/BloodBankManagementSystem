import { API_BASE_URL } from '../../config/api.js';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useState, useEffect } from 'react';
import AccessDenied from './AccessDenied';

// Regular user protected route
export const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-white">
        <div className="w-16 h-16 relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200"></div>
          <div className="absolute top-0 left-0 h-16 w-16 border-t-4 border-red-600 rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

// Admin protected route with permission checking
export const AdminRoute = ({ children, requiredPermission }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [hasPermission, setHasPermission] = useState(false);
  const [permissionLoading, setPermissionLoading] = useState(true);

  useEffect(() => {
    const checkPermission = async () => {
      if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
        setPermissionLoading(false);
        return;
      }

      try {
        // Superadmin has all permissions
        if (user.role === 'superadmin') {
          setHasPermission(true);
          setPermissionLoading(false);
          return;
        }

        // Check specific permission for regular admin
        if (requiredPermission) {
          const response = await fetch(`${API_BASE_URL}/admin/users/permissions`, {
            headers: {
              'Authorization': `Bearer ${sessionStorage.getItem('token')}`
            }
          });
          
          const data = await response.json();
          if (data.success) {
            setHasPermission(data.permissions[requiredPermission]);
          }
        } else {
          // If no specific permission required, just check if admin
          setHasPermission(true);
        }
      } catch (error) {
        console.error('Error checking permissions:', error);
        setHasPermission(false);
      }
      setPermissionLoading(false);
    };

    checkPermission();
  }, [user, requiredPermission]);

  if (loading || permissionLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-white">
        <div className="w-16 h-16 relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200"></div>
          <div className="absolute top-0 left-0 h-16 w-16 border-t-4 border-red-600 rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  // Check if user is not logged in
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user is not an admin or superadmin
  if (user.role !== 'admin' && user.role !== 'superadmin') {
    return <Navigate to="/user/dashboard" replace />;
  }

  // Check specific permissions for regular admin
  if (user.role === 'admin' && requiredPermission && !hasPermission) {
    return <AccessDenied />;
  }

  return children;
};

// SuperAdmin only route
export const SuperAdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-white">
        <div className="w-16 h-16 relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200"></div>
          <div className="absolute top-0 left-0 h-16 w-16 border-t-4 border-red-600 rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'superadmin') {
    return <AccessDenied />;
  }

  return children;
};