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

// JWT decode helper to check token payload without verification
const decodeJWT = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
};

export const CoachAuthProvider = ({ children }) => {
  const [coach, setCoach] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('hwh_coach_token'));
  const [loading, setLoading] = useState(true);
  const [isImpersonating, setIsImpersonating] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      // First check for direct coach token
      let storedToken = localStorage.getItem('hwh_coach_token');
      let impersonationMode = false;

      // If no coach token, check if there's an admin impersonating as coach
      if (!storedToken) {
        const adminToken = localStorage.getItem('hwh_token');
        const isImpersonatingFlag = localStorage.getItem('hwh_impersonating') === 'true';

        if (adminToken && isImpersonatingFlag) {
          // Check if the admin token contains a coach role
          const payload = decodeJWT(adminToken);
          if (payload && payload.role === 'coach') {
            storedToken = adminToken;
            impersonationMode = true;
          }
        }
      }

      if (storedToken) {
        try {
          const response = await axios.get(`${API_URL}/api/coach/me`, {
            headers: { Authorization: `Bearer ${storedToken}` }
          });
          setCoach(response.data);
          setToken(storedToken);
          setIsImpersonating(impersonationMode);
        } catch (error) {
          console.error('Coach auth init error:', error);
          localStorage.removeItem('hwh_coach_token');
          setToken(null);
          setCoach(null);
          setIsImpersonating(false);
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
    setIsImpersonating(false);
    return userData;
  };

  const register = async (data) => {
    const response = await axios.post(`${API_URL}/api/coach/register`, data);
    return response.data;
  };

  const logout = () => {
    // If in impersonation mode, don't clear the hwh_token (admin's token)
    // Just clear the coach token and impersonation flags
    if (isImpersonating) {
      localStorage.removeItem('hwh_impersonating');
      localStorage.removeItem('hwh_original_admin');
      // Note: We keep hwh_token so admin can continue their session
    }
    localStorage.removeItem('hwh_coach_token');
    setToken(null);
    setCoach(null);
    setIsImpersonating(false);
  };

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${token}`
  });

  const value = {
    coach,
    token,
    loading,
    isAuthenticated: !!token && !!coach,
    isImpersonating,
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
