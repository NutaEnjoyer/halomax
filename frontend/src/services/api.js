import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || '';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (username, password) =>
    api.post('/auth/login', { username, password }),
};

export const callsAPI = {
  createCall: (data) => api.post('/calls', data),
  getCall: (id) => api.get(`/calls/${id}`),
  listCalls: () => api.get('/calls'),
  getAnalytics: () => api.get('/analytics'),
};

export const inboundAPI = {
  getConfig: () => api.get('/inbound/config'),
  updateConfig: (data) => api.put('/inbound/config', data),
};

export default api;
