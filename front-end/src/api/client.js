import axios from "axios";

const client = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL || ""}/api`,
  headers: { "Content-Type": "application/json" },
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem("rs_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // When sending FormData (file uploads), the browser must set its own
  // "multipart/form-data; boundary=..." header. The instance-level default
  // of "application/json" above would otherwise stick around and break
  // multipart parsing on the server (FastAPI returns 422).
  if (typeof FormData !== "undefined" && config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("rs_token");
      localStorage.removeItem("rs_user");
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default client;