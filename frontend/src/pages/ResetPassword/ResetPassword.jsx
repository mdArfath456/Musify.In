import { useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { resetPassword } from "../../api/auth.api";
import { useToast } from "../../components/Toast/ToastContext";
import PasswordInput from "../../components/PasswordInput/PasswordInput";
import PasswordStrengthMeter from "../../components/PasswordStrengthMeter/PasswordStrengthMeter";
import "../../styles/auth.css";

function clientPasswordError(password) {
    if (!password) return "Password is required";
    if (password.length < 8) return "At least 8 characters";
    if (!/[a-z]/.test(password)) return "Add a lowercase letter";
    if (!/[A-Z]/.test(password)) return "Add an uppercase letter";
    if (!/[0-9]/.test(password)) return "Add a number";
    if (!/[^a-zA-Z0-9]/.test(password)) return "Add a special character";
    return null;
}

export default function ResetPassword() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { showToast } = useToast();

    const token = searchParams.get("token") || "";
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);

    if (!token) {
        return (
            <div className="auth-screen">
                <div className="auth-card">
                    <h1 className="auth-heading">Invalid reset link</h1>
                    <p className="auth-sub">This password reset link is missing or incomplete.</p>
                    <Link to="/forgot-password" className="btn btn-primary auth-submit" style={{ textAlign: "center" }}>
                        Go there now
                    </Link>
                </div>
            </div>
        );
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        const passwordError = clientPasswordError(newPassword);
        if (passwordError) return setError(passwordError);
        if (newPassword !== confirmPassword) return setError("Passwords don't match");

        setSubmitting(true);
        try {
            await resetPassword({ token, newPassword });
            setSuccess(true);
            showToast("Password reset — you can sign in now.", { type: "success" });
            window.setTimeout(() => navigate("/login"), 1800);
        } catch (err) {
            setError(err.message || "Could not reset password");
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
                <h1 className="auth-heading">Set a new password</h1>
                <p className="auth-sub">Choose a new password for your Musify account.</p>

                {success ? (
                    <p className="field-hint field-hint-success">Password reset successfully. Redirecting to sign in…</p>
                ) : <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="field">
                        <label htmlFor="newPassword">New password</label>
                        <PasswordInput id="newPassword" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                        <PasswordStrengthMeter password={newPassword} />
                    </div>
                    <div className="field">
                        <label htmlFor="confirmPassword">Confirm new password</label>
                        <PasswordInput
                            id="confirmPassword"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                    </div>

                    {error && <p className="error-text">{error}</p>}

                    <button className="btn btn-primary auth-submit" type="submit" disabled={submitting}>
                        {submitting ? "Resetting…" : "Reset password"}
                    </button>
                </form>}

                <p className="auth-footer">
                    <Link to="/login">Back to sign in</Link>
                </p>
            </div>
        </div>
    );
}