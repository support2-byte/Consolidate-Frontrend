import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

const SESSION_FLAG = "hasSession";

export const setHasSession = () => {
  try {
    localStorage.setItem(SESSION_FLAG, "1");
  } catch {}
};

export const clearHasSession = () => {
  try {
    localStorage.removeItem(SESSION_FLAG);
  } catch {}
};

export const hasSessionFlag = () => {
  try {
    return localStorage.getItem(SESSION_FLAG) === "1";
  } catch {
    return false;
  }
};

let isRefreshing = false;
let refreshQueue = [];

function resolveQueue(error = null) {
  refreshQueue.forEach((cb) => cb(error));
  refreshQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (
      error.response?.status !== 401 ||
      original._retry ||
      original.url === "/auth/refresh"
    ) {
      if (error.response?.status === 401) {
        clearHasSession();
      }
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshQueue.push((err) => {
          if (err) return reject(err);
          resolve(api(original));
        });
      });
    }

    original._retry = true;
    isRefreshing = true;

    try {
      await api.post("/auth/refresh");
      resolveQueue();
      return api(original);
    } catch (refreshError) {
      resolveQueue(refreshError);
      clearHasSession();
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);
