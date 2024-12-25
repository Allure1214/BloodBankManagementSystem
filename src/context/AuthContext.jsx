// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../api/client';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = sessionStorage.getItem('token');
      if (token) {
        // Add Bearer prefix when setting header
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        const response = await apiClient.get('/auth/me');
        if (response.data.success) {
          setUser(response.data.user);
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      sessionStorage.removeItem('token');
      delete apiClient.defaults.headers.common['Authorization'];
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await apiClient.post('/auth/login', { email, password });
      const { token, user: userData } = response.data;
      
      // Ensure we store with Bearer prefix
      sessionStorage.setItem('token', token); // Store raw token
      // Set Bearer token in axios headers
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      setUser(userData);
      return userData;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };  

  const logout = () => {
    // Clear from sessionStorage instead of localStorage
    sessionStorage.removeItem('token');
    delete apiClient.defaults.headers.common['Authorization'];
    setUser(null);
  };


  const updateUserProfile = (updatedData) => {
    setUser(prevUser => ({
      ...prevUser,
      ...updatedData
    }));
  };

  const value = {
    user,
    loading,
    login,
    updateUserProfile,
    logout,
    checkAuthStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
