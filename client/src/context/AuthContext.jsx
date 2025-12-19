// context/AuthContext.jsx - FIXED
import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

export const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialCheckDone, setInitialCheckDone] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      try {
        console.log('Loading user from /auth/me...');
        
        // Check if token exists
        const token = localStorage.getItem('token');
        console.log('Token from localStorage:', token ? 'Found' : 'Not found');
        
        if (!token) {
          console.log('No token found, user is not logged in');
          setUser(null);
          setLoading(false);
          setInitialCheckDone(true);
          return;
        }
        
        // Set user from localStorage first for immediate display
        const cachedUser = localStorage.getItem('user');
        if (cachedUser) {
          try {
            const parsedUser = JSON.parse(cachedUser);
            setUser(parsedUser);
            console.log('Loaded user from cache:', parsedUser.role);
          } catch (e) {
            console.log('Failed to parse cached user');
          }
        }
        
        // Then try to get fresh data from API
        const res = await api.get('/auth/me');
        
        console.log('Auth response:', res.data);
        
        if (res.data && res.data._id) {
          setUser(res.data);
          // Cache the user data
          localStorage.setItem('user', JSON.stringify(res.data));
          console.log('User loaded successfully:', res.data.role);
        } else {
          console.log('Invalid user data format, clearing cache');
          localStorage.removeItem('user');
          setUser(null);
        }
      } catch (err) {
        console.log('Auth check failed:', err.message, err.response?.status);
        
        // If it's a 401 error, the token is invalid/expired
        if (err.response?.status === 401) {
          console.log('Token expired or invalid, clearing...');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
        } else {
          // For other errors, keep cached user if available
          const cachedUser = localStorage.getItem('user');
          if (!cachedUser) {
            setUser(null);
          }
        }
      } finally {
        setLoading(false);
        setInitialCheckDone(true);
      }
    };
    
    loadUser();
  }, []);

  const login = async (identifier, password) => {
    try {
      console.log('Attempting login...');
      const res = await api.post('/auth/login', { identifier, password });
      const userData = res.data;
      
      console.log('Login response:', userData);
      
      if (userData && userData._id) {
        // Check where the token is in the response
        let token = userData.token;
        
        // If token is not in userData, check response headers
        if (!token && res.headers['authorization']) {
          token = res.headers['authorization'].replace('Bearer ', '');
        }
        
        // If token is not in headers, check if it's in a nested property
        if (!token && userData.data?.token) {
          token = userData.data.token;
        }
        
        console.log('Token extracted:', token ? 'Yes' : 'No');
        
        if (token) {
          localStorage.setItem('token', token);
          console.log('Token saved to localStorage');
        } else {
          console.warn('No token found in login response');
        }
        
        // Store user data
        localStorage.setItem('user', JSON.stringify(userData));
        console.log('User data saved to localStorage');
        
        setUser(userData);
        console.log('User logged in:', userData.role);
        return { success: true, user: userData };
      } else {
        console.error('Invalid login response format');
        return { success: false, message: 'Invalid response format' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Login failed' 
      };
    }
  };

  const register = async (name, email, phone, countryCode, password, role) => {
    try {
      // Combine country code with phone
      const phoneNumber = countryCode + phone.replace(/\D/g, '');
      
      const res = await api.post('/auth/register', { 
        name, 
        email, 
        phone: phoneNumber,
        password, 
        role 
      });
      const userData = res.data;
      
      if (userData && userData._id) {
        // Check for token in response
        let token = userData.token;
        if (!token && res.headers['authorization']) {
          token = res.headers['authorization'].replace('Bearer ', '');
        }
        
        if (token) {
          localStorage.setItem('token', token);
        }
        
        // Store user data
        localStorage.setItem('user', JSON.stringify(userData));
        
        setUser(userData);
        console.log('User registered:', userData.role);
        return userData;
      } else {
        console.error('Invalid registration response format');
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Registration error in AuthContext:', error);
      throw error;
    }
  };

  const logout = () => {
    console.log('Logging out...');
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const updateUser = (updatedUser) => {
    console.log('Updating user context:', updatedUser);
    setUser(updatedUser);
    // Also update localStorage
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading,
      initialCheckDone,
      login, 
      register, 
      logout, 
      updateUser,
      setUser 
    }}>
      {children}
    </AuthContext.Provider>
  );
};