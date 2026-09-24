import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { loginUser, registerUser, logoutUser, verifyOtp as verifyOtpApi } from "../api/auth.api";
import { registerAuthFailureHandler } from "../api/axios";

const STORAGE_KEY = "musify.user";
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  });

  const persist = (nextUser) => {
    setUser(nextUser);
    if (nextUser) localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
    else localStorage.removeItem(STORAGE_KEY);
  };

  useEffect(() => {
    registerAuthFailureHandler(() => persist(null));
  }, []);

  // Login may finish in one of two ways: a completed session (data.user is
  // set, cookie issued) or a step-up challenge (data.requiresOtp is true —
  // email not verified yet, or this is a first-time login that still needs
  // its one-time OTP check). Callers branch on `requiresOtp` in the result.
  const login = useCallback(async ({ identifier, password, rememberMe }) => {
    const data = await loginUser({ identifier, password, rememberMe });
    if (data.user) persist(data.user);
    return data;
  }, []);

  const register = useCallback(async (payload) => {
    const data = await registerUser(payload);
    return data;
  }, []);

  // Completes either the registration "verify-email" OTP or the one-time
  // "first-login" OTP. Only the first-login purpose returns a session.
  const verifyOtp = useCallback(async ({ email, otp, purpose, rememberMe }) => {
    const data = await verifyOtpApi({ email, otp, purpose, rememberMe });
    if (data.user && purpose === "first-login") persist(data.user);
    return data;
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutUser();
    } finally {
      persist(null);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, register, verifyOtp, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}