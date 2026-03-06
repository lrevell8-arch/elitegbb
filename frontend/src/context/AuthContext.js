import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

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
  const [token, setToken] = useState(localStorage.getItem('hwh_token'));
  const [loading, setLoading] = useState(true);
  
  // Impersonation state
  const [isImpersonating, setIsImpersonating] = useState(() => {
    return localStorage.getItem('hwh_impersonating') === 'true';
  });
  const [originalAdmin, setOriginalAdmin] = useState(() => {
    const stored = localStorage.getItem('hwh_original_admin');
    return stored ? JSON.parse(stored) : null;
  });

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('hwh_token');
      if (storedToken) {
        try {
          const response = await axios.get(`${API_URL}/api/auth/me`, {
            headers: { Authorization: `Bearer ${storedToken}` }
          });
          setUser(response.data);
          setToken(storedToken);
        } catch (error) {
          console.error('Auth init error:', error);
          // If token is invalid, also clear impersonation state
          localStorage.removeItem('hwh_token');
          localStorage.removeItem('hwh_impersonating');
          localStorage.removeItem('hwh_original_admin');
          setToken(null);
          setUser(null);
          setIsImpersonating(false);
          setOriginalAdmin(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    const response = await axios.post(`${API_URL}/api/auth/login`, {
      email,
      password
    });
    const { token: newToken, user: userData } = response.data;
    localStorage.setItem('hwh_token', newToken);
    // Clear any previous impersonation state on normal login
    localStorage.removeItem('hwh_impersonating');
    localStorage.removeItem('hwh_original_admin');
    setIsImpersonating(false);
    setOriginalAdmin(null);
    setToken(newToken);
    setUser(userData);
    return userData;
  };

  // Impersonation login - admin logs in as another user
  const impersonateUser = async (impersonationToken, userData, adminData, targetRole = 'player') => {
    // Store the current admin token before switching
    localStorage.setItem('hwh_token', impersonationToken);
    localStorage.setItem('hwh_impersonating', 'true');
    localStorage.setItem('hwh_original_admin', JSON.stringify(adminData));

    // Also store in role-specific token key so PlayerAuthContext/CoachAuthContext can find it
    if (targetRole === 'player') {
      localStorage.setItem('hwh_player_token', impersonationToken);
    } else if (targetRole === 'coach') {
      localStorage.setItem('hwh_coach_token', impersonationToken);
    }

    setToken(impersonationToken);
    setUser(userData);
    setIsImpersonating(true);
    setOriginalAdmin(adminData);

    return userData;
  };

  // Exit impersonation and return to admin account
  const exitImpersonation = async () => {
    if (!originalAdmin) {
      // Fallback to normal logout if no original admin stored
      logout();
      return;
    }

    // Restore admin token and user data
    const adminToken = originalAdmin.token;
    localStorage.setItem('hwh_token', adminToken);
    localStorage.removeItem('hwh_impersonating');
    localStorage.removeItem('hwh_original_admin');

    // Also clear any role-specific tokens that were set during impersonation
    localStorage.removeItem('hwh_player_token');
    localStorage.removeItem('hwh_coach_token');

    setToken(adminToken);
    setUser(originalAdmin.user);
    setIsImpersonating(false);
    setOriginalAdmin(null);

    return originalAdmin.user;
  };

  const logout = () => {
    localStorage.removeItem('hwh_token');
    localStorage.removeItem('hwh_impersonating');
    localStorage.removeItem('hwh_original_admin');
    setToken(null);
    setUser(null);
    setIsImpersonating(false);
    setOriginalAdmin(null);
  };

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${token}`
  });

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token && !!user,
    isImpersonating,
    originalAdmin,
    login,
    impersonateUser,
    exitImpersonation,
    logout,
    getAuthHeaders
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
