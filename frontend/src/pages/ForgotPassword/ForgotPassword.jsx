import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { forgotPassword, isCapacitorNative } from "../../api/auth.api";
import "../../styles/auth.css";

export default function ForgotPassword() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSubmitting(true);
        try {
            await forgotPassword({ email });
            if (isCapacitorNative) {
                navigate("/verify-otp", { state: { email, purpose: "password-reset" } });
            } else {
                setSent(true);
            }
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
                    <div className="auth-wordmark" aria-label="Musify"><span className="brand-mark">M</span><span>MUSIFY</span></div>
                </div>
                <h1 className="auth-heading">Reset your password</h1>
                <p className="auth-sub">
                    {isCapacitorNative ? "We'll email you a code to reset it." : "We'll email you a secure link to reset it."}
                </p>

                {sent ? (
                    <>
                        <p className="field-hint field-hint-success" style={{ marginBottom: "var(--space-5)" }}>
                            If that account exists, a secure reset link has been sent to {email}.
                        </p>
                        <Link to="/login" className="btn btn-primary auth-submit" style={{ textAlign: "center" }}>
                            Return to sign in
                        </Link>
                    </>
                ) : (
                    <form className="auth-form" onSubmit={handleSubmit}>
                        <div className="field">
                            <label htmlFor="email">Email</label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                autoComplete="email"
                                required
                            />
                        </div>
                        {error && <p className="error-text">{error}</p>}
                        <button className="btn btn-primary auth-submit" type="submit" disabled={submitting}>
                            {submitting ? "Sending…" : isCapacitorNative ? "Send reset code" : "Send reset link"}
                        </button>
                    </form>
                )}

                <p className="auth-footer">
                    Remembered it? <Link to="/login">Back to sign in</Link>
                </p>
            </div>
        </div>
    );
}