import axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8009";

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
