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
            const sessionId = sessionStorage.getItem('sessionId');
            
            if (token && sessionId) {
                apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                const response = await apiClient.get('/auth/me');
                
                if (response.data.success) {
                    setUser(response.data.user);
                }
            }
        } catch (error) {
            if (error.response?.data?.code === 'SESSION_INVALID') {
                // Handle invalid session
                sessionStorage.removeItem('token');
                sessionStorage.removeItem('sessionId');
                delete apiClient.defaults.headers.common['Authorization'];
                setUser(null);
            }
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        try {
            const response = await apiClient.post('/auth/login', { email, password });
            const { token, sessionId, user: userData } = response.data;
            
            sessionStorage.setItem('token', token);
            sessionStorage.setItem('sessionId', sessionId);
            apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            
            setUser(userData);
            return userData;
        } catch (error) {
            if (error.response?.data?.code === 'ACTIVE_SESSION_EXISTS') {
                throw new Error('You are already logged in on another device or browser. Please log out first.');
            }
            throw error;
        }
    };

    const logout = async () => {
        try {
            const sessionId = sessionStorage.getItem('sessionId');
            if (sessionId) {
                await apiClient.post('/auth/logout', { sessionId });
            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            sessionStorage.removeItem('token');
            sessionStorage.removeItem('sessionId');
            delete apiClient.defaults.headers.common['Authorization'];
            setUser(null);
        }
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
