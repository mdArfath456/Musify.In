const crypto = require("crypto");

const OTP_TTL_MS = Number(process.env.OTP_EXPIRY_MINUTES || 10) * 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;

function generateOtp() {
    // 6-digit numeric OTP, zero-padded.
    return crypto.randomInt(0, 1000000).toString().padStart(6, "0");
}

// OTPs are short-lived and low-entropy (6 digits), so a fast SHA-256 hash is
// appropriate here — no need for bcrypt's deliberate slowness like passwords.
function hashOtp(otp) {
    return crypto.createHash("sha256").update(otp).digest("hex");
}

function otpExpiryDate() {
    return new Date(Date.now() + OTP_TTL_MS);
}

module.exports = { generateOtp, hashOtp, otpExpiryDate, OTP_TTL_MS, MAX_OTP_ATTEMPTS };