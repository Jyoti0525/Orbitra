// API Client - handles all HTTP requests to backend
import { auth } from '../config/firebase';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

class ApiClient {
  constructor(baseURL) {
    this.baseURL = baseURL;
  }

  // Get authorization header with current ID token
  async getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };

    // Add Firebase ID token if user is logged in
    if (auth.currentUser) {
      try {
        const token = await auth.currentUser.getIdToken();
        headers.Authorization = `Bearer ${token}`;
      } catch (error) {
        console.error('Error getting auth token:', error);
      }
    }

    return headers;
  }

  // Generic request method
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = await this.getHeaders();

    const config = {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  }

  // GET request
  async get(endpoint) {
    return this.request(endpoint, {
      method: 'GET',
    });
  }

  // POST request
  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // PATCH request
  async patch(endpoint, data) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // DELETE request
  async delete(endpoint) {
    return this.request(endpoint, {
      method: 'DELETE',
    });
  }
}

// Create API client instance
export const api = new ApiClient(API_URL);

// Convenience methods for specific endpoints
export const asteroidApi = {
  getFeed: (startDate, endDate) =>
    api.get(`/api/asteroids/feed?start_date=${startDate}&end_date=${endDate || ''}`),

  getById: (neoId) =>
    api.get(`/api/asteroids/${neoId}`),

  browse: (page = 0) =>
    api.get(`/api/asteroids/browse?page=${page}`),
};

export const watchlistApi = {
  getAll: () => api.get('/api/watchlist'),
  add: (neoId) => api.post(`/api/watchlist/${neoId}`, {}),
  remove: (neoId) => api.delete(`/api/watchlist/${neoId}`),
};

export const alertsApi = {
  getAll: () => api.get('/api/alerts'),
  create: (alertData) => api.post('/api/alerts', alertData),
  delete: (alertId) => api.delete(`/api/alerts/${alertId}`),
};

export const notificationsApi = {
  getAll: () => api.get('/api/notifications'),
  markAsRead: (notificationId) => api.patch(`/api/notifications/${notificationId}`, { isRead: true }),
};
