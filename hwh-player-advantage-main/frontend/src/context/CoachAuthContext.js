import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const CoachAuthContext = createContext(null);

export const useCoachAuth = () => {
  const context = useContext(CoachAuthContext);
  if (!context) {
    throw new Error('useCoachAuth must be used within a CoachAuthProvider');
  }
  return context;
};

export const CoachAuthProvider = ({ children }) => {
  const [coach, setCoach] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('hwh_coach_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('hwh_coach_token');
      if (storedToken) {
        try {
          const response = await axios.get(`${API_URL}/api/coach/me`, {
            headers: { Authorization: `Bearer ${storedToken}` }
          });
          setCoach(response.data);
          setToken(storedToken);
        } catch (error) {
          console.error('Coach auth init error:', error);
          localStorage.removeItem('hwh_coach_token');
          setToken(null);
          setCoach(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    const response = await axios.post(`${API_URL}/api/coach/login`, {
      email,
      password
    });
    const { token: newToken, user: userData } = response.data;
    localStorage.setItem('hwh_coach_token', newToken);
    setToken(newToken);
    setCoach(userData);
    return userData;
  };

  const register = async (data) => {
    const response = await axios.post(`${API_URL}/api/coach/register`, data);
    return response.data;
  };

  const logout = () => {
    localStorage.removeItem('hwh_coach_token');
    setToken(null);
    setCoach(null);
  };

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${token}`
  });

  const value = {
    coach,
    token,
    loading,
    isAuthenticated: !!token && !!coach,
    login,
    register,
    logout,
    getAuthHeaders
  };

  return (
    <CoachAuthContext.Provider value={value}>
      {children}
    </CoachAuthContext.Provider>
  );
};
