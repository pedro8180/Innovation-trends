import axios from 'axios';

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: 'http://localhost:8000/api',
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth tokens if needed in the future
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token if available
    // const token = localStorage.getItem('token');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling common errors
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      console.log('Unauthorized access');
    } else if (error.response?.status >= 500) {
      // Handle server errors
      console.error('Server error:', error.response?.data?.message || error.message);
    } else if (error.code === 'ECONNABORTED') {
      // Handle timeout
      console.error('Request timeout');
    }
    return Promise.reject(error);
  }
);

// API service methods
export const apiService = {
  // Send query to the agent
  sendQuery: async (query) => {
    try {
      const response = await apiClient.post('/agents', { query });
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Failed to send query to the agent'
      );
    }
  },

  // Health check endpoint (if you want to add one to your backend)
  healthCheck: async () => {
    try {
      const response = await apiClient.get('/health');
      return response.data;
    } catch (error) {
      throw new Error('Backend server is not available');
    }
  }
};

export default apiClient;