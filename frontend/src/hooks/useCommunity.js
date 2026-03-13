import { useState, useCallback } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export const useCommunity = (token) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getAuthHeaders = useCallback(() => ({
    Authorization: `Bearer ${token}`
  }), [token]);

  // Fetch posts with filters
  const fetchPosts = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters.category) params.append('category', filters.category);
      if (filters.search) params.append('search', filters.search);
      if (filters.sortBy) params.append('sort_by', filters.sortBy);
      if (filters.limit) params.append('limit', filters.limit);
      if (filters.offset) params.append('offset', filters.offset);

      const response = await axios.get(`${API_URL}/api/community/posts?${params}`, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch posts');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  // Fetch single post with comments
  const fetchPost = useCallback(async (postId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_URL}/api/community/posts/${postId}`, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch post');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  // Create new post
  const createPost = useCallback(async (postData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(`${API_URL}/api/community/posts`, postData, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create post');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  // Update post
  const updatePost = useCallback(async (postId, updateData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.patch(`${API_URL}/api/community/posts/${postId}`, updateData, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update post');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  // Delete post
  const deletePost = useCallback(async (postId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.delete(`${API_URL}/api/community/posts/${postId}`, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete post');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  // Create comment
  const createComment = useCallback(async (commentData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(`${API_URL}/api/community/comments`, commentData, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create comment');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  // Update comment
  const updateComment = useCallback(async (commentId, updateData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.patch(`${API_URL}/api/community/comments/${commentId}`, updateData, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update comment');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  // Delete comment
  const deleteComment = useCallback(async (commentId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.delete(`${API_URL}/api/community/comments/${commentId}`, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete comment');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  // Toggle reaction (like/love/etc)
  const toggleReaction = useCallback(async (reactionData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(`${API_URL}/api/community/reactions`, reactionData, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to toggle reaction');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  // Get user's reactions
  const fetchUserReactions = useCallback(async (postIds = [], commentIds = []) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (postIds.length > 0) params.append('post_ids', postIds.join(','));
      if (commentIds.length > 0) params.append('comment_ids', commentIds.join(','));

      const response = await axios.get(`${API_URL}/api/community/reactions?${params}`, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch reactions');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  return {
    loading,
    error,
    fetchPosts,
    fetchPost,
    createPost,
    updatePost,
    deletePost,
    createComment,
    updateComment,
    deleteComment,
    toggleReaction,
    fetchUserReactions
  };
};

export default useCommunity;
