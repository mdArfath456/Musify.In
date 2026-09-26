import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import PasswordInput from "../../components/PasswordInput/PasswordInput";
import "../../styles/auth.css";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
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
      const data = await login({
        identifier,
        password,
        rememberMe,
      });

      if (data?.requiresOtp) {
        navigate("/verify-otp", {
          state: {
            email: data.email,
            maskedEmail: data.maskedEmail,
            purpose: data.purpose,
            rememberMe,
          },
        });
        return;
      }

      if (!data?.user) {
        throw new Error(
          data?.message || "Login succeeded, but no user information was returned."
        );
      }

      navigate(data.user.role === "artist" ? "/studio" : "/library");
    } catch (err) {
      setError(err.message || "Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-wordmark" aria-label="Musify">
            <span className="brand-mark">M</span>
            <span>MUSIFY</span>
          </div>
        </div>

        <h1 className="auth-heading">Welcome back to the record</h1>

        <p className="auth-sub">
          Sign in to keep spinning your library.
        </p>

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
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />

              <span>Remember me</span>
            </label>

            <Link
              to="/forgot-password"
              className="auth-inline-link"
            >
              Forgot password?
            </Link>
          </div>

          {error && <p className="error-text">{error}</p>}

          <button
            className="btn btn-primary auth-submit"
            type="submit"
            disabled={submitting}
          >
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="auth-footer">
          New to Musify?{" "}
          <Link to="/register">Create an account</Link>
        </p>
      </div>
    </div>
  );
}