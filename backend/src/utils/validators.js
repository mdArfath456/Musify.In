// Shared, framework-agnostic validators for auth fields.

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Letters, numbers, underscore, dot — no spaces. Matches the spec's
// examples: "arfath", "md_arfath", "music.lover".
const USERNAME_REGEX = /^[a-zA-Z0-9_.]{3,20}$/;

function validateUsername(username) {
    if (!username || !username.trim()) return "Username is required";
    const trimmed = username.trim();
    if (trimmed.includes(" ")) return "Username can't contain spaces";
    if (!USERNAME_REGEX.test(trimmed)) {
        return "Username must be 3-20 characters — letters, numbers, underscores, and dots only";
    }
    return null;
}

function validateEmail(email) {
    if (!email || !email.trim()) return "Email is required";
    if (!EMAIL_REGEX.test(email.trim())) return "Enter a valid email address";
    return null;
}

// Standard production baseline: 8+ chars, upper, lower, number, symbol.
function validatePassword(password) {
    if (!password) return "Password is required";
    if (password.length < 8) return "Password must be at least 8 characters";
    if (password.length > 72) return "Password must be under 72 characters";
    if (!/[a-z]/.test(password)) return "Password must include a lowercase letter";
    if (!/[A-Z]/.test(password)) return "Password must include an uppercase letter";
    if (!/[0-9]/.test(password)) return "Password must include a number";
    if (!/[^a-zA-Z0-9]/.test(password)) return "Password must include a special character";
    return null;
}

function validateRole(role) {
    if (role && !["user", "artist"].includes(role)) {
        return "Role must be either 'user' or 'artist'";
    }
    return null;
}

// Optional field — only validated if the person actually supplied a value.
function validateAge(age) {
    if (age === undefined || age === null || age === "") return null;
    const n = Number(age);
    if (!Number.isInteger(n)) return "Age must be a whole number";
    if (n < 13) return "You must be at least 13 to use Musify";
    if (n > 120) return "Enter a valid age";
    return null;
}

function validateTerms(acceptedTerms) {
    if (acceptedTerms !== true) return "You must accept the Terms & Conditions";
    return null;
}

module.exports = {
    validateUsername,
    validateEmail,
    validatePassword,
    validateRole,
    validateAge,
    validateTerms
};