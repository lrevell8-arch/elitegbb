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

export const PlayerAuthProvider = ({ children }) => {
  const [player, setPlayer] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('hwh_player_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('hwh_player_token');
      if (storedToken) {
        try {
          const response = await axios.get(`${API_URL}/api/player/profile`, {
            headers: { Authorization: `Bearer ${storedToken}` }
          });
          setPlayer(response.data);
          setToken(storedToken);
        } catch (error) {
          console.error('Player auth init error:', error);
          localStorage.removeItem('hwh_player_token');
          setToken(null);
          setPlayer(null);
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
    localStorage.removeItem('hwh_player_token');
    setToken(null);
    setPlayer(null);
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
