import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const PlayerAuthContext = createContext(null);

export const usePlayerAuth = () => {
  const context = useContext(PlayerAuthContext);
  if (!context) {
    throw new Error('usePlayerAuth must be used within a PlayerAuthProvider');
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

export const PlayerAuthProvider = ({ children }) => {
  const [player, setPlayer] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('hwh_player_token'));
  const [loading, setLoading] = useState(true);
  const [isImpersonating, setIsImpersonating] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      // First check for direct player token
      let storedToken = localStorage.getItem('hwh_player_token');
      let impersonationMode = false;

      // If no player token, check if there's an admin impersonating as player
      if (!storedToken) {
        const adminToken = localStorage.getItem('hwh_token');
        const isImpersonatingFlag = localStorage.getItem('hwh_impersonating') === 'true';

        if (adminToken && isImpersonatingFlag) {
          // Check if the admin token contains a player role
          const payload = decodeJWT(adminToken);
          if (payload && payload.role === 'player') {
            storedToken = adminToken;
            impersonationMode = true;
          }
        }
      }

      if (storedToken) {
        try {
          const response = await axios.get(`${API_URL}/api/player/profile`, {
            headers: { Authorization: `Bearer ${storedToken}` }
          });
          setPlayer(response.data);
          setToken(storedToken);
          setIsImpersonating(impersonationMode);
        } catch (error) {
          console.error('Player auth init error:', error);
          localStorage.removeItem('hwh_player_token');
          setToken(null);
          setPlayer(null);
          setIsImpersonating(false);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (playerKey, password) => {
    const response = await axios.post(`${API_URL}/api/player/login`, {
      player_key: playerKey,
      password
    });
    const { token: newToken, player: playerData } = response.data;
    localStorage.setItem('hwh_player_token', newToken);
    setToken(newToken);
    setPlayer(playerData);
    return playerData;
  };

  const logout = () => {
    // If in impersonation mode, don't clear the hwh_token (admin's token)
    // Just clear the player token and impersonation flags
    if (isImpersonating) {
      localStorage.removeItem('hwh_impersonating');
      localStorage.removeItem('hwh_original_admin');
      // Note: We keep hwh_token so admin can continue their session
    }
    localStorage.removeItem('hwh_player_token');
    setToken(null);
    setPlayer(null);
    setIsImpersonating(false);
  };

  const updateProfile = async (profileData) => {
    const response = await axios.patch(`${API_URL}/api/player/profile`, profileData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setPlayer(response.data.player);
    return response.data;
  };

  const changePassword = async (currentPassword, newPassword) => {
    const response = await axios.post(`${API_URL}/api/player/profile`, {
      current_password: currentPassword,
      new_password: newPassword
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  };

  const uploadImage = async (base64Image) => {
    const response = await axios.post(`${API_URL}/api/upload/image`, {
      image: base64Image,
      type: 'player'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    // Update player with new image URL
    if (response.data.image_url) {
      setPlayer(prev => ({ ...prev, profile_image_url: response.data.image_url }));
    }
    return response.data;
  };

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${token}`
  });

  const value = {
    player,
    token,
    loading,
    isAuthenticated: !!token && !!player,
    isImpersonating,
    login,
    logout,
    updateProfile,
    changePassword,
    uploadImage,
    getAuthHeaders
  };

  return (
    <PlayerAuthContext.Provider value={value}>
      {children}
    </PlayerAuthContext.Provider>
  );
};
