// context/AuthContext.jsx - FIXED
import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import socketService from '../services/socket';

export const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialCheckDone, setInitialCheckDone] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const loadUser = async () => {
      try {
        // Check if token exists
        const token = localStorage.getItem('token');

        if (!token) {
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
          } catch (e) {
            console.error('Failed to parse cached user:', e);
          }
        }

        // Then try to get fresh data from API
        const res = await api.get('/auth/me');

        if (res.data && res.data._id) {
          setUser(res.data);
          // Cache the user data
          localStorage.setItem('user', JSON.stringify(res.data));
          // Initiate Real-Time Connection
          socketService.connect(res.data._id);
        } else {
          localStorage.removeItem('user');
          setUser(null);
        }
      } catch (err) {
        // If it's a 401 error, the token is invalid/expired
        if (err.response?.status === 401) {
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
      const res = await api.post('/auth/login', { identifier, password });
      const userData = res.data;

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

        if (token) {
          localStorage.setItem('token', token);
        }

        // Store user data
        localStorage.setItem('user', JSON.stringify(userData));

        setUser(userData);
        socketService.connect(userData._id);
        return { success: true, user: userData };
      } else {
        return { success: false, message: 'Invalid response format' };
      }
    } catch (error) {
      let errorMessage = 'Login failed. Please check your connection.';

      if (error.response) {
        // Server responded with an error (4xx, 5xx)
        errorMessage = error.response.data?.message || `Server error: ${error.response.status}`;
      } else if (error.request) {
        // Request made but no response (Network error)
        errorMessage = 'Network error: Cannot reach the authentication server.';
      }

      return { success: false, message: errorMessage };
    }
  };

  const register = async (name, email, phone, password, role) => {
    try {
      const res = await api.post('/auth/register', {
        name,
        email,
        phone,
        password,
        role,
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
        socketService.connect(userData._id);
        return userData;
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      // Re-throwing is handled by the caller, but we keep this for consistency or add logging
      console.error('Registration error details:', error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    socketService.disconnect();
    navigate('/login');
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    // Also update localStorage
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        initialCheckDone,
        login,
        register,
        logout,
        updateUser,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
