import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Auth
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
};

// Words
export const wordsAPI = {
  list: (params) => api.get('/words/', { params }),
  create: (data) => api.post('/words/', data),
  update: (id, data) => api.put(`/words/${id}`, data),
  delete: (id) => api.delete(`/words/${id}`),
  get: (id) => api.get(`/words/${id}`),
  getDaily: () => api.get('/words/daily'),
  setDaily: (count) => api.post(`/words/daily/set?target_count=${count}`),
};

// Quiz
export const quizAPI = {
  start: (data) => api.post('/quiz/start', data),
  answer: (data) => api.post('/quiz/answer', data),
  complete: (sessionId) => api.post(`/quiz/complete/${sessionId}`),
  history: () => api.get('/quiz/history'),
};

// Progress
export const progressAPI = {
  get: () => api.get('/progress/'),
  badges: () => api.get('/progress/badges'),
};

export default api;
