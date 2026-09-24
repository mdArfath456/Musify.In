import "./PasswordStrengthMeter.css";

function scorePassword(password) {
    if (!password) return 0;
    let score = 0;
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^a-zA-Z0-9]/.test(password)) score += 1;
    return Math.min(score, 4);
}

const LABELS = ["Too weak", "Weak", "Fair", "Strong", "Very strong"];

export default function PasswordStrengthMeter({ password }) {
    if (!password) return null;
    const score = scorePassword(password);

    return (
        <div className="password-strength">
            <div className="password-strength-bars">
                {[0, 1, 2, 3].map((i) => (
                    <div key={i} className={`password-strength-bar ${i < score ? `filled level-${score}` : ""}`} />
                ))}
            </div>
            <span className={`password-strength-label level-${score}`}>{LABELS[score]}</span>
        </div>
    );
}