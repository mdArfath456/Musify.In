import { useRef, useEffect } from "react";
import "./OtpInput.css";

const LENGTH = 6;

/**
 * Six individual digit boxes acting as one logical OTP value.
 * `value` / `onChange` carry the full digit string ("" to LENGTH digits) —
 * the box splitting is purely presentational.
 */
export default function OtpInput({ value, onChange, disabled, error, autoFocus = true }) {
  const inputRefs = useRef([]);
  const digits = value.padEnd(LENGTH, " ").split("").map((c) => (c === " " ? "" : c));

  useEffect(() => {
    if (autoFocus) inputRefs.current[0]?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setDigit = (index, char) => {
    const next = digits.slice();
    next[index] = char;
    onChange(next.join("").replace(/\s+$/, ""));
  };

  const handleChange = (index) => (e) => {
    const raw = e.target.value.replace(/\D/g, "");
    if (!raw) {
      setDigit(index, "");
      return;
    }
    // Handles a full paste landing in one box as well as a single keystroke.
    if (raw.length > 1) {
      const next = digits.slice();
      for (let i = 0; i < raw.length && index + i < LENGTH; i += 1) {
        next[index + i] = raw[i];
      }
      onChange(next.join("").replace(/\s+$/, ""));
      const lastFilled = Math.min(index + raw.length, LENGTH) - 1;
      inputRefs.current[lastFilled]?.focus();
      return;
    }
    setDigit(index, raw);
    if (index < LENGTH - 1) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index) => (e) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && index > 0) inputRefs.current[index - 1]?.focus();
    if (e.key === "ArrowRight" && index < LENGTH - 1) inputRefs.current[index + 1]?.focus();
  };

  const handlePaste = (index) => (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "");
    if (!pasted) return;
    e.preventDefault();
    const next = digits.slice();
    for (let i = 0; i < pasted.length && index + i < LENGTH; i += 1) {
      next[index + i] = pasted[i];
    }
    onChange(next.join("").replace(/\s+$/, ""));
    const lastFilled = Math.min(index + pasted.length, LENGTH) - 1;
    inputRefs.current[Math.max(lastFilled, 0)]?.focus();
  };

  return (
    <div className={`otp-input-row ${error ? "otp-input-row-error" : ""}`} role="group" aria-label="Verification code">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => (inputRefs.current[index] = el)}
          className="otp-digit"
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          maxLength={LENGTH}
          value={digit}
          disabled={disabled}
          onChange={handleChange(index)}
          onKeyDown={handleKeyDown(index)}
          onPaste={handlePaste(index)}
          aria-label={`Digit ${index + 1} of ${LENGTH}`}
        />
      ))}
    </div>
  );
}
