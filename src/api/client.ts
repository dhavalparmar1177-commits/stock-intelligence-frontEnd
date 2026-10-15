import axios from "axios";

// Public Indian market data client with rate-limit backoff and timeout handling.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000/api/v1",
  timeout: 15000,
});

// Automatic 429 rate-limit backoff interceptor with jitter
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    if (!config || !error.response) return Promise.reject(error);

    // If 429 Too Many Requests, retry up to 2 times with exponential backoff
    if (error.response.status === 429 && (!config.__retryCount || config.__retryCount < 2)) {
      config.__retryCount = (config.__retryCount || 0) + 1;
      const delay = Math.min(1000 * Math.pow(2, config.__retryCount) + Math.random() * 500, 8000);
      console.warn(`[API] 429 Rate limit encountered, retrying after ${Math.round(delay)}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return api(config);
    }

    return Promise.reject(error);
  }
);

export default api;
