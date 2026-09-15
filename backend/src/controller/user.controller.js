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
const { generateOtp, hashOtp, otpExpiryDate } = require("../utils/otp")
const { sendOtpEmail } = require("../services/email.service")
const { isEmailVerifiedOnClerk } = require("../services/clerk.service")
const { JWT_ISSUER, JWT_AUDIENCE } = require("../middlewares/auth.middleware")

const BCRYPT_ROUNDS = 12
const MAX_FAILED_ATTEMPTS = 5
const LOCK_DURATION_MS = 15 * 60 * 1000
const REMEMBER_ME_DAYS = 30
const DEFAULT_SESSION_DAYS = 7

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
        httpOnly: true,
        secure: true,
        sameSite: "None",
        maxAge,
        path: "/"
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

        // Email verification for signup is handled by Clerk now (the
        // frontend drives the whole send-code/enter-code exchange with
        // Clerk's SDK) — no OTP of our own to generate or email here.
        // otp* columns stay null until this account later uses
        // forgot-password, which still runs through our own OTP + Brevo.
        const user = await userRepository.create({
            username,
            email,
            password: hashPassword,
            role,
            age: age || null,
            acceptedTerms: true,
            isVerified: false,
            otpHash: null,
            otpPurpose: null,
            otpExpiry: null
        })

        return res.status(201).json({
            message: "Account created. Check your email for a verification code.",
            needsVerification: true,
            email: user.email
        })
    } catch (error) {
        return res.status(500).json({
            message: "Internal server error"
        })
    }
}

// Email verification now runs on Clerk: the frontend does the actual
// send-code / enter-code exchange with Clerk's SDK directly, then hands us
// the resulting Clerk user id. We independently re-check that user's email
// verification status against Clerk's Backend API before trusting it —
// never take the frontend's word for it.
const verifyOtp = async (req, res) => {
    try {
        const { email, clerkUserId } = req.body
        if (!email || !clerkUserId) {
            return res.status(400).json({ message: "Email and Clerk user id are required" })
        }

        const user = await userRepository.findByEmail(email.trim().toLowerCase())
        if (!user) {
            return res.status(400).json({ message: "Invalid verification request" })
        }
        if (user.isVerified) {
            return res.status(400).json({ message: "This account is already verified" })
        }

        const verified = await isEmailVerifiedOnClerk(clerkUserId, user.email)
        if (!verified) {
            return res.status(400).json({ message: "Email isn't verified yet — check the code and try again." })
        }

        const updated = await userRepository.updateById(user.id, { isVerified: true })

        issueSessionCookie(res, updated, false)

        return res.status(200).json({
            message: "Email verified successfully",
            user: publicUser(updated)
        })
    } catch (error) {
        return res.status(500).json({ message: "Internal server error" })
    }
}

// Only used for the forgot-password flow now — signup's verification code
// is resent by calling Clerk directly from the frontend (see VerifyOtp.jsx).
const resendOtp = async (req, res) => {
    try {
        const { email, purpose = "reset-password" } = req.body
        if (!email) {
            return res.status(400).json({ message: "Email is required" })
        }
        if (purpose !== "reset-password") {
            return res.status(400).json({ message: "Use Clerk to resend an email-verification code." })
        }

        const user = await userRepository.findByEmail(email.trim().toLowerCase())
        if (!user) {
            return res.status(200).json({ message: "If that account exists, a new code has been sent." })
        }

        const otp = generateOtp()
        await userRepository.updateById(user.id, {
            otpHash: hashOtp(otp),
            otpPurpose: purpose,
            otpExpiry: otpExpiryDate()
        })

        sendOtpEmail(user.email, otp, purpose).catch((err) => {
            console.error("Failed to send OTP email:", err.message)
        })

        return res.status(200).json({ message: "If that account exists, a new code has been sent." })
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

        if (!user.isVerified) {
            return res.status(403).json({
                message: "Please verify your email first.",
                needsVerification: true,
                email: user.email
            })
        }

        const updated = await userRepository.updateById(user.id, { failedLoginAttempts: 0 })

        issueSessionCookie(res, updated, Boolean(rememberMe))

        return res.status(200).json({
            message: "Logged in successfully",
            user: publicUser(updated)
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
        const generic = { message: "If that account exists, a reset code has been sent." }
        if (!user) return res.status(200).json(generic)

        const otp = generateOtp()
        await userRepository.updateById(user.id, {
            otpHash: hashOtp(otp),
            otpPurpose: "reset-password",
            otpExpiry: otpExpiryDate()
        })

        sendOtpEmail(user.email, otp, "reset-password").catch((err) => {
            console.error("Failed to send reset-password email:", err.message)
        })
        return res.status(200).json(generic)
    } catch (error) {
        return res.status(500).json({ message: "Internal server error" })
    }
}

const resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body
        if (!email || !otp || !newPassword) {
            return res.status(400).json({ message: "Email, code, and new password are required" })
        }

        const passwordError = validatePassword(newPassword)
        if (passwordError) {
            return res.status(400).json({ message: passwordError, errors: { newPassword: passwordError } })
        }

        const user = await userRepository.findByEmail(email.trim().toLowerCase())
        if (!user || !user.otpHash || user.otpPurpose !== "reset-password") {
            return res.status(400).json({ message: "Invalid or expired code" })
        }
        if (user.otpExpiry < new Date()) {
            return res.status(400).json({ message: "That code has expired. Request a new one." })
        }
        if (hashOtp(otp) !== user.otpHash) {
            return res.status(400).json({ message: "Incorrect code" })
        }

        const sameAsBefore = await bcrypt.compare(newPassword, user.password)
        if (sameAsBefore) {
            return res.status(400).json({
                message: "New password must be different from your current password",
                errors: { newPassword: "Must be different from your current password" }
            })
        }

        await userRepository.updateById(user.id, {
            password: await bcrypt.hash(newPassword, BCRYPT_ROUNDS),
            otpHash: null,
            otpPurpose: null,
            otpExpiry: null,
            failedLoginAttempts: 0,
            lockUntil: null,
            tokenVersion: user.tokenVersion + 1
        })

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
        res.clearCookie("token", {
            httpOnly: true,
            secure: true,
            sameSite: "None",
            path: "/"
        });
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

        res.clearCookie("token", {
            httpOnly: true,
            secure: true,
            sameSite: "None",
            path: "/"
        });

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
