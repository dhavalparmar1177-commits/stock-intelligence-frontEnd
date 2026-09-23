import axios from "axios";

// No login in this app — plain API client for public Indian market data endpoints.
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000/api/v1" });
export default api;
