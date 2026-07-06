import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

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

    console.log("[Interceptor]", {
      status: error.response?.status,
      error: error.response?.data?.error,
      url: original?.url,
      retry: original?._retry,
    });

    if (
      error.response?.status !== 401 ||
      error.response?.data?.error !== "TOKEN_EXPIRED" ||
      original._retry
    ) {
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
      window.location.href = "/login";
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);
