import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

const SESSION_FLAG = "hasSession";

export const AUTH_EXPIRED_EVENT = "auth:expired";

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

// Requests that failed with 401 because the session went idle. They are held
// here (their promises stay pending) while the re-login dialog is open, then
// replayed after a successful login or rejected if the user gives up.
let waiting = [];

export function replayWaitingRequests() {
  const queue = waiting;
  waiting = [];
  queue.forEach((item) => item.replay());
}

export function rejectWaitingRequests() {
  const queue = waiting;
  waiting = [];
  queue.forEach((item) => item.fail());
}

// Pass { skipReauth: true } in a request config to opt out of the flow
// (login, logout, initial session load).
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const config = error.config;

    const shouldHold =
      error.response?.status === 401 &&
      config &&
      !config.skipReauth &&
      !config._replayed &&
      hasSessionFlag();

    if (!shouldHold) return Promise.reject(error);

    return new Promise((resolve, reject) => {
      waiting.push({
        replay: () => {
          config._replayed = true;
          api(config).then(resolve, reject);
        },
        fail: () => reject(error),
      });
      window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
    });
  },
);
