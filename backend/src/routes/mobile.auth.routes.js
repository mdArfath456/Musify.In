const express = require("express")
const rateLimit = require("express-rate-limit")
const authController = require("../controller/user.controller")

const router = express.Router()

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
    max: 10,
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

router.post("/register", registerLimiter, authController.mobileRegisterUser)
router.post("/login", loginLimiter, authController.mobileLogin)
router.post("/verify-otp", verifyOtpLimiter, authController.mobileVerifyOtp)
router.post("/resend-otp", resendOtpLimiter, authController.mobileResendOtp)
router.post("/forgot-password", forgotPasswordLimiter, authController.mobileForgotPassword)
router.post("/verify-reset-otp", verifyOtpLimiter, authController.mobileVerifyResetOtp)
router.post("/reset-password", resetPasswordLimiter, authController.mobileResetPassword)

module.exports = router
