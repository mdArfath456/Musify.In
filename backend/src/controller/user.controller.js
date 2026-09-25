const userRepository = require("../repositories/user.repository")
const bcrypt = require("bcrypt")
const dotenv = require("dotenv").config()
const jwt = require("jsonwebtoken")
const {
    validateUsername,
    validateEmail,
    validatePassword,
    validateRole,
    validateAge,
    validateTerms
} = require("../utils/validators")
const { generateOtp, hashOtp, otpExpiryDate, MAX_OTP_ATTEMPTS } = require("../utils/otp")
const { generateResetToken, hashResetToken, resetTokenExpiryDate } = require("../utils/reset-token")
const { sendOtpEmail, sendPasswordResetLinkEmail } = require("../services/email.service")
const { JWT_ISSUER, JWT_AUDIENCE } = require("../middlewares/auth.middleware")

const OTP_PURPOSES = ["verify-email", "first-login"]

// "a****@gmail.com" — enough for the person to recognize their own inbox
// without fully exposing it on an unauthenticated screen.
function maskEmail(email) {
    const [local, domain] = email.split("@")
    if (!domain) return email
    const visible = local.slice(0, 1)
    return `${visible}${"*".repeat(Math.max(local.length - 1, 3))}@${domain}`
}

const BCRYPT_ROUNDS = 12
const MAX_FAILED_ATTEMPTS = 5
const LOCK_DURATION_MS = 15 * 60 * 1000
const REMEMBER_ME_DAYS = 30
const DEFAULT_SESSION_DAYS = 7
const isProduction = process.env.NODE_ENV === "production"
const SESSION_COOKIE_OPTIONS = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "None" : "Lax",
    path: "/"
}

function issueSessionCookie(res, user, rememberMe) {
    const expiresIn = rememberMe ? `${REMEMBER_ME_DAYS}d` : `${DEFAULT_SESSION_DAYS}d`
    const maxAge = (rememberMe ? REMEMBER_ME_DAYS : DEFAULT_SESSION_DAYS) * 24 * 60 * 60 * 1000

    const token = jwt.sign(
        {
            id: user.id,
            role: user.role,
            tokenVersion: user.tokenVersion
        },
        process.env.JWT_SECRET,
        {
            expiresIn,
            issuer: JWT_ISSUER,
            audience: JWT_AUDIENCE
        }
    )

    res.cookie("token", token, {
        ...SESSION_COOKIE_OPTIONS,
        maxAge,
    })
}

function publicUser(user) {
    return {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified
    }
}

const registerUser = async (req, res) => {
    try {
        let { username, email, password, role = "user", age, acceptedTerms } = req.body

        username = typeof username === "string" ? username.trim().toLowerCase() : username
        email = typeof email === "string" ? email.trim().toLowerCase() : email

        const errors = {
            username: validateUsername(username),
            email: validateEmail(email),
            password: validatePassword(password),
            role: validateRole(role),
            age: validateAge(age),
            acceptedTerms: validateTerms(acceptedTerms)
        }
        const hasErrors = Object.values(errors).some(Boolean)
        if (hasErrors) {
            return res.status(400).json({
                message: "Please fix the highlighted fields",
                errors
            })
        }

        const isUserExist = await userRepository.findByUsernameOrEmail({ username, email })
        if (isUserExist) {
            const conflictField = isUserExist.email === email ? "email" : "username"
            return res.status(409).json({
                message: "An account with that email or username already exists",
                errors: { [conflictField]: "Already in use" }
            })
        }

        const hashPassword = await bcrypt.hash(password, BCRYPT_ROUNDS)
        const otp = generateOtp()

        const user = await userRepository.create({
            username,
            email,
            password: hashPassword,
            role,
            age: age || null,
            acceptedTerms: true,
            isVerified: false,
            otpHash: hashOtp(otp),
            otpPurpose: "verify-email",
            otpExpiry: otpExpiryDate()
        })

        try {
            await sendOtpEmail(user.email, otp, "verify-email")
        } catch (err) {
            console.error("Failed to send verification OTP email:", err.message)
            return res.status(502).json({
                message: "Your account was created, but we could not deliver the OTP. Please use resend code.",
                requiresOtp: true,
                emailDeliveryFailed: true,
                purpose: "verify-email",
                email: user.email,
                maskedEmail: maskEmail(user.email)
            })
        }

        return res.status(201).json({
            message: "Account created. We've sent a verification code to your email.",
            requiresOtp: true,
            purpose: "verify-email",
            email: user.email,
            maskedEmail: maskEmail(user.email),
            user: publicUser(user)
        })
    } catch (error) {
        return res.status(500).json({
            message: "Internal server error"
        })
    }
}

const verifyOtp = async (req, res) => {
    try {
        const { email, otp, purpose, rememberMe } = req.body
        if (!email || !otp || !purpose) {
            return res.status(400).json({ message: "Email, code, and purpose are required" })
        }
        if (purpose !== "verify-email" && purpose !== "first-login") {
            return res.status(400).json({ message: "Invalid OTP purpose" })
        }

        const genericInvalid = () => res.status(400).json({ message: "Invalid or expired code" })

        const user = await userRepository.findByEmail(email.trim().toLowerCase())
        if (!user || !user.otpHash || user.otpPurpose !== purpose) return genericInvalid()

        if (user.otpAttempts >= MAX_OTP_ATTEMPTS) {
            return res.status(429).json({ message: "Too many attempts. Please request a new code." })
        }

        if (user.otpExpiry < new Date()) {
            return res.status(400).json({ message: "This verification code has expired. Please request a new code." })
        }

        if (hashOtp(otp) !== user.otpHash) {
            await userRepository.updateById(user.id, { otpAttempts: user.otpAttempts + 1 })
            return res.status(400).json({ message: "Invalid verification code. Please try again." })
        }

        if (purpose === "verify-email") {
            const updated = await userRepository.updateById(user.id, {
                isVerified: true,
                otpHash: null,
                otpPurpose: null,
                otpExpiry: null,
                otpAttempts: 0
            })
            return res.status(200).json({
                message: "Email verified successfully. You can now log in.",
                verified: true,
                user: publicUser(updated)
            })
        }

        // purpose === "first-login": this is the final authenticated
        // session, so only now do we issue the JWT/session cookie.
        const updated = await userRepository.updateById(user.id, {
            firstLoginVerified: true,
            otpHash: null,
            otpPurpose: null,
            otpExpiry: null,
            otpAttempts: 0,
            failedLoginAttempts: 0
        })

        issueSessionCookie(res, updated, Boolean(rememberMe))

        return res.status(200).json({
            message: "Logged in successfully",
            verified: true,
            user: publicUser(updated)
        })
    } catch (error) {
        return res.status(500).json({ message: "Internal server error" })
    }
}

const resendOtp = async (req, res) => {
    try {
        const { email, purpose = "verify-email" } = req.body
        const generic = { message: "If that account is eligible, a new code has been sent." }
        if (!email) {
            return res.status(400).json({ message: "Email is required" })
        }
        if (!OTP_PURPOSES.includes(purpose)) return res.status(400).json({ message: "Invalid OTP purpose" })

        const user = await userRepository.findByEmail(email.trim().toLowerCase())
        if (!user) return res.status(200).json(generic)

        // Don't re-send (or reveal state) for a purpose that no longer applies.
        if (purpose === "verify-email" && user.isVerified) return res.status(200).json(generic)
        if (purpose === "first-login" && (!user.isVerified || user.firstLoginVerified)) {
            return res.status(200).json(generic)
        }

        const otp = generateOtp()
        await userRepository.updateById(user.id, {
            otpHash: hashOtp(otp),
            otpPurpose: purpose,
            otpExpiry: otpExpiryDate(),
            otpAttempts: 0
        })

        try {
            await sendOtpEmail(user.email, otp, purpose)
        } catch (err) {
            console.error("Failed to send OTP email:", err.message)
            return res.status(502).json({ message: "We could not deliver the OTP. Please try again." })
        }

        return res.status(200).json(generic)
    } catch (error) {
        return res.status(500).json({ message: "Internal server error" })
    }
}

const userLogin = async (req, res) => {
    try {
        const { username, email, password, rememberMe } = req.body
        const identifierUsername = typeof username === "string" ? username.trim().toLowerCase() : username
        const identifierEmail = typeof email === "string" ? email.trim().toLowerCase() : email

        if (!password || (!identifierUsername && !identifierEmail)) {
            return res.status(400).json({ message: "Username/email and password are required" })
        }

        const user = await userRepository.findByUsernameOrEmail({
            username: identifierUsername,
            email: identifierEmail
        })

        const genericFailure = () =>
            res.status(401).json({ message: "Invalid username/email or password" })

        if (!user) return genericFailure()

        if (user.lockUntil && user.lockUntil > new Date()) {
            const minutesLeft = Math.ceil((user.lockUntil - new Date()) / 60000)
            return res.status(423).json({
                message: `Too many failed attempts. Try again in ${minutesLeft} minute${minutesLeft === 1 ? "" : "s"}.`
            })
        }

        const isPasswordValid = await bcrypt.compare(password, user.password)
        if (!isPasswordValid) {
            const failedLoginAttempts = user.failedLoginAttempts + 1
            const patch = { failedLoginAttempts }
            if (failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
                patch.lockUntil = new Date(Date.now() + LOCK_DURATION_MS)
                patch.failedLoginAttempts = 0
            }
            await userRepository.updateById(user.id, patch)
            return genericFailure()
        }

        // Credentials are correct from here on, so failed-attempt tracking
        // resets regardless of which verification step comes next.
        const afterPassword = await userRepository.updateById(user.id, { failedLoginAttempts: 0 })

        if (!afterPassword.isVerified) {
            const otp = generateOtp()
            const withOtp = await userRepository.updateById(user.id, {
                otpHash: hashOtp(otp),
                otpPurpose: "verify-email",
                otpExpiry: otpExpiryDate(),
                otpAttempts: 0
            })
            try {
                await sendOtpEmail(withOtp.email, otp, "verify-email")
            } catch (err) {
                console.error("Failed to send verification OTP email:", err.message)
                return res.status(502).json({
                    message: "We could not deliver the verification OTP. Please try again.",
                    requiresOtp: true,
                    emailDeliveryFailed: true,
                    purpose: "verify-email",
                    email: withOtp.email,
                    maskedEmail: maskEmail(withOtp.email)
                })
            }
            return res.status(403).json({
                message: "Please verify your email to continue.",
                requiresOtp: true,
                purpose: "verify-email",
                email: withOtp.email,
                maskedEmail: maskEmail(withOtp.email)
            })
        }

        if (!afterPassword.firstLoginVerified) {
            const otp = generateOtp()
            const withOtp = await userRepository.updateById(user.id, {
                otpHash: hashOtp(otp),
                otpPurpose: "first-login",
                otpExpiry: otpExpiryDate(),
                otpAttempts: 0
            })
            try {
                await sendOtpEmail(withOtp.email, otp, "first-login")
            } catch (err) {
                console.error("Failed to send first-login OTP email:", err.message)
                return res.status(502).json({
                    message: "We could not deliver the first-login OTP. Please try again.",
                    requiresOtp: true,
                    emailDeliveryFailed: true,
                    purpose: "first-login",
                    email: withOtp.email,
                    maskedEmail: maskEmail(withOtp.email)
                })
            }
            return res.status(200).json({
                message: "We've sent a one-time verification code to your email.",
                requiresOtp: true,
                purpose: "first-login",
                email: withOtp.email,
                maskedEmail: maskEmail(withOtp.email)
            })
        }

        issueSessionCookie(res, afterPassword, Boolean(rememberMe))

        return res.status(200).json({
            message: "Logged in successfully",
            user: publicUser(afterPassword)
        })
    } catch (error) {
        return res.status(500).json({ message: "Internal server error" })
    }
}

const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body
        if (!email) return res.status(400).json({ message: "Email is required" })

        const user = await userRepository.findByEmail(email.trim().toLowerCase())
        const generic = { message: "If that account exists, a password reset link has been sent." }
        if (!user) return res.status(200).json(generic)

        const resetToken = generateResetToken()
        const resetTokenHash = hashResetToken(resetToken)
        const resetTokenExpiresAt = resetTokenExpiryDate()
        await userRepository.updateById(user.id, {
            resetTokenHash,
            resetTokenExpiresAt
        })

        sendPasswordResetLinkEmail(user.email, resetToken).catch((err) => {
            console.error("Failed to send password reset link email:", err.message)
        })
        return res.status(200).json(generic)
    } catch (error) {
        return res.status(500).json({ message: "Internal server error" })
    }
}

const resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body
        if (!token || !newPassword) {
            return res.status(400).json({ message: "Reset token and new password are required" })
        }

        const passwordError = validatePassword(newPassword)
        if (passwordError) {
            return res.status(400).json({ message: passwordError, errors: { newPassword: passwordError } })
        }

        const tokenHash = hashResetToken(token)
        const user = await userRepository.findByResetTokenHash(tokenHash)
        if (!user) return res.status(400).json({ message: "That reset link is invalid or expired. Request a new one." })

        const sameAsBefore = await bcrypt.compare(newPassword, user.password)
        if (sameAsBefore) {
            return res.status(400).json({
                message: "New password must be different from your current password",
                errors: { newPassword: "Must be different from your current password" }
            })
        }

        const updated = await userRepository.updatePasswordWithResetToken({
            id: user.id,
            tokenHash,
            password: await bcrypt.hash(newPassword, BCRYPT_ROUNDS),
            tokenVersion: user.tokenVersion + 1
        })
        if (!updated) return res.status(400).json({ message: "That reset link is invalid or expired. Request a new one." })

        return res.status(200).json({ message: "Password reset successfully. You can now log in." })
    } catch (error) {
        return res.status(500).json({ message: "Internal server error" })
    }
}

const checkAvailability = async (req, res) => {
    try {
        const { username, email } = req.query
        const result = {}

        if (username) {
            const exists = await userRepository.existsByUsername(username.trim().toLowerCase())
            result.username = { available: !exists }
        }
        if (email) {
            const exists = await userRepository.existsByEmail(email.trim().toLowerCase())
            result.email = { available: !exists }
        }

        return res.status(200).json({ message: "Checked", ...result })
    } catch (error) {
        return res.status(500).json({ message: "Internal server error" })
    }
}

const userLogout = async (req, res) => {
    try {
        res.clearCookie("token", SESSION_COOKIE_OPTIONS);
        return res.status(200).json({
            message: "Logged out successfully"
        });
    } catch (error) {
        return res.status(500).json({
            message: "Internal server error"
        });
    }
};

const logoutAllDevices = async (req, res) => {
    try {
        const user = await userRepository.findById(req.user.id)
        if (!user) return res.status(404).json({ message: "User not found" })

        await userRepository.updateById(user.id, { tokenVersion: user.tokenVersion + 1 })

        res.clearCookie("token", SESSION_COOKIE_OPTIONS);

        return res.status(200).json({ message: "Logged out of all devices" })
    } catch (error) {
        return res.status(500).json({ message: "Internal server error" })
    }
}

module.exports = {
    registerUser,
    verifyOtp,
    resendOtp,
    userLogin,
    forgotPassword,
    resetPassword,
    checkAvailability,
    userLogout,
    logoutAllDevices
}
