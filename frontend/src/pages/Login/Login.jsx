import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../components/Toast/ToastContext";
import PasswordInput from "../../components/PasswordInput/PasswordInput";
import "../../styles/auth.css";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const user = await login({ identifier, password, rememberMe });
      navigate(user.role === "artist" ? "/studio" : "/library");
    } catch (err) {
      if (err.needsVerification) {
        showToast("Please verify your email first.", { type: "error" });
        navigate("/verify-otp", { state: { email: err.email || identifier } });
        return;
      }
      setError(err.message || "Something went wrong. Try again.");
      showToast(err.message || "Something went wrong. Try again.", { type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="auth-brand-mark">M</span>
          <span>Musify</span>
        </div>
        <h1 className="auth-heading">Welcome back to the record</h1>
        <p className="auth-sub">Sign in to keep spinning your library.</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="identifier">Username or email</label>
            <input
              id="identifier"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="you@example.com"
              autoComplete="username"
              required
            />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <PasswordInput
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          <div className="auth-row-between">
            <label className="auth-checkbox-row">
              <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
              <span>Remember me</span>
            </label>
            <Link to="/forgot-password" className="auth-inline-link">
              Forgot password?
            </Link>
          </div>

          {error && <p className="error-text">{error}</p>}

          <button className="btn btn-primary auth-submit" type="submit" disabled={submitting}>
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="auth-footer">
          New to Musify? <Link to="/register">Create an account</Link>
        </p>
      </div>
    </div>
  );
}