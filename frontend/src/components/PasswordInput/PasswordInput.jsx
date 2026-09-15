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
                tabIndex={-1}
            >
                {visible ? "🙈" : "👁"}
            </button>
        </div>
    );
}