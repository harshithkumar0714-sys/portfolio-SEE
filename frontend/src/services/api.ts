import axios from "axios";

function defaultApiUrl() {
  const hostname = window.location.hostname;
  if (["localhost", "127.0.0.1", "[::1]"].includes(hostname)) return `http://${hostname}:4000/api`;
  return "http://localhost:4000/api";
}

export const api = axios.create({ baseURL: import.meta.env.VITE_API_URL ?? defaultApiUrl() });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("smartstudy_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use((response) => response, (error) => {
  if (error.response?.status === 401 && !String(error.config?.url).includes("/auth/")) {
    localStorage.removeItem("smartstudy_token");
    window.dispatchEvent(new Event("smartstudy:unauthorized"));
  }
  return Promise.reject(error);
});

export function errorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    if (error.code === "ERR_NETWORK") {
      return "Can't reach the SmartStudy API. Start the backend with `npm run dev` and check that MySQL is configured.";
    }
    return error.response?.data?.error ?? error.message;
  }
  return error instanceof Error ? error.message : "Something went wrong";
}
