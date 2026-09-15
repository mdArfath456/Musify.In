const express = require("express")
const router = express.Router()
const rateLimit = require("express-rate-limit")
const authController = require("../controller/user.controller")
const authMiddleware = require("../middlewares/auth.middleware")

// Every sensitive endpoint gets its OWN limiter instance — sharing one
// object across routes means requests to one endpoint eat into another's
// quota (e.g. resend-otp attempts silently blocking verify-otp attempts).
const registerLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many signup attempts. Try again later." }
})
const loginLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many login attempts. Wait a minute and try again." }
})
const verifyOtpLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many attempts. Wait a minute and try again." }
})
const resendOtpLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 3,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many code requests. Wait a minute and try again." }
})
const forgotPasswordLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 3,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many reset requests. Wait a minute and try again." }
})
const resetPasswordLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many attempts. Wait a minute and try again." }
})

router.post("/register", registerLimiter, authController.registerUser)
router.post("/verify-otp", verifyOtpLimiter, authController.verifyOtp)
router.post("/resend-otp", resendOtpLimiter, authController.resendOtp)
router.post("/login", loginLimiter, authController.userLogin)
router.post("/forgot-password", forgotPasswordLimiter, authController.forgotPassword)
router.post("/reset-password", resetPasswordLimiter, authController.resetPassword)
router.get("/check-availability", authController.checkAvailability)
router.post("/logout", authController.userLogout)
router.post("/logout-all", authMiddleware.authAnyUser, authController.logoutAllDevices)

module.exports = router