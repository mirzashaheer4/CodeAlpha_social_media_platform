// public/js/api.js
// Abstract backend API communication layer.
// Stores no UI state, reads no DOM elements, throws descriptive exceptions on failures.

// Resolve API base depending on where the SPA is served from.
// If the SPA is served from a different port during development (live-server on 3000),
// point API calls to the backend server on port 5000. When the backend serves the
// static files (production), `API_BASE` should be relative (`/api`).
const API_BASE = (function() {
  const host = window.location.hostname;
  const port = window.location.port;
  
  // Local development
  if (host === '127.0.0.1' || host === 'localhost') {
    if (port && port !== '5000') {
      return `http://${host}:5000/api`;
    }
    return '/api'; // same origin locally
  }
  
  // Production Split Deployment (Vercel Frontend -> Render Backend)
  // CHANGE THIS to your actual Render URL (e.g., https://your-app.onrender.com/api)
  return 'https://nocturne-api.onrender.com/api';
})();

// Helper to standardise fetch calls and handle errors
async function request(url, options = {}) {
  // Ensure credentials are included so the HttpOnly cookies are attached
  options.credentials = 'include';
  options.headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  try {
    const response = await fetch(`${API_BASE}${url}`, options);
    const data = await response.json();

    if (!response.ok) {
      const error = new Error(data?.error?.message || 'Something went wrong');
      error.status = response.status;
      error.fields = data?.error?.fields || [];
      throw error;
    }

    return data;
  } catch (err) {
    // If it's already our custom validation/status error, rethrow it
    if (err.status) throw err;

    // Otherwise, generic network failure
    const networkError = new Error('Network error. Please check your connection.');
    networkError.status = 503;
    throw networkError;
  }
}

const api = {
  // Auth Operations
  register: async (data) => {
    return request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  login: async (data) => {
    return request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  logout: async () => {
    return request('/auth/logout', {
      method: 'POST'
    });
  },

  getMe: async () => {
    return request('/auth/me', {
      method: 'GET'
    });
  },

  // User Operations
  getUsers: async (page = 1) => {
    return request(`/users?page=${page}`, {
      method: 'GET'
    });
  },

  getUserByUsername: async (username) => {
    return request(`/users/${username}`, {
      method: 'GET'
    });
  },

  updateProfile: async (data) => {
    return request('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  },

  followUser: async (id) => {
    return request(`/users/${id}/follow`, {
      method: 'POST'
    });
  },

  unfollowUser: async (id) => {
    return request(`/users/${id}/unfollow`, {
      method: 'POST'
    });
  },

  // Post Operations
  createPost: async (data) => {
    return request('/posts', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  getPosts: async (page = 1) => {
    return request(`/posts?page=${page}`, {
      method: 'GET'
    });
  },

  getFeed: async (page = 1) => {
    return request(`/feed?page=${page}`, {
      method: 'GET'
    });
  },

  getPost: async (id) => {
    return request(`/posts/${id}`, {
      method: 'GET'
    });
  },

  deletePost: async (id) => {
    return request(`/posts/${id}`, {
      method: 'DELETE'
    });
  },

  likePost: async (id) => {
    return request(`/posts/${id}/like`, {
      method: 'POST'
    });
  },

  // Comment Operations
  addComment: async (postId, content) => {
    return request(`/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content })
    });
  },

  getComments: async (postId) => {
    return request(`/posts/${postId}/comments`, {
      method: 'GET'
    });
  },

  deleteComment: async (id) => {
    return request(`/comments/${id}`, {
      method: 'DELETE'
    });
  }
};

// Make api globally accessible
window.api = api;
