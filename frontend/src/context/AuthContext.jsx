import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { loginUser, registerUser, verifyOtp, logoutUser } from "../api/auth.api";
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

  const login = useCallback(async ({ identifier, password, rememberMe }) => {
    const data = await loginUser({ identifier, password, rememberMe });
    persist(data.user);
    return data.user;
  }, []);

  // Registration no longer logs the user in directly — the account is
  // unverified until the OTP step completes. Callers should route to the
  // verify-otp page using the returned email.
  const register = useCallback(async (payload) => {
    const data = await registerUser(payload);
    return data; // { needsVerification: true, email }
  }, []);

  // Completes the signup verification step. The code exchange itself
  // already happened against Clerk (see VerifyOtp.jsx) — this hands our
  // backend the resulting Clerk user id, and on success the backend also
  // logs the person in (issues the session cookie), so we persist here too.
  const completeVerification = useCallback(async ({ email, clerkUserId }) => {
    const data = await verifyOtp({ email, clerkUserId });
    persist(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutUser();
    } finally {
      persist(null);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, register, completeVerification, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}