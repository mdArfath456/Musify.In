import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { forgotPassword } from "../../api/auth.api";
import { useToast } from "../../components/Toast/ToastContext";
import "../../styles/auth.css";

export default function ForgotPassword() {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [email, setEmail] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [sent, setSent] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await forgotPassword({ email });
            setSent(true);
        } catch (err) {
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
                <h1 className="auth-heading">Reset your password</h1>
                <p className="auth-sub">We'll email you a code to reset it.</p>

                {sent ? (
                    <>
                        <p className="field-hint field-hint-success" style={{ marginBottom: "var(--space-5)" }}>
                            If that account exists, a reset code has been sent to {email}.
                        </p>
                        <button
                            className="btn btn-primary auth-submit"
                            onClick={() => navigate("/reset-password", { state: { email } })}
                        >
                            Enter code
                        </button>
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
                        <button className="btn btn-primary auth-submit" type="submit" disabled={submitting}>
                            {submitting ? "Sending…" : "Send reset code"}
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