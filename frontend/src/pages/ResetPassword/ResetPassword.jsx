import { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
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
    const location = useLocation();
    const navigate = useNavigate();
    const { showToast } = useToast();

    const [email] = useState(location.state?.email || "");
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    if (!email) {
        return (
            <div className="auth-screen">
                <div className="auth-card">
                    <h1 className="auth-heading">Start from forgot password</h1>
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
            await resetPassword({ email, otp, newPassword });
            showToast("Password reset — you can sign in now.", { type: "success" });
            navigate("/login");
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
                    <span className="auth-brand-mark">M</span>
                    <span>Musify</span>
                </div>
                <h1 className="auth-heading">Set a new password</h1>
                <p className="auth-sub">Enter the code sent to {email} and choose a new password.</p>

                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="field">
                        <label htmlFor="otp">Verification code</label>
                        <input
                            id="otp"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                            placeholder="123456"
                            inputMode="numeric"
                            required
                        />
                    </div>
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
                </form>

                <p className="auth-footer">
                    <Link to="/login">Back to sign in</Link>
                </p>
            </div>
        </div>
    );
}