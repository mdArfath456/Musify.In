import axios from "axios";
import { API_BASE_URL } from "../config";

// The Musify backend's auth middleware sends { message: "Unauthorized" } or
// { message: "You don't have any access" } WITHOUT setting a non-200 status
// code. That means a plain axios error-status check will never catch an
// expired/invalid session — we have to inspect the response body itself.
const AUTH_FAILURE_MESSAGES = ["Unauthorized", "You don't have any access"];

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 20000,
});

let onAuthFailure = null;
export function registerAuthFailureHandler(handler) {
  onAuthFailure = handler;
}

api.interceptors.response.use(
  (response) => {
    const message = response?.data?.message;
    if (AUTH_FAILURE_MESSAGES.includes(message)) {
      if (onAuthFailure) onAuthFailure();
      const softError = new Error(message);
      softError.isAuthFailure = true;
      return Promise.reject(softError);
    }
    return response;
  },
  (error) => Promise.reject(error)
);
