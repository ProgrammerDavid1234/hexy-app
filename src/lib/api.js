// API utilities for Hexy AI
import AsyncStorage from '@react-native-async-storage/async-storage';

export const API_BASE_URL = 'https://hextant-ai-production.up.railway.app';
const TOKEN_KEY = '@hexy_token';
const TOKEN_TYPE_KEY = '@hexy_token_type';

// API Error Handler
export const handleApiError = async (response) => {
  let errorMessage = 'An error occurred';

  try {
    const errorData = await response.json();

    if (errorData.detail) {
      if (typeof errorData.detail === 'string') {
        errorMessage = errorData.detail;
      } else if (Array.isArray(errorData.detail)) {
        errorMessage = errorData.detail
          .map((err) => `${err.loc?.[1] || 'Field'}: ${err.msg}`)
          .join(', ');
      }
    }
  } catch (e) {
    if (response.status === 401) {
      errorMessage = 'Authentication failed';
    } else if (response.status === 403) {
      errorMessage = 'Access denied';
    } else if (response.status === 404) {
      errorMessage = 'Resource not found';
    } else if (response.status === 422) {
      errorMessage = 'Invalid data provided';
    } else if (response.status >= 500) {
      errorMessage = 'Server error occurred';
    } else {
      errorMessage = `Request failed with status: ${response.status}`;
    }
  }

  return errorMessage;
};

// Auth utilities
export const authUtils = {
  getToken: async () => {
    try {
      return await AsyncStorage.getItem(TOKEN_KEY);
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  },

  getTokenType: async () => {
    try {
      return (await AsyncStorage.getItem(TOKEN_TYPE_KEY)) || 'bearer';
    } catch (error) {
      return 'bearer';
    }
  },

  setToken: async (token, tokenType = 'bearer') => {
    try {
      await AsyncStorage.setItem(TOKEN_KEY, token);
      await AsyncStorage.setItem(TOKEN_TYPE_KEY, tokenType);
    } catch (error) {
      console.error('Error saving token:', error);
    }
  },

  clearToken: async () => {
    try {
      await AsyncStorage.removeItem(TOKEN_KEY);
      await AsyncStorage.removeItem(TOKEN_TYPE_KEY);
    } catch (error) {
      console.error('Error clearing token:', error);
    }
  },

  isAuthenticated: async () => {
    const token = await authUtils.getToken();
    return !!token;
  },

  getAuthHeaders: async () => {
    const token = await authUtils.getToken();
    const tokenType = await authUtils.getTokenType();
    return token ? { Authorization: `${tokenType} ${token}` } : {};
  },
};

// API Methods
export const api = {
  // Register new user
  register: async (username, email, password) => {
    const response = await fetch(`${API_BASE_URL}/users/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({ username, email, password }),
    });

    if (!response.ok) {
      const errorMessage = await handleApiError(response);
      throw new Error(errorMessage);
    }

    return await response.json();
  },

  // Login user
  login: async (username, password) => {
    const formData = new URLSearchParams();
    formData.append('grant_type', 'password');
    formData.append('username', username);
    formData.append('password', password);
    formData.append('scope', '');
    formData.append('client_id', '');
    formData.append('client_secret', '');

    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        accept: 'application/json',
      },
      body: formData.toString(),
    });

    if (!response.ok) {
      const errorMessage = await handleApiError(response);
      throw new Error(errorMessage);
    }

    const data = await response.json();
    await authUtils.setToken(data.access_token, data.token_type);
    return data;
  },

  // Get current user
  getCurrentUser: async () => {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: {
        accept: 'application/json',
        ...(await authUtils.getAuthHeaders()),
      },
    });

    if (!response.ok) {
      const errorMessage = await handleApiError(response);
      throw new Error(errorMessage);
    }

    return await response.json();
  },

  // Get conversations
  getConversations: async () => {
    const response = await fetch(`${API_BASE_URL}/chat/`, {
      headers: {
        accept: 'application/json',
        ...(await authUtils.getAuthHeaders()),
      },
    });

    if (!response.ok) {
      const errorMessage = await handleApiError(response);
      throw new Error(errorMessage);
    }

    return await response.json();
  },

  // Create conversation
  createConversation: async () => {
    const response = await fetch(`${API_BASE_URL}/chat/`, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        ...(await authUtils.getAuthHeaders()),
      },
    });

    if (!response.ok) {
      const errorMessage = await handleApiError(response);
      throw new Error(errorMessage);
    }

    return await response.json();
  },

  // Delete conversation
  deleteConversation: async (chatId) => {
    const response = await fetch(`${API_BASE_URL}/chat/${chatId}`, {
      method: 'DELETE',
      headers: {
        accept: 'application/json',
        ...(await authUtils.getAuthHeaders()),
      },
    });

    if (!response.ok) {
      const errorMessage = await handleApiError(response);
      throw new Error(errorMessage);
    }

    return await response.json();
  },

  // Get chat history
  getChatHistory: async (chatId) => {
    const response = await fetch(`${API_BASE_URL}/chat/history/${chatId}`, {
      headers: {
        accept: 'application/json',
        ...(await authUtils.getAuthHeaders()),
      },
    });

    if (!response.ok) {
      const errorMessage = await handleApiError(response);
      throw new Error(errorMessage);
    }

    return await response.json();
  },
// Updated sendMessageStream function using XMLHttpRequest for true streaming
// Replace the sendMessageStream function with this simpler version
sendMessageStream: async (chatId, message, model = 'kwaipilot/kat-coder-pro:free', onToken, onComplete, onError) => {
  try {
    const token = await authUtils.getToken();
    const tokenType = await authUtils.getTokenType();
    const authHeader = token ? { Authorization: `${tokenType} ${token}` } : {};

    const response = await fetch(
      `${API_BASE_URL}/chat/${chatId}?model=${encodeURIComponent(model)}&message=${encodeURIComponent(message)}`,
      {
        method: 'POST',
        headers: {
          accept: 'application/json',
          ...authHeader,
        },
      }
    );

    if (!response.ok) {
      const errorMessage = await handleApiError(response);
      if (onError) onError(errorMessage);
      return;
    }

    const data = await response.json();
    console.log('Received response:', data);

    // Extract content from the response
    const content = data.content || data.message || data.text || '';
    
    if (content && onToken) {
      // Send the entire message at once
      onToken(content);
    }

    if (onComplete) {
      onComplete();
    }

  } catch (error) {
    console.error('Error sending message:', error);
    if (onError) {
      onError(error instanceof Error ? error.message : 'Request failed');
    }
  }
},
  // Send chat message (non-streaming fallback)
  sendMessage: async (chatId, message, model = 'kwaipilot/kat-coder-pro:free') => {
    const response = await fetch(
      `${API_BASE_URL}/chat/${chatId}?model=${encodeURIComponent(model)}&message=${encodeURIComponent(message)}`,
      {
        method: 'POST',
        headers: {
          accept: 'application/json',
          ...(await authUtils.getAuthHeaders()),
        },
      }
    );

    if (!response.ok) {
      const errorMessage = await handleApiError(response);
      throw new Error(errorMessage);
    }

    return await response.json();
  },

  // Send chat message with image
  sendMessageWithImage: async (chatId, message, imageFile) => {
    const formData = new FormData();
    formData.append('image', {
      uri: imageFile.uri,
      type: imageFile.type || 'image/jpeg',
      name: imageFile.name || 'image.jpg',
    });

    const token = await authUtils.getToken();
    const tokenType = await authUtils.getTokenType();
    const authHeader = token ? { Authorization: `${tokenType} ${token}` } : {};

    const response = await fetch(
      `${API_BASE_URL}/chat/${chatId}/image?message=${encodeURIComponent(message)}`,
      {
        method: 'POST',
        headers: {
          accept: 'application/json',
          ...authHeader,
        },
        body: formData,
      }
    );

    if (!response.ok) {
      const errorMessage = await handleApiError(response);
      throw new Error(errorMessage);
    }

    return await response.json();
  },

  // Get all available models
  getAllModels: async () => {
    const response = await fetch(`${API_BASE_URL}/models/all`, {
      headers: {
        accept: 'application/json',
      },
    });

    if (!response.ok) {
      const errorMessage = await handleApiError(response);
      throw new Error(errorMessage);
    }

    return await response.json();
  },

  // Get user's available models (based on subscription)
  getUserModels: async () => {
    const response = await fetch(`${API_BASE_URL}/models/all/me`, {
      headers: {
        accept: 'application/json',
        ...(await authUtils.getAuthHeaders()),
      },
    });

    if (!response.ok) {
      const errorMessage = await handleApiError(response);
      throw new Error(errorMessage);
    }

    return await response.json();
  },

  // Update user
  updateUser: async (data) => {
    const response = await fetch(`${API_BASE_URL}/users/`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        accept: 'application/json',
        ...(await authUtils.getAuthHeaders()),
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorMessage = await handleApiError(response);
      throw new Error(errorMessage);
    }

    return await response.json();
  },

  // Upload profile image
  uploadProfileImage: async (imageFile) => {
    const formData = new FormData();
    formData.append('image', {
      uri: imageFile.uri,
      type: imageFile.type || 'image/jpeg',
      name: imageFile.name || 'image.jpg',
    });

    const token = await authUtils.getToken();
    const tokenType = await authUtils.getTokenType();
    const authHeader = token ? { Authorization: `${tokenType} ${token}` } : {};

    const response = await fetch(`${API_BASE_URL}/users/upload/image`, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        ...authHeader,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorMessage = await handleApiError(response);
      throw new Error(errorMessage);
    }

    return await response.json();
  },

  // Delete user
  deleteUser: async () => {
    const response = await fetch(`${API_BASE_URL}/users/`, {
      method: 'DELETE',
      headers: {
        accept: 'application/json',
        ...(await authUtils.getAuthHeaders()),
      },
    });

    if (!response.ok) {
      const errorMessage = await handleApiError(response);
      throw new Error(errorMessage);
    }

    return await response.json();
  },

  // Legacy methods for compatibility
  signup: async (username, email, password) => {
    return api.register(username, email, password);
  },

  getChats: async () => {
    return api.getConversations();
  },

  createChat: async () => {
    return api.createConversation();
  },

  deleteChat: async (chatId) => {
    return api.deleteConversation(chatId);
  },
};
