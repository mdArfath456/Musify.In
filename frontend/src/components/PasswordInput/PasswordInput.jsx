import { useState } from "react";
import "./PasswordInput.css";

export default function PasswordInput({ id, value, onChange, placeholder, autoComplete, required }) {
    const [visible, setVisible] = useState(false);

    return (
        <div className="password-input">
            <input
                id={id}
                type={visible ? "text" : "password"}
                value={value}
                onChange={onChange}
                placeholder={placeholder || "••••••••"}
                autoComplete={autoComplete}
                required={required}
            />
            <button
                type="button"
                className="password-input-toggle"
                onClick={() => setVisible((v) => !v)}
                aria-label={visible ? "Hide password" : "Show password"}
            >
                {visible ? (
                    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                        <path d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 5.2A10.8 10.8 0 0 1 12 5c5.2 0 8.7 4.5 9.8 7-.4 1-1.2 2.3-2.4 3.5M6.2 6.2C3.9 7.8 2.6 10 2.2 12c1.1 2.5 4.6 7 9.8 7 1 0 2-.2 2.9-.5" />
                    </svg>
                ) : (
                    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                        <path d="M2.2 12C3.3 9.5 6.8 5 12 5s8.7 4.5 9.8 7c-1.1 2.5-4.6 7-9.8 7S3.3 14.5 2.2 12Z" />
                        <circle cx="12" cy="12" r="2.5" />
                    </svg>
                )}
            </button>
        </div>
    );
}