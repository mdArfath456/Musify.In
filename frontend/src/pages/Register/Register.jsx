import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSignUp } from "@clerk/clerk-react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../components/Toast/ToastContext";
import { checkAvailability } from "../../api/auth.api";
import PasswordInput from "../../components/PasswordInput/PasswordInput";
import PasswordStrengthMeter from "../../components/PasswordStrengthMeter/PasswordStrengthMeter";
import "../../styles/auth.css";

const USERNAME_REGEX = /^[a-zA-Z0-9_.]{3,20}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clientPasswordError(password) {
  if (!password) return "Password is required";
  if (password.length < 8) return "At least 8 characters";
  if (!/[a-z]/.test(password)) return "Add a lowercase letter";
  if (!/[A-Z]/.test(password)) return "Add an uppercase letter";
  if (!/[0-9]/.test(password)) return "Add a number";
  if (!/[^a-zA-Z0-9]/.test(password)) return "Add a special character";
  return null;
}

function ClerkUnavailable() {
  return (
    <div className="auth-screen">
      <div className="auth-card">
        <h1 className="auth-heading">Email verification unavailable</h1>
        <p className="auth-sub">The Clerk publishable key is not configured for this frontend.</p>
        <Link to="/login" className="btn btn-primary auth-submit" style={{ textAlign: "center" }}>
          Back to login
        </Link>
      </div>
    </div>
  );
}

export default function Register() {
  if (!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY) return <ClerkUnavailable />;
  return <RegisterForm />;
}

function RegisterForm() {
  const { register } = useAuth();
  const { isLoaded: clerkLoaded, signUp } = useSignUp();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    age: "",
    role: "user",
    acceptedTerms: false,
  });
  const [errors, setErrors] = useState({});
  const [availability, setAvailability] = useState({ username: null, email: null });
  const [checking, setChecking] = useState({ username: false, email: false });
  const [submitting, setSubmitting] = useState(false);
  const debounceRef = useRef({});

  const update = (key) => (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [key]: value }));
  };

  // Debounced live-validation: checks username/email availability 500ms
  // after the person stops typing, rather than on every keystroke.
  useEffect(() => {
    if (!form.username || !USERNAME_REGEX.test(form.username.trim())) {
      setAvailability((a) => ({ ...a, username: null }));
      return;
    }
    clearTimeout(debounceRef.current.username);
    debounceRef.current.username = setTimeout(async () => {
      setChecking((c) => ({ ...c, username: true }));
      try {
        const data = await checkAvailability({ username: form.username.trim().toLowerCase() });
        setAvailability((a) => ({ ...a, username: data.username?.available ?? null }));
      } catch {
        setAvailability((a) => ({ ...a, username: null }));
      } finally {
        setChecking((c) => ({ ...c, username: false }));
      }
    }, 500);
    return () => clearTimeout(debounceRef.current.username);
  }, [form.username]);

  useEffect(() => {
    if (!form.email || !EMAIL_REGEX.test(form.email.trim())) {
      setAvailability((a) => ({ ...a, email: null }));
      return;
    }
    clearTimeout(debounceRef.current.email);
    debounceRef.current.email = setTimeout(async () => {
      setChecking((c) => ({ ...c, email: true }));
      try {
        const data = await checkAvailability({ email: form.email.trim().toLowerCase() });
        setAvailability((a) => ({ ...a, email: data.email?.available ?? null }));
      } catch {
        setAvailability((a) => ({ ...a, email: null }));
      } finally {
        setChecking((c) => ({ ...c, email: false }));
      }
    }, 500);
    return () => clearTimeout(debounceRef.current.email);
  }, [form.email]);

  const validate = () => {
    const next = {};
    if (!form.username.trim()) next.username = "Username is required";
    else if (!USERNAME_REGEX.test(form.username.trim())) {
      next.username = "3-20 characters — letters, numbers, underscores, and dots only";
    } else if (availability.username === false) {
      next.username = "That username is taken";
    }

    if (!form.email.trim()) next.email = "Email is required";
    else if (!EMAIL_REGEX.test(form.email.trim())) next.email = "Enter a valid email address";
    else if (availability.email === false) next.email = "An account already uses that email";

    const passwordError = clientPasswordError(form.password);
    if (passwordError) next.password = passwordError;

    if (form.confirmPassword !== form.password) next.confirmPassword = "Passwords don't match";

    if (form.age && (Number(form.age) < 13 || Number(form.age) > 120)) {
      next.age = "You must be at least 13";
    }

    if (!form.acceptedTerms) next.acceptedTerms = "You must accept the Terms & Conditions";

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    if (!clerkLoaded) {
      showToast("Still loading — try again in a second.", { type: "error" });
      return;
    }

    setSubmitting(true);
    try {
      const data = await register({
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
        age: form.age || undefined,
        acceptedTerms: form.acceptedTerms,
      });

      // Our own account row now exists (unverified). The verification code
      // itself is sent and checked by Clerk — kick that off here so the
      // email is already on its way by the time the person reaches the
      // verify-otp page.
      await signUp.create({ emailAddress: data.email });
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });

      showToast("Check your email for a verification code.", { type: "success" });
      navigate("/verify-otp", { state: { email: data.email } });
    } catch (err) {
      if (err.fieldErrors) setErrors(err.fieldErrors);
      // Clerk errors come back shaped as { errors: [{ message }] } rather
      // than our own backend's { message }.
      const clerkMessage = err.errors?.[0]?.message;
      showToast(clerkMessage || err.message || "Could not create account", { type: "error" });
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
        <h1 className="auth-heading">Cut your first track</h1>
        <p className="auth-sub">Create an account to listen, or to upload as an artist.</p>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label htmlFor="username">Username</label>
            <input id="username" value={form.username} onChange={update("username")} autoComplete="username" />
            {checking.username && <p className="field-hint">Checking…</p>}
            {!checking.username && availability.username === true && !errors.username && (
              <p className="field-hint field-hint-success">✓ Username available</p>
            )}
            {errors.username && <p className="field-error">✗ {errors.username}</p>}
          </div>

          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" value={form.email} onChange={update("email")} autoComplete="email" />
            {checking.email && <p className="field-hint">Checking…</p>}
            {!checking.email && availability.email === true && !errors.email && (
              <p className="field-hint field-hint-success">✓ Email available</p>
            )}
            {errors.email && <p className="field-error">✗ {errors.email}</p>}
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
            <PasswordInput
              id="password"
              value={form.password}
              onChange={update("password")}
              autoComplete="new-password"
            />
            <PasswordStrengthMeter password={form.password} />
            {errors.password && <p className="field-error">✗ {errors.password}</p>}
          </div>

          <div className="field">
            <label htmlFor="confirmPassword">Confirm password</label>
            <PasswordInput
              id="confirmPassword"
              value={form.confirmPassword}
              onChange={update("confirmPassword")}
              autoComplete="new-password"
            />
            {errors.confirmPassword && <p className="field-error">✗ {errors.confirmPassword}</p>}
          </div>

          <div className="field">
            <label htmlFor="age">Age (optional)</label>
            <input id="age" type="number" min="13" max="120" value={form.age} onChange={update("age")} />
            {errors.age && <p className="field-error">✗ {errors.age}</p>}
          </div>

          <div className="field">
            <label>I am joining as</label>
            <div className="role-toggle">
              <button
                type="button"
                className={`role-option ${form.role === "user" ? "selected" : ""}`}
                onClick={() => setForm((f) => ({ ...f, role: "user" }))}
              >
                Listener
              </button>
              <button
                type="button"
                className={`role-option ${form.role === "artist" ? "selected" : ""}`}
                onClick={() => setForm((f) => ({ ...f, role: "artist" }))}
              >
                Artist
              </button>
            </div>
          </div>

          <div className="auth-checkbox-row">
            <input type="checkbox" checked={form.acceptedTerms} onChange={update("acceptedTerms")} />
            <span>
              I agree to the <Link className="auth-inline-link" to="/terms">Terms &amp; Conditions</Link>
            </span>
          </div>
          {errors.acceptedTerms && <p className="field-error">✗ {errors.acceptedTerms}</p>}

          <button className="btn btn-primary auth-submit" type="submit" disabled={submitting}>
            {submitting ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}