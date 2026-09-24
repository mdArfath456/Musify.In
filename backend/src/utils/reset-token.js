const crypto = require("crypto")

const RESET_TOKEN_TTL_MS = 15 * 60 * 1000

function generateResetToken() {
    return crypto.randomBytes(32).toString("hex")
}

function hashResetToken(token) {
    return crypto.createHash("sha256").update(token).digest("hex")
}

function resetTokenExpiryDate() {
    return new Date(Date.now() + RESET_TOKEN_TTL_MS)
}

module.exports = { generateResetToken, hashResetToken, resetTokenExpiryDate }
