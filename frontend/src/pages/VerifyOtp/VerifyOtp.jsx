import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../components/Toast/ToastContext";
import { resendOtp } from "../../api/auth.api";
import OtpInput from "../../components/OtpInput/OtpInput";
import "../../styles/auth.css";
import "./VerifyOtp.css";

const RESEND_COOLDOWN_SECONDS = 45;

const COPY = {
  "verify-email": {
    heading: "Verify your email",
    sub: (masked) => `We sent a 6-digit verification code to ${masked || "your email"}.`,
    notice: "If you don't see the code, please check your spam or junk folder.",
    successMessage: "Email verified — you can sign in now.",
    submitLabel: "Verify email",
  },
  "first-login": {
    heading: "Confirm it's you",
    sub: (masked) =>
      `First time signing in on this device. We sent a 6-digit code to ${masked || "your email"}.`,
    successMessage: "Welcome to Musify.",
    submitLabel: "Confirm & continue",
  },
};

export default function VerifyOtp() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { verifyOtp } = useAuth();
  const { showToast } = useToast();

  const email = state?.email || "";
  const maskedEmail = state?.maskedEmail || "";
  const purpose = state?.purpose === "first-login" ? "first-login" : "verify-email";
  const rememberMe = Boolean(state?.rememberMe);

  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setCooldown((c) => (c > 0 ? c - 1 : 0));
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  const copy = COPY[purpose];

  const submit = useCallback(
    async (code) => {
      if (code.length !== 6 || submitting) return;
      setError("");
      setSubmitting(true);
      try {
        const data = await verifyOtp({ email, otp: code, purpose, rememberMe });
        showToast(data.message || copy.successMessage, { type: "success" });
        if (purpose === "first-login") {
          navigate(data.user?.role === "artist" ? "/studio" : "/library", { replace: true });
        } else {
          navigate("/login", { replace: true, state: { justVerified: true } });
        }
      } catch (err) {
        setError(err.message || "Invalid or expired code");
        setOtp("");
      } finally {
        setSubmitting(false);
      }
    },
    [email, purpose, rememberMe, submitting, verifyOtp, navigate, showToast, copy.successMessage]
  );

  // Auto-submit the moment all six digits are in — standard OTP-screen UX.
  useEffect(() => {
    if (otp.length === 6) submit(otp);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp]);

  const handleResend = async () => {
    if (cooldown > 0 || resending) return;
    setResending(true);
    setError("");
    try {
      await resendOtp({ email, purpose });
      showToast("A new code has been sent.", { type: "success" });
      setCooldown(RESEND_COOLDOWN_SECONDS);
      setOtp("");
    } catch (err) {
      showToast(err.message || "Could not resend code", { type: "error" });
    } finally {
      setResending(false);
    }
  };

  if (!email) {
    return (
      <div className="auth-screen">
        <div className="auth-card">
          <h1 className="auth-heading">Nothing to verify yet</h1>
          <p className="auth-sub">Start from registration or login to receive a code.</p>
          <Link to="/login" className="btn btn-primary auth-submit" style={{ textAlign: "center" }}>
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-wordmark" aria-label="Musify"><span className="brand-mark">M</span><span>MUSIFY</span></div>
        </div>
        <h1 className="auth-heading">{copy.heading}</h1>
        <p className="auth-sub">{copy.sub(maskedEmail)}</p>
        {copy.notice && <p className="otp-verify-notice">{copy.notice}</p>}

        <div className="otp-verify-body">
          <OtpInput value={otp} onChange={setOtp} disabled={submitting} error={Boolean(error)} />

          {error && <p className="field-error otp-verify-error">✗ {error}</p>}
          {submitting && <p className="field-hint otp-verify-checking">Verifying…</p>}

          <button
            type="button"
            className="btn btn-primary auth-submit"
            disabled={otp.length !== 6 || submitting}
            onClick={() => submit(otp)}
          >
            {submitting ? "Verifying…" : copy.submitLabel}
          </button>

          <button
            type="button"
            className="otp-resend-link"
            onClick={handleResend}
            disabled={cooldown > 0 || resending}
          >
            {resending ? "Sending…" : cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
          </button>
        </div>

        <p className="auth-footer">
          <Link to="/login">Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}
