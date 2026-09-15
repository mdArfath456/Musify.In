import { api } from "./axios";

// Normalizes an axios error into a plain Error carrying the backend's actual
// message (and field-level errors / needsVerification flag, if any) instead
// of axios's generic "Request failed with status code XXX" text.
function normalizeAuthError(err) {
  const data = err?.response?.data;
  const message = data?.message || err.message || "Something went wrong. Try again.";
  const normalized = new Error(message);
  normalized.fieldErrors = data?.errors || null;
  normalized.needsVerification = data?.needsVerification || false;
  normalized.email = data?.email || null;
  normalized.status = err?.response?.status || null;
  return normalized;
}

export async function registerUser({ username, email, password, role, age, acceptedTerms }) {
  try {
    const { data } = await api.post("/auth/register", {
      username,
      email,
      password,
      role,
      age: age || undefined,
      acceptedTerms,
    });
    return data;
  } catch (err) {
    throw normalizeAuthError(err);
  }
}

export async function loginUser({ identifier, password, rememberMe }) {
  try {
    const { data } = await api.post("/auth/login", {
      username: identifier,
      email: identifier,
      password,
      rememberMe,
    });
    return data;
  } catch (err) {
    throw normalizeAuthError(err);
  }
}

// The actual code entry happens against Clerk directly (see VerifyOtp.jsx);
// this just hands our backend the resulting Clerk user id so it can confirm
// the verification really happened before marking the account verified.
export async function verifyOtp({ email, clerkUserId }) {
  try {
    const { data } = await api.post("/auth/verify-otp", { email, clerkUserId });
    return data;
  } catch (err) {
    throw normalizeAuthError(err);
  }
}

export async function resendOtp({ email, purpose = "verify-email" }) {
  try {
    const { data } = await api.post("/auth/resend-otp", { email, purpose });
    return data;
  } catch (err) {
    throw normalizeAuthError(err);
  }
}

export async function forgotPassword({ email }) {
  try {
    const { data } = await api.post("/auth/forgot-password", { email });
    return data;
  } catch (err) {
    throw normalizeAuthError(err);
  }
}

export async function resetPassword({ email, otp, newPassword }) {
  try {
    const { data } = await api.post("/auth/reset-password", { email, otp, newPassword });
    return data;
  } catch (err) {
    throw normalizeAuthError(err);
  }
}

// Live-validation support: debounced from the Register form while typing.
export async function checkAvailability({ username, email }) {
  const params = {};
  if (username) params.username = username;
  if (email) params.email = email;
  const { data } = await api.get("/auth/check-availability", { params });
  return data; // { username: { available }, email: { available } }
}

export async function logoutUser() {
  const { data } = await api.post("/auth/logout");
  return data;
}

export async function logoutAllDevices() {
  const { data } = await api.post("/auth/logout-all");
  return data;
}