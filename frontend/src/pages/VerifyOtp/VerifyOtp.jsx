import { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useSignUp } from "@clerk/clerk-react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../components/Toast/ToastContext";
import "../../styles/auth.css";

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

export default function VerifyOtp() {
    if (!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY) return <ClerkUnavailable />;
    return <VerifyOtpForm />;
}

function VerifyOtpForm() {
    const location = useLocation();
    const navigate = useNavigate();
    const { isLoaded: clerkLoaded, signUp } = useSignUp();
    const { completeVerification } = useAuth();
    const { showToast } = useToast();

    const [email] = useState(location.state?.email || "");
    const [otp, setOtp] = useState("");
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [resending, setResending] = useState(false);

    // Two-step check: first Clerk confirms the code itself is right, then
    // our backend independently re-confirms that with Clerk's Backend API
    // before marking the account verified and logging the person in.
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!clerkLoaded || !signUp) {
            setError("Still loading — try again in a second.");
            return;
        }

        setSubmitting(true);
        try {
            const attempt = await signUp.attemptEmailAddressVerification({ code: otp });

            if (attempt.status !== "complete") {
                // Most likely cause: "Password" is still required in the Clerk
                // Dashboard's sign-up settings — turn it off, since this signup
                // only exists to verify an email, not to create a Clerk login.
                setError("Verification isn't complete yet — check your Clerk sign-up settings.");
                return;
            }

            const clerkUserId = attempt.createdUserId;
            const user = await completeVerification({ email, clerkUserId });
            showToast("Email verified — welcome to Musify!", { type: "success" });
            navigate(user.role === "artist" ? "/studio" : "/library");
        } catch (err) {
            const clerkMessage = err.errors?.[0]?.message;
            setError(clerkMessage || err.message || "Invalid or expired code");
        } finally {
            setSubmitting(false);
        }
    };

    const handleResend = async () => {
        if (!clerkLoaded || !signUp) return;
        setResending(true);
        try {
            await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
            showToast("A new code has been sent.", { type: "success" });
        } catch (err) {
            const clerkMessage = err.errors?.[0]?.message;
            showToast(clerkMessage || err.message || "Could not resend code", { type: "error" });
        } finally {
            setResending(false);
        }
    };

    if (!email) {
        return (
            <div className="auth-screen">
                <div className="auth-card">
                    <h1 className="auth-heading">No account to verify</h1>
                    <p className="auth-sub">Start from the sign-up page to get a verification code.</p>
                    <Link to="/register" className="btn btn-primary auth-submit" style={{ textAlign: "center" }}>
                        Go to sign up
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-screen">
            <div className="auth-card">
                <div className="auth-brand">
                    <span className="auth-brand-mark">M</span>
                    <span>Musify</span>
                </div>
                <h1 className="auth-heading">Verify your email</h1>
                <p className="auth-sub">Enter the 6-digit code sent to {email}.</p>

                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="field">
                        <label htmlFor="otp">Verification code</label>
                        <input
                            id="otp"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                            placeholder="123456"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            required
                        />
                    </div>

                    {error && <p className="error-text">{error}</p>}

                    <button className="btn btn-primary auth-submit" type="submit" disabled={submitting || otp.length !== 6}>
                        {submitting ? "Verifying…" : "Verify email"}
                    </button>
                </form>

                <p className="auth-footer">
                    Didn't get a code?{" "}
                    <button type="button" className="auth-link-button" onClick={handleResend} disabled={resending}>
                        {resending ? "Sending…" : "Resend code"}
                    </button>
                </p>
            </div>
        </div>
    );
}