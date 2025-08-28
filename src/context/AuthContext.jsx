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
      // Check both sessionStorage and localStorage for tokens
      let token = sessionStorage.getItem('token') || localStorage.getItem('token');
      
      if (token) {
        console.log('Token found, checking auth status...');
        // Don't manually set headers - let the interceptor handle it
        const response = await apiClient.get('/auth/me');
        if (response.data.success) {
          setUser(response.data.user);
          console.log('User authenticated:', response.data.user);
        }
      } else {
        console.log('No token found');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      // Clear tokens from both storages on auth failure
      sessionStorage.removeItem('token');
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password, rememberMe = false) => {
    try {
      console.log('Logging in with rememberMe:', rememberMe);
      const response = await apiClient.post('/auth/login', { email, password });
      const { token, user: userData } = response.data;
      
      console.log('Login successful, storing token...');
      
      // Store token based on rememberMe preference
      if (rememberMe) {
        // Store in localStorage for persistent login
        localStorage.setItem('token', token);
        sessionStorage.removeItem('token'); // Clear session storage
        console.log('Token stored in localStorage for persistent login');
      } else {
        // Store in sessionStorage for temporary login (cleared when browser closes)
        sessionStorage.setItem('token', token);
        localStorage.removeItem('token'); // Clear local storage
        console.log('Token stored in sessionStorage for temporary login');
      }
      
      // Don't manually set headers - let the interceptor handle it
      setUser(userData);
      return userData;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };  

  const logout = () => {
    console.log('Logging out, clearing tokens...');
    // Clear from both storages
    sessionStorage.removeItem('token');
    localStorage.removeItem('token');
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
