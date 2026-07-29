import axios from "axios";

// Priority: explicit env var -> localhost in dev -> same-origin "/api" proxy in prod.
// The "/api" default is served by the Vercel rewrite in vercel.json, so a
// production build works with no env vars and no cross-origin CORS.
const baseURL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? "http://localhost:8009" : "/api");

const client = axios.create({ baseURL });

client.interceptors.request.use((config) => {
  const token = localStorage.getItem("cn_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response && error.response.status === 401) {
      const path = window.location.pathname;
      // Avoid redirect loops on the login pages themselves.
      if (!path.includes("/login")) {
        localStorage.removeItem("cn_token");
        localStorage.removeItem("cn_role");
      }
    }
    return Promise.reject(error);
  }
);

export default client;
