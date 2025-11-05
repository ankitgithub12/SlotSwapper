import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Set base URL for API calls
  useEffect(() => {
    axios.defaults.baseURL = 'http://localhost:5000';
  }, []);

  // Debug user object when it changes
  useEffect(() => {
    if (user) {
      console.log('🔍 AuthContext - User object structure:', {
        user,
        keys: Object.keys(user),
        has_mongo_id: '_id' in user,        // ✅ Fixed duplicate key
        _id_value: user._id,
        has_regular_id: 'id' in user,       // ✅ Fixed duplicate key
        id_value: user.id
      });
    }
  }, [user]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUser();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUser = async () => {
    try {
      const response = await axios.get('/api/auth/me');
      const userData = response.data.user;
      
      // Ensure consistent ID field - normalize to _id
      if (userData.id && !userData._id) {
        userData._id = userData.id;
        console.log('🔄 Normalized user.id to user._id');
      }
      
      // Make sure isAdmin is included
      userData.isAdmin = userData.isAdmin || false;
      
      setUser(userData);
    } catch (error) {
      console.error('Fetch user error:', error);
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const response = await axios.post('/api/auth/login', { email, password });
    const { token, user: userData } = response.data;
    
    // Ensure consistent ID field - normalize to _id
    if (userData.id && !userData._id) {
      userData._id = userData.id;
      console.log('🔄 Normalized user.id to user._id during login');
    }
    
    // Make sure isAdmin is included
    userData.isAdmin = userData.isAdmin || false;
    
    localStorage.setItem('token', token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(userData);
    
    return response.data;
  };

  const register = async (name, email, password) => {
    const response = await axios.post('/api/auth/register', { name, email, password });
    const { token, user: userData } = response.data;
    
    // Ensure consistent ID field - normalize to _id
    if (userData.id && !userData._id) {
      userData._id = userData.id;
      console.log('🔄 Normalized user.id to user._id during register');
    }
    
    // Make sure isAdmin is included
    userData.isAdmin = userData.isAdmin || false;
    
    localStorage.setItem('token', token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(userData);
    
    return response.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  // Helper function to get user ID consistently
  const getUserId = () => {
    return user?._id || user?.id;
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading,
    getUserId // Add this helper function
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}